import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import type { PageKey } from "@kedland/types";

/**
 * One section's values on one page.
 *
 * Mongo stores only `data`. Which sections exist, in what order, and which
 * schema validates each is declared in `@kedland/types`' registry — in code,
 * reviewed in a pull request. This collection cannot introduce a section,
 * remove one, or move one.
 */
@Schema({ timestamps: true, collection: "page_sections" })
export class PageSection {
  @Prop({ required: true, index: true })
  page!: PageKey;

  @Prop({ required: true })
  key!: string;

  /** Mirrors the registry. Written by the seed; never editable through the API. */
  @Prop({ required: true })
  order!: number;

  /** Validated against the registry's schema for this section before it lands. */
  @Prop({ type: Object, required: true })
  data!: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  updatedById!: Types.ObjectId | null;
}

export type PageSectionDocument = HydratedDocument<PageSection>;
export const PageSectionSchema = SchemaFactory.createForClass(PageSection);

// One document per (page, key). The upsert in the seed relies on this.
PageSectionSchema.index({ page: 1, key: 1 }, { unique: true });
PageSectionSchema.index({ page: 1, order: 1 });
