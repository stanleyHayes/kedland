import { z } from "zod";

/**
 * Transport envelopes. Every list endpoint returns the same paginated shape and
 * every failure returns the same problem shape, so client code has exactly one
 * success path and one error path to write.
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Builds the envelope so no controller has to compute `totalPages` by hand. */
export function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

/**
 * RFC 7807 problem details. `errors` carries field-level validation failures so
 * the dashboard can attach messages to the right inputs rather than showing one
 * generic banner.
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

/** Health payload — consumed by Render's health check and the status page. */
export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  uptimeSeconds: number;
  version: string;
  checks: Record<string, "up" | "down">;
}
