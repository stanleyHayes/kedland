import { Controller, Get, Query } from "@nestjs/common";
import { ApiQuery, ApiTags } from "@nestjs/swagger";

import { paginate, type AuditEntry, type Paginated } from "@kedland/types";

import { RequirePermission } from "../../common/decorators/require-permission.decorator";

import { AuditService } from "./audit.service";

@ApiTags("audit")
@Controller("admin/audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermission("audit", "read")
  @ApiQuery({ name: "page", required: false })
  async list(@Query("page") page?: string): Promise<Paginated<AuditEntry>> {
    const requested = Number.parseInt(page ?? "1", 10);
    const pageNumber = Number.isFinite(requested) && requested > 0 ? requested : 1;
    const result = await this.audit.list(pageNumber, 25);

    return paginate(
      result.items.map((entry) => ({
        id: entry.id,
        actorId: entry.actorId?.toHexString() ?? null,
        actorEmail: entry.actorEmail,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        changes: entry.changes,
        createdAt: entry.createdAt.toISOString(),
      })),
      result.total,
      result.page,
      result.pageSize,
    );
  }
}
