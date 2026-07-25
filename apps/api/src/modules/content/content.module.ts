import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { AdminContentController, ContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { PageSection, PageSectionSchema } from "./schemas/page-section.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: PageSection.name, schema: PageSectionSchema }])],
  controllers: [ContentController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
