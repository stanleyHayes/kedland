import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import {
  enquiryStatusSchema,
  enquiryTopicSchema,
  schoolLevelSchema,
  type EnquiryStatus,
  type EnquiryTopic,
  type SchoolLevel,
} from "@kedland/types";

/**
 * A parent's enquiry, as stored.
 *
 * Note what is absent: no Turnstile token (single-use, worthless once spent)
 * and nothing that identifies a child. The build package is explicit that
 * admissions happen on paper at the office, so this collection never becomes a
 * store of children's personal data.
 *
 * The `enum` constraints are taken from the shared Zod enums rather than
 * written out again, so Mongo cannot accept a status the rest of the system
 * does not recognise.
 */
@Schema({ timestamps: true, collection: "enquiries" })
export class Enquiry {
  @Prop({ required: true, trim: true })
  parentName!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, enum: enquiryTopicSchema.options, default: "general" })
  topic!: EnquiryTopic;

  @Prop({ required: true, enum: schoolLevelSchema.options, default: "not-sure" })
  level!: SchoolLevel;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ required: true, enum: enquiryStatusSchema.options, default: "new", index: true })
  status!: EnquiryStatus;

  /**
   * Whether the school was successfully emailed.
   *
   * Separate from `status` on purpose: an enquiry is saved before delivery is
   * attempted, so `notified: false` marks the ones somebody has to be told
   * about by other means.
   */
  @Prop({ required: true, default: false })
  notified!: boolean;

  @Prop({ type: Date, default: null })
  handledAt!: Date | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  handledById!: Types.ObjectId | null;
}

export type EnquiryDocument = HydratedDocument<Enquiry>;
export const EnquirySchema = SchemaFactory.createForClass(Enquiry);

// The dashboard's default view: newest first, optionally filtered by status.
EnquirySchema.index({ status: 1, createdAt: -1 });
// And the same view *unfiltered*, which the compound index above cannot serve:
// a { status, createdAt } index is only useful to a query that constrains
// `status`, so the inbox's default "everything, newest first" would otherwise
// be a collection scan and an in-memory sort.
EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ notified: 1 });
