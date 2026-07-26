import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import type { Permission } from "@kedland/types";

/**
 * A named set of permissions an administrator can hand out.
 *
 * A role is a **template, not a live link**. Creating a user from a role copies
 * its permissions onto that user; editing the role afterwards does not reach
 * back and rewrite them, and editing a user does not alter the role. That is
 * what lets the school give one editor the ability to delete a post without
 * granting it to every editor — see the note at the top of
 * `packages/types/src/rbac.ts`.
 *
 * The consequence worth being explicit about: a role's permission list is what
 * *new* users get, and the list of users created from it is not a list of users
 * who currently match it. The dashboard says so where it matters.
 */
@Schema({ timestamps: true, collection: "roles" })
export class Role {
  /** Stable identifier. The name is what people read; this is what code stores. */
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, default: null, trim: true })
  description!: string | null;

  /**
   * Already completed with implied reads by the service — never trust that a
   * document written by an older build, or by hand in a database shell, obeys
   * the rule.
   */
  @Prop({ type: [String], default: [] })
  permissions!: Permission[];

  /**
   * A role the system depends on and will not let anyone delete or rename.
   *
   * `administrator` is the one that matters: a school that deletes it has
   * locked itself out of its own dashboard with no way back short of a database
   * console.
   */
  @Prop({ type: Boolean, default: false })
  isSystem!: boolean;

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

export type RoleDocument = HydratedDocument<Role>;
export const RoleSchema = SchemaFactory.createForClass(Role);

// The unique index on `slug` comes from `@Prop({ unique: true, index: true })`
// above — declaring it again here would create a duplicate.
