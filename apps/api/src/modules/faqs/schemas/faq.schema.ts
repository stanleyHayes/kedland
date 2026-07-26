import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { faqGroupSchema, type FaqGroup } from "@kedland/types";

@Schema({ timestamps: true, collection: "faqs" })
export class Faq {
  @Prop({ required: true, enum: faqGroupSchema.options, index: true })
  group!: FaqGroup;

  @Prop({ required: true, trim: true })
  question!: string;

  @Prop({ required: true, trim: true })
  answer!: string;

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

export type FaqDocument = HydratedDocument<Faq>;
export const FaqSchema = SchemaFactory.createForClass(Faq);

FaqSchema.index({ group: 1, order: 1 });
