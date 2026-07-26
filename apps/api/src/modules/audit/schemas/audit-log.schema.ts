import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import type { AuditAction } from "@kedland/types";

/**
 * One entry in the trail.
 *
 * Append-only by design: the service exposes no update or delete, and no
 * controller route reaches them. A history that can be edited answers no
 * questions worth asking.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "audit_logs" })
export class AuditLog {
  /** Null for events with no signed-in actor, such as a failed sign-in. */
  @Prop({ type: Types.ObjectId, ref: "User", default: null, index: true })
  actorId!: Types.ObjectId | null;

  /** Kept alongside the id: an account can be deleted, the trail should not lose who. */
  @Prop({ type: String, default: null })
  actorEmail!: string | null;

  @Prop({ required: true, index: true })
  action!: AuditAction;

  @Prop({ required: true })
  entityType!: string;

  @Prop({ type: String, default: null })
  entityId!: string | null;

  /** What changed. Never contains a password, a token or a hash. */
  @Prop({ type: Object, default: null })
  changes!: Record<string, unknown> | null;

  /** Hashed, not raw: the trail should not become a log of staff home addresses. */
  @Prop({ type: String, default: null })
  ipHash!: string | null;

  @Prop()
  createdAt!: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLog>;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
