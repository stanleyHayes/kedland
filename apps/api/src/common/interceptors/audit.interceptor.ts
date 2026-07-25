import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import { tap, type Observable } from "rxjs";

import { AuditService } from "../../modules/audit/audit.service";

import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { Request } from "express";

/** Verbs that change something and therefore deserve a trail. */
const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Records every successful mutation.
 *
 * A catch-all net beneath the explicit `audit.record()` calls in services: those
 * capture *what* changed, this guarantees that *something* was written even if a
 * new endpoint forgets. Failures are not recorded here — a rejected request
 * changed nothing, and logging them would bury the real history in noise.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();

    if (!MUTATING.has(request.method) || !request.user) {
      return next.handle();
    }

    const actorId = request.user.id;
    // Express types `route` as `any`; the pattern (`/posts/:id`) groups the
    // trail far more usefully than the concrete URL, so it is worth narrowing.
    const pattern = (request.route as { path?: string } | undefined)?.path;
    const route = `${request.method} ${pattern ?? request.url}`;

    return next.handle().pipe(
      tap(() => {
        void this.audit.recordRequest(actorId, route, request.ip);
      }),
    );
  }
}
