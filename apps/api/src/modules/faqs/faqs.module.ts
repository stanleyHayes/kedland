import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AdminFaqsController, PublicFaqsController } from "./faqs.controller";
import { FaqsService } from "./faqs.service";
import { Faq, FaqSchema } from "./schemas/faq.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }])],
  controllers: [PublicFaqsController, AdminFaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
