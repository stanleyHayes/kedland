import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { SYSTEM_ROLES, withImpliedReads, type Permission } from "@kedland/types";

import { Role, type RoleDocument } from "./schemas/role.schema";

export interface RoleInputData {
  name: string;
  /**
   * `| undefined` explicitly, because `exactOptionalPropertyTypes` is on: an
   * absent key and a key set to `undefined` are different types here, and Zod's
   * `.optional()` produces the latter.
   */
  description?: string | null | undefined;
  permissions: readonly string[];
}

/**
 * A partial update.
 *
 * Spelt out rather than `Partial<RoleInputData>` because
 * `exactOptionalPropertyTypes` distinguishes an absent key from one set to
 * `undefined`, and Zod's `.partial()` produces the second. Every field here
 * treats `undefined` as "leave this alone".
 */
export interface RoleUpdateData {
  name?: string | undefined;
  description?: string | null | undefined;
  permissions?: readonly string[] | undefined;
}

/** Lower case words separated by single dashes. Matches `roleSlugSchema`. */
export function slugifyRoleName(name: string): string {
  // Split-filter-join rather than replace-then-trim-the-dashes. An anchored
  // `-+$` backtracks on a long run of dashes, which a pasted name can supply,
  // and the two-step version needed a second pass to remove the dashes the
  // first one had just introduced at the ends.
  return name
    .toLowerCase()
    .trim()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-");
}

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private readonly roles: Model<RoleDocument>) {}

  /**
   * Creates the three roles the school starts with, if they are missing.
   *
   * Idempotent, and deliberately **does not** overwrite an existing role's
   * permissions. If an administrator has tightened `editor`, a deploy must not
   * silently hand the privileges back — that is the kind of change nobody
   * notices until it matters.
   */
  async ensureSystemRoles(): Promise<{ created: string[] }> {
    const created: string[] = [];

    for (const seed of SYSTEM_ROLES) {
      const exists = await this.roles.exists({ slug: seed.slug });
      if (exists) continue;

      await this.roles.create({
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        permissions: withImpliedReads(seed.permissions),
        isSystem: true,
      });
      created.push(seed.slug);
    }

    return { created };
  }

  async findAll(): Promise<RoleDocument[]> {
    // System roles first, then alphabetically: the list reads as "the three you
    // started with, then the ones you made".
    return this.roles.find().sort({ isSystem: -1, name: 1 }).exec();
  }

  async findBySlug(slug: string): Promise<RoleDocument | null> {
    return this.roles.findOne({ slug: slug.toLowerCase().trim() }).exec();
  }

  async findBySlugOrFail(slug: string): Promise<RoleDocument> {
    const role = await this.findBySlug(slug);
    if (!role) throw new NotFoundException("No such role");
    return role;
  }

  async findByIdOrFail(id: string): Promise<RoleDocument> {
    const role = await this.roles.findById(id).exec();
    if (!role) throw new NotFoundException("No such role");
    return role;
  }

  async create(input: RoleInputData): Promise<RoleDocument> {
    const slug = slugifyRoleName(input.name);
    if (slug.length === 0) {
      throw new BadRequestException("A role needs a name with at least one letter or number");
    }

    if (await this.roles.exists({ slug })) {
      throw new ConflictException("A role with that name already exists");
    }

    return this.roles.create({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      permissions: withImpliedReads(input.permissions),
      isSystem: false,
    });
  }

  /**
   * Updates a role.
   *
   * A system role's permissions can be changed — a school may well want its
   * editors to have less — but its slug cannot, because code and existing user
   * records refer to it by that slug.
   */
  async update(id: string, input: RoleUpdateData): Promise<RoleDocument> {
    const role = await this.findByIdOrFail(id);

    if (input.name !== undefined && role.isSystem && slugifyRoleName(input.name) !== role.slug) {
      throw new BadRequestException(`"${role.name}" is a built-in role and cannot be renamed`);
    }

    if (input.name !== undefined && !role.isSystem) {
      const slug = slugifyRoleName(input.name);
      if (slug.length === 0) {
        throw new BadRequestException("A role needs a name with at least one letter or number");
      }
      if (slug !== role.slug && (await this.roles.exists({ slug }))) {
        throw new ConflictException("A role with that name already exists");
      }
      role.slug = slug;
      role.name = input.name.trim();
    }

    if (input.description !== undefined) {
      role.description = input.description?.trim() ?? null;
    }

    if (input.permissions !== undefined) {
      role.permissions = withImpliedReads(input.permissions);
    }

    return role.save();
  }

  /**
   * Deletes a role.
   *
   * Users created from it are untouched: their permissions are their own, so
   * removing the template cannot take anyone's access away. `roleSlug` on those
   * users becomes a record of a role that no longer exists, which is accurate
   * and is how the dashboard shows it.
   */
  async remove(id: string): Promise<void> {
    const role = await this.findByIdOrFail(id);

    if (role.isSystem) {
      throw new ConflictException(`"${role.name}" is a built-in role and cannot be deleted`);
    }

    await this.roles.deleteOne({ _id: id }).exec();
  }

  /** The permission list a new user created from this role starts with. */
  async permissionsForSlug(slug: string): Promise<Permission[]> {
    const role = await this.findBySlugOrFail(slug);
    return withImpliedReads(role.permissions);
  }
}
