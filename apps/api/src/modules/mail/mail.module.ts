import { Module } from "@nestjs/common";

import { MailService } from "./mail.service";

/**
 * Outbound email.
 *
 * Its own module because two unrelated features need it — telling the office
 * about an enquiry, and inviting a member of staff — and a shared service
 * reached through one of those features' modules is how an import cycle starts.
 */
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
