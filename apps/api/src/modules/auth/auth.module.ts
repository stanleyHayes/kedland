import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";

import { UsersModule } from "../users/users.module";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MfaService } from "./mfa.service";
import { RefreshToken, RefreshTokenSchema } from "./schemas/refresh-token.schema";

@Module({
  imports: [
    UsersModule,
    // Secrets are passed per-call rather than registered here: access and
    // refresh tokens are signed with different keys, and a module-level default
    // would make it easy to sign one with the other by accident.
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: RefreshToken.name, schema: RefreshTokenSchema }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, MfaService],
  exports: [AuthService, MfaService],
})
export class AuthModule {}
