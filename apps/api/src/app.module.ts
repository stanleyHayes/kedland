import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { configFactories } from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configFactories,
      // Throws on a bad environment, which aborts the boot. Intentional.
      validate: validateEnv,
      envFilePath: [".env.local", ".env"],
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>("database.uri"),
        dbName: config.getOrThrow<string>("database.dbName"),
      }),
    }),

    // A school site does not need a high ceiling, and a low one is the cheapest
    // defence the contact form has. Per-route limits tighten further on
    // /auth/login and /enquiries.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),

    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
