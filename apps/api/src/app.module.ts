import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";
import { configFactories } from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { SeedService } from "./database/seeds/seed.service";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ContentModule } from "./modules/content/content.module";
import { EnquiriesModule } from "./modules/enquiries/enquiries.module";
import { HealthModule } from "./modules/health/health.module";
import { RevisionsModule } from "./modules/revisions/revisions.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configFactories,
      // Throws on a bad environment, which aborts the boot. Intentional.
      validate: validateEnv,
      envFilePath: [".env.local", ".env", "../../.env"],
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("database.uri"),
        dbName: config.getOrThrow<string>("database.dbName"),
      }),
    }),

    // The global guard needs to verify tokens, so JwtModule must be available
    // at the root as well as inside AuthModule.
    JwtModule.register({}),

    // A school site does not need a high ceiling, and a low one is the cheapest
    // defence the contact form has. Per-route limits tighten further on
    // /auth/login and /enquiries.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: "default",
          ttl: config.getOrThrow<number>("throttle.ttlMs"),
          limit: config.getOrThrow<number>("throttle.limit"),
        },
      ],
    }),

    AuditModule,
    RevisionsModule,
    UsersModule,
    AuthModule,
    ContentModule,
    EnquiriesModule,
    HealthModule,
  ],
  providers: [
    SeedService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Order matters: rate limit, then authenticate, then authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
