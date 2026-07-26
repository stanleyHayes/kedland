import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { MediaModule } from "../media/media.module";

import { AdminInstagramController, PublicInstagramController } from "./instagram.controller";
import { InstagramService } from "./instagram.service";
import { InstagramTile, InstagramTileSchema } from "./schemas/instagram-tile.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: InstagramTile.name, schema: InstagramTileSchema }]),
    MediaModule,
  ],
  controllers: [PublicInstagramController, AdminInstagramController],
  providers: [InstagramService],
  exports: [InstagramService],
})
export class InstagramModule {}
