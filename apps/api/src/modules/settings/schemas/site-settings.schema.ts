import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import type { SiteSettingsInput } from "@kedland/types";

@Schema({ timestamps: true, collection: "site_settings" })
export class SiteSettings {
  @Prop({ required: true, unique: true, default: "site" })
  key!: string;

  @Prop({ type: Object, required: true })
  contact!: SiteSettingsInput["contact"];

  @Prop({ required: true, default: "" })
  hours!: string;

  @Prop({ type: Object, required: true })
  socials!: SiteSettingsInput["socials"];

  @Prop({ type: Object, required: true })
  seoDefaults!: SiteSettingsInput["seoDefaults"];

  @Prop({ required: true, default: "" })
  admissionFormUrl!: string;

  @Prop({ required: true, default: "" })
  footerNote!: string;

  @Prop({ type: Object, required: true })
  announcementBanner!: SiteSettingsInput["announcementBanner"];

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  updatedById!: Types.ObjectId | null;

  @Prop()
  updatedAt!: Date;
}

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;
export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
