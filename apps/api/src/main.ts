import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { SeedService } from "./database/seeds/seed.service";

import type { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const isProduction = config.getOrThrow<boolean>("app.isProduction");

  /*
   * Behind Render's load balancer every request arrives from the proxy, so
   * `req.ip` is the proxy's address unless Express is told to trust the
   * `X-Forwarded-For` header. Without this the throttler sees one IP for the
   * entire internet: the enquiry form's five-per-minute limit and the login
   * endpoint's eight-per-minute limit become global buckets that one visitor
   * can exhaust for everybody, and the audit trail records the proxy's address
   * for every action.
   *
   * `1` — trust exactly one hop, the platform's own proxy. `true` would trust
   * the whole chain and let a caller forge any address they like by sending
   * their own X-Forwarded-For.
   */
  app.set("trust proxy", 1);

  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  app.use(
    helmet({
      // The API serves JSON, never HTML, so a restrictive default is free.
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: "same-site" },
      hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
    }),
  );

  // An allowlist, never `*` — the API answers to the two Next apps and nothing else.
  app.enableCors({
    origin: config.getOrThrow<string[]>("app.corsOrigins"),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // A request carrying fields we do not recognise is a bug or a probe.
      // Either way, telling the sender beats silently dropping them.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  /*
   * Render's runtime image intentionally contains compiled production code
   * only, so the TypeScript seed command is not available after deployment.
   * Running the non-destructive seed during production boot keeps starter
   * posts, FAQs and media present on a fresh database while `ensureStarter`
   * leaves every record authored in the dashboard untouched.
   */
  if (isProduction) {
    const seedSummary = await app.get(SeedService).run({ force: false });
    Logger.log(
      Object.entries(seedSummary)
        .map(([name, result]) => `${name}: ${result}`)
        .join(" | "),
      "BootstrapSeed",
    );
  }

  if (!isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Kedland International School API")
        .setDescription("Content, blog, enquiries and media for the Kedland website and dashboard")
        .setVersion("1.0")
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = config.getOrThrow<number>("app.port");
  await app.listen(port, "0.0.0.0");

  Logger.log(
    `API listening on :${String(port)} (${isProduction ? "production" : "development"})`,
    "Bootstrap",
  );
}

void bootstrap();
