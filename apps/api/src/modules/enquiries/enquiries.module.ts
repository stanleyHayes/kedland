import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AdminEnquiriesController, EnquiriesController } from "./enquiries.controller";
import { EnquiriesService } from "./enquiries.service";
import { MailService } from "./mail.service";
import { Enquiry, EnquirySchema } from "./schemas/enquiry.schema";
import { TurnstileService } from "./turnstile.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: Enquiry.name, schema: EnquirySchema }])],
  controllers: [EnquiriesController, AdminEnquiriesController],
  providers: [EnquiriesService, MailService, TurnstileService],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
