import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MailModule } from "../mail/mail.module";

import { AdminEnquiriesController, EnquiriesController } from "./enquiries.controller";
import { EnquiriesService } from "./enquiries.service";
import { Enquiry, EnquirySchema } from "./schemas/enquiry.schema";
import { TurnstileService } from "./turnstile.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Enquiry.name, schema: EnquirySchema }]), MailModule],
  controllers: [EnquiriesController, AdminEnquiriesController],
  providers: [EnquiriesService, TurnstileService],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
