import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Revision, type RevisionDocument } from "./schemas/revision.schema";

/**
 * How many snapshots to keep per document.
 *
 * Enough to undo a bad afternoon, not so many that the collection grows without
 * bound. The school edits a page a handful of times a year; twenty versions is
 * years of history.
 */
export const MAX_REVISIONS_PER_ENTITY = 20;

export interface SnapshotInput {
  entityType: string;
  entityId: string;
  snapshot: Record<string, unknown>;
  createdById?: string | null;
  note?: string | null;
}

@Injectable()
export class RevisionsService {
  constructor(@InjectModel(Revision.name) private readonly revisions: Model<RevisionDocument>) {}

  /** The next version number for an entity. Versions start at 1. */
  private async nextVersion(entityType: string, entityId: string): Promise<number> {
    const latest = await this.revisions
      .findOne({ entityType, entityId })
      .sort({ version: -1 })
      .select("version")
      .exec();

    return (latest?.version ?? 0) + 1;
  }

  /**
   * Records the state of a document *before* it changes.
   *
   * Call this in the same operation as the update. Snapshotting after the fact
   * would store the new state and make the history useless for undoing.
   */
  async snapshot(input: SnapshotInput): Promise<RevisionDocument> {
    const version = await this.nextVersion(input.entityType, input.entityId);

    const revision = await this.revisions.create({
      entityType: input.entityType,
      entityId: input.entityId,
      version,
      snapshot: input.snapshot,
      createdById: input.createdById != null ? new Types.ObjectId(input.createdById) : null,
      note: input.note ?? null,
    });

    await this.prune(input.entityType, input.entityId);
    return revision;
  }

  /** Drops the oldest snapshots once an entity is over the cap. */
  private async prune(entityType: string, entityId: string): Promise<void> {
    const total = await this.revisions.countDocuments({ entityType, entityId }).exec();
    if (total <= MAX_REVISIONS_PER_ENTITY) return;

    const excess = await this.revisions
      .find({ entityType, entityId })
      .sort({ version: 1 })
      .limit(total - MAX_REVISIONS_PER_ENTITY)
      .select("_id")
      .exec();

    await this.revisions.deleteMany({ _id: { $in: excess.map((r) => r._id) } }).exec();
  }

  async list(entityType: string, entityId: string): Promise<RevisionDocument[]> {
    return this.revisions.find({ entityType, entityId }).sort({ version: -1 }).exec();
  }

  async findVersion(entityType: string, entityId: string, version: number): Promise<RevisionDocument> {
    const revision = await this.revisions.findOne({ entityType, entityId, version }).exec();
    if (!revision) throw new NotFoundException(`No version ${String(version)} of that item`);
    return revision;
  }

  /**
   * Returns the stored state of a version, for a caller to write back.
   *
   * Restoring is the caller's job, not this service's: only the owning module
   * knows how to validate and apply a snapshot to its own collection. Restoring
   * should itself snapshot first, so an unwanted restore is also undoable.
   */
  async snapshotFor(entityType: string, entityId: string, version: number): Promise<Record<string, unknown>> {
    const revision = await this.findVersion(entityType, entityId, version);
    return revision.snapshot;
  }

  async countFor(entityType: string, entityId: string): Promise<number> {
    return this.revisions.countDocuments({ entityType, entityId }).exec();
  }
}
