import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

/**
 * An image in the school's library.
 *
 * The file itself lives in Cloudinary; this is the record of it, and the place
 * its alt text lives. Alt text belongs to the image rather than to each place
 * the image is used: the same photograph on three pages should not need
 * describing three times, and an undescribed image is one a screen-reader user
 * simply cannot see.
 */
@Schema({ timestamps: true, collection: "media" })
export class Media {
  /** Cloudinary's identifier. Unique — it is the same file otherwise. */
  @Prop({ required: true, trim: true })
  publicId!: string;

  @Prop({ required: true, trim: true })
  url!: string;

  @Prop({ required: true, trim: true })
  alt!: string;

  @Prop({ required: true })
  width!: number;

  @Prop({ required: true })
  height!: number;

  @Prop({ required: true, trim: true })
  format!: string;

  @Prop({ required: true })
  bytes!: number;

  @Prop({ required: true, default: false, index: true })
  depictsPupils?: boolean;

  @Prop({ required: true, default: false })
  consentOnFile?: boolean;

  @Prop({ type: String, default: null, trim: true })
  consentRef!: string | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  uploadedById!: Types.ObjectId | null;

  /** Written by `timestamps: true`; declared so reads need no cast. */
  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export type MediaDocument = HydratedDocument<Media>;
export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ publicId: 1 }, { unique: true });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ depictsPupils: 1, consentOnFile: 1 });
