import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MediaController, PublicMediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { Media, MediaSchema } from "./schemas/media.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }])],
  controllers: [PublicMediaController, MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
