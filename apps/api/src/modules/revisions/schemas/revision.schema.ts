import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

/**
 * A point-in-time snapshot of a document.
 *
 * Every content and post edit writes one before applying the change, so a
 * mistaken edit is a restore rather than an incident. agent_plan §0.2 lists
 * this as one of the guardrails that make an editable CMS safe here.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "revisions" })
export class Revision {
  @Prop({ required: true, index: true })
  entityType!: string;

  @Prop({ required: true, index: true })
  entityId!: string;

  /** Monotonic per entity, starting at 1. */
  @Prop({ required: true })
  version!: number;

  /** The document's state *before* the change this revision records. */
  @Prop({ type: Object, required: true })
  snapshot!: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  createdById!: Types.ObjectId | null;

  /** Optional human note, e.g. "restored version 3". */
  @Prop({ type: String, default: null })
  note!: string | null;
}

export type RevisionDocument = HydratedDocument<Revision>;
export const RevisionSchema = SchemaFactory.createForClass(Revision);

RevisionSchema.index({ entityType: 1, entityId: 1, version: -1 }, { unique: true });
