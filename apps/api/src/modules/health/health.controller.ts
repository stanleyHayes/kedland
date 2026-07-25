import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../common/decorators/public.decorator";

import { HealthService } from "./health.service";

import type { HealthStatus } from "@kedland/types";

@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Liveness — the process is running" })
  live(): HealthStatus {
    return this.health.live();
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness — the process can serve requests" })
  ready(): HealthStatus {
    const status = this.health.ready();

    // A 200 with `status: "error"` would let a broken instance stay in
    // rotation. The body still carries which check failed.
    if (status.status !== "ok") {
      throw new ServiceUnavailableException(status);
    }

    return status;
  }
}
