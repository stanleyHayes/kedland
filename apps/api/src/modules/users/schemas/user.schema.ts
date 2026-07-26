import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import type { Permission, UserStatus } from "@kedland/types";

/**
 * A staff account.
 *
 * Deliberately few: build package §5.4 specifies two or three authorised
 * people, and the previous site's failure was uncontrolled access. There is no
 * public registration route — accounts are created by an admin or by the seed.
 */
@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  /** Argon2id. Never selected by default — see the service's projections. */
  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  /**
   * The role this account was created or invited from.
   *
   * A record of provenance, not a live link. The authority is `permissions`
   * below — editing the role later does not rewrite this user, and editing this
   * user does not touch the role. The dashboard shows it as "created from
   * Editor", and shows a note when the two have since diverged.
   *
   * A free-form string rather than a reference, so deleting a role cannot
   * cascade into anyone's access. If the role is gone this still says which one
   * it was, which is what an administrator reading an audit trail needs.
   */
  @Prop({ required: true, trim: true, lowercase: true, default: "editor" })
  roleSlug!: string;

  /**
   * What this account may actually do.
   *
   * Always stored complete: every write permission is accompanied by its
   * implied read (see `withImpliedReads`). Never trust that, though — a
   * document written by an older build or by hand in a database shell may not
   * obey it, so the read path completes the list again.
   */
  @Prop({ type: [String], default: [] })
  permissions!: Permission[];

  /**
   * When `permissions` last changed.
   *
   * Access tokens minted before this are refused, exactly as with
   * `passwordChangedAt` — so revoking a permission takes effect on the next
   * request rather than whenever the holder's 15-minute token happens to
   * expire. Enforced in `JwtAuthGuard`.
   */
  @Prop({ type: Date, default: null })
  permissionsChangedAt!: Date | null;

  /**
   * Set on an invited account until they choose a password.
   *
   * Kept separate from `status` because it is not a moderation state: an
   * invited account is not suspended, it is simply not finished. The dashboard
   * lists these as "Invited" and offers to send the email again.
   */
  @Prop({ type: Boolean, default: false })
  isInvited!: boolean;

  @Prop({ required: true, enum: ["active", "suspended"], default: "active" })
  status!: UserStatus;

  @Prop({ type: Date, default: null })
  lastLoginAt!: Date | null;

  /**
   * When the password last changed.
   *
   * Access tokens issued before this are refused, so a password change ends
   * every other session — which is the whole point of changing it after a
   * suspected compromise.
   */
  @Prop({ type: Date, default: null })
  passwordChangedAt!: Date | null;

  /** Consecutive failures. Reset on any success. */
  @Prop({ type: Number, default: 0 })
  failedAttempts!: number;

  /** Set when `failedAttempts` crosses the threshold; blocks sign-in until past. */
  @Prop({ type: Date, default: null })
  lockedUntil!: Date | null;

  /** Hashed. A raw reset token is never stored, only ever emailed. */
  @Prop({ type: String, default: null, select: false })
  passwordResetTokenHash!: string | null;

  @Prop({ type: Date, default: null, select: false })
  passwordResetExpiresAt!: Date | null;

  /**
   * Declared so a timestamp reads as a typed `Date` rather than through
   * `get("createdAt")`, which is `any`.
   *
   * `timestamps: true` above is what actually maintains them; these only give
   * the compiler the shape. Same reasoning as `post.schema.ts`.
   */
  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

// The unique index on `email` comes from `@Prop({ unique: true, index: true })`
// above — declaring it again here would create a duplicate.
