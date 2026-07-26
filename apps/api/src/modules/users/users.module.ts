import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MailModule } from "../mail/mail.module";
import { RolesModule } from "../roles/roles.module";

import { User, UserSchema } from "./schemas/user.schema";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

/**
 * Note the direction: users depends on roles, not the other way round.
 *
 * `RolesService` never reads a user — deleting a role deliberately does not
 * cascade into anyone's permissions — so the dependency only points one way and
 * there is no cycle to break.
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), RolesModule, MailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
