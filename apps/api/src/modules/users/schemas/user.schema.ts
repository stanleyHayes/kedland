import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import type { UserRole, UserStatus } from "@kedland/types";

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

  @Prop({ required: true, enum: ["admin", "editor"], default: "editor" })
  role!: UserRole;

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
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

// The unique index on `email` comes from `@Prop({ unique: true, index: true })`
// above — declaring it again here would create a duplicate.
