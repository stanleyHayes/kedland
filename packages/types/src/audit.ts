import type { AuditAction } from "./enums";

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
}
