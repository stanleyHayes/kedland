import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { getPage, getSection, PAGE_REGISTRY, validateSectionData, type PageKey } from "@kedland/types";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { RevisionsService } from "../revisions/revisions.service";

import { PageSection, type PageSectionDocument } from "./schemas/page-section.schema";

/** What the public site receives for one section. */
export interface PublicSection {
  key: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(PageSection.name) private readonly sections: Model<PageSectionDocument>,
    private readonly revisions: RevisionsService,
    private readonly audit: AuditService,
    private readonly revalidate: RevalidateService,
  ) {}

  /**
   * A page's sections, in registry order.
   *
   * Order comes from the registry rather than the stored `order` field: if the
   * two ever disagree, the code is right and the database is stale. A section
   * with no stored values is omitted rather than rendered empty.
   */
  async getPage(page: PageKey): Promise<PublicSection[]> {
    const definition = getPage(page);
    if (!definition) throw new NotFoundException(`No such page: ${page}`);

    const stored = await this.sections.find({ page }).exec();
    const byKey = new Map(stored.map((section) => [section.key, section]));

    return definition.sections.flatMap((section, index) => {
      const document = byKey.get(section.key);
      if (!document) return [];

      return [{ key: section.key, type: section.type, order: index, data: document.data }];
    });
  }

  /** Every page's sections, for the dashboard's page list. */
  async listPages(): Promise<{ page: PageKey; label: string; sectionCount: number }[]> {
    const counts = await this.sections.aggregate<{ _id: PageKey; count: number }>([
      { $group: { _id: "$page", count: { $sum: 1 } } },
    ]);
    const byPage = new Map(counts.map((row) => [row._id, row.count]));

    return [...PAGE_REGISTRY.values()].map((definition) => ({
      page: definition.key,
      label: definition.label,
      sectionCount: byPage.get(definition.key) ?? 0,
    }));
  }

  /**
   * Updates one section's values.
   *
   * The only mutation the dashboard can perform on page content. The payload is
   * validated against the registry's schema for this exact (page, key) before
   * anything is written, and the previous state is snapshotted first so the
   * edit is undoable.
   */
  async updateSection(
    page: PageKey,
    key: string,
    data: unknown,
    actorId: string,
  ): Promise<PageSectionDocument> {
    const definition = getSection(page, key);
    if (!definition) throw new NotFoundException(`No section "${key}" on page "${page}"`);

    const parsed = validateSectionData(page, key, data);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Validation failed",
        errors: fieldErrors(parsed.error.issues),
      });
    }

    const existing = await this.sections.findOne({ page, key }).exec();
    if (!existing) throw new NotFoundException(`Section "${key}" has not been seeded on "${page}"`);

    await this.revisions.snapshot({
      entityType: "page-section",
      entityId: existing.id,
      snapshot: existing.data,
      createdById: actorId,
    });

    existing.data = parsed.data as Record<string, unknown>;
    existing.updatedById = new Types.ObjectId(actorId);
    await existing.save();

    await this.audit.record({
      actorId,
      action: "update",
      entityType: "page-section",
      entityId: existing.id,
      changes: { page, key },
    });

    // The site caches each page's content under `content:<page>` for an hour.
    // Without this the edit is saved and simply does not appear — an editor
    // fixing a wrong phone number would see the old one for up to an hour and
    // reasonably conclude the dashboard was broken.
    //
    // `restoreSection` routes through here too, so it is covered by the same
    // call rather than needing its own.
    await this.revalidate.page(page);

    return existing;
  }

  /** Restores a previous version. The restore is itself snapshotted first. */
  async restoreSection(
    page: PageKey,
    key: string,
    version: number,
    actorId: string,
  ): Promise<PageSectionDocument> {
    const existing = await this.sections.findOne({ page, key }).exec();
    if (!existing) throw new NotFoundException(`No section "${key}" on page "${page}"`);

    const snapshot = await this.revisions.snapshotFor("page-section", existing.id, version);

    // Re-validate: a snapshot predates the current schema and may no longer
    // satisfy it. Restoring invalid data would break the page it belongs to.
    const parsed = validateSectionData(page, key, snapshot);
    if (!parsed.success) {
      throw new BadRequestException(
        `Version ${String(version)} no longer matches this section's schema and cannot be restored`,
      );
    }

    return this.updateSection(page, key, snapshot, actorId);
  }

  /** Upserts a section's values. Seed-only — it is the one path that may create. */
  async upsert(page: PageKey, key: string, order: number, data: Record<string, unknown>): Promise<void> {
    await this.sections
      .updateOne({ page, key }, { $set: { page, key, order, data } }, { upsert: true })
      .exec();
  }

  async exists(page: PageKey, key: string): Promise<boolean> {
    return (await this.sections.exists({ page, key })) !== null;
  }
}

/** Turns Zod issues into the field-keyed shape the dashboard's forms expect. */
function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  for (const issue of issues) {
    const field = issue.path.map(String).join(".") || "_";
    grouped[field] = [...(grouped[field] ?? []), issue.message];
  }

  return grouped;
}
