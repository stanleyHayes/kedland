import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

/**
 * A refresh token, stored as a hash.
 *
 * Rotation with reuse detection: each refresh mints a new token and revokes the
 * one presented. Tokens issued from the same original sign-in share a `family`.
 * If an already-revoked token is presented, that means someone is replaying a
 * stolen one, and the entire family is revoked — the thief and the real user
 * both get logged out, which is the correct outcome.
 */
@Schema({ timestamps: true, collection: "refresh_tokens" })
export class RefreshToken {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  /** SHA-256 of the token. The raw value only ever exists in the response. */
  @Prop({ required: true, unique: true, index: true })
  tokenHash!: string;

  /** Shared by every token descended from one sign-in. */
  @Prop({ required: true, index: true })
  family!: string;

  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;

  /** The token that replaced this one, for tracing a rotation chain. */
  @Prop({ type: String, default: null })
  replacedByHash!: string | null;

  @Prop({ type: String, default: null })
  userAgent!: string | null;

  @Prop({ type: String, default: null })
  ipHash!: string | null;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

// Expired tokens clean themselves up rather than accumulating forever.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
