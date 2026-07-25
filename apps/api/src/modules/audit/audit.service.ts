import { createHash } from "node:crypto";

import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { paginate, type AuditAction, type Paginated } from "@kedland/types";

import { AuditLog, type AuditLogDocument } from "./schemas/audit-log.schema";

export interface RecordAuditInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  changes?: Record<string, unknown> | null;
  ip?: string | undefined;
}

/** Keys whose values must never reach the trail, however they are nested. */
const REDACTED_KEYS = new Set([
  "password",
  "passwordhash",
  "passwordconfirmation",
  "newpassword",
  "currentpassword",
  "token",
  "refreshtoken",
  "accesstoken",
  "tokenhash",
  "passwordresettokenhash",
  "secret",
  "apikey",
]);

/**
 * Strips secrets from an audit payload.
 *
 * The trail is read by people investigating an incident, and it outlives the
 * accounts it describes. A password hash sitting in it forever is a liability
 * with no upside, so redaction happens on the way in rather than on the way out.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : redact(entry, depth + 1);
  }
  return out;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private readonly logs: Model<AuditLogDocument>) {}

  /** An IP identifies a session without storing where someone lives. */
  private static hashIp(ip: string | undefined): string | null {
    if (ip === undefined || ip.length === 0) return null;
    return createHash("sha256").update(ip).digest("hex").slice(0, 32);
  }

  /**
   * Writes an entry.
   *
   * Never throws. An audit failure must not roll back the operation it was
   * describing — losing the record of a published post is bad; failing to
   * publish because the record could not be written is worse.
   */
  async record(input: RecordAuditInput): Promise<void> {
    try {
      await this.logs.create({
        actorId: input.actorId != null ? new Types.ObjectId(input.actorId) : null,
        actorEmail: input.actorEmail ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        changes: input.changes ? (redact(input.changes) as Record<string, unknown>) : null,
        ipHash: AuditService.hashIp(input.ip),
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit entry for ${input.action} on ${input.entityType}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /** The interceptor's catch-all: something changed on this route. */
  async recordRequest(actorId: string, route: string, ip: string | undefined): Promise<void> {
    await this.record({
      actorId,
      action: "update",
      entityType: "request",
      entityId: route,
      ip,
    });
  }

  async list(page: number, pageSize: number): Promise<Paginated<AuditLogDocument>> {
    const [items, total] = await Promise.all([
      this.logs
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.logs.countDocuments().exec(),
    ]);

    return paginate(items, total, page, pageSize);
  }

  /** Everything that ever happened to one document. */
  async forEntity(entityType: string, entityId: string): Promise<AuditLogDocument[]> {
    return this.logs.find({ entityType, entityId }).sort({ createdAt: -1 }).exec();
  }
}
