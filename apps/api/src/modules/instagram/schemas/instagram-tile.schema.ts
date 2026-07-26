import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true, collection: "instagram_tiles" })
export class InstagramTile {
  @Prop({ required: true, trim: true })
  mediaId!: string;

  @Prop({ required: true, trim: true })
  caption!: string;

  @Prop({ required: true, trim: true })
  href!: string;

  @Prop({ required: true, min: 0, default: 0 })
  order!: number;

  @Prop({ required: true, default: false, index: true })
  published!: boolean;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  updatedById!: Types.ObjectId | null;

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export type InstagramTileDocument = HydratedDocument<InstagramTile>;
export const InstagramTileSchema = SchemaFactory.createForClass(InstagramTile);
InstagramTileSchema.index({ published: 1, order: 1 });
