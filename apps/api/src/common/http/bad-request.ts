import { BadRequestException } from "@nestjs/common";

/**
 * Turns a Zod failure into a field-keyed 400 the dashboard can attach to inputs.
 *
 * Shape matters more than it looks: `{ errors: { email: ["..."] } }` lets a form
 * put each message under the field it belongs to. A flat string array would
 * make the dashboard guess, and it would guess wrong on nested paths.
 *
 * Was a private helper in `posts.controller.ts`; lifted here when roles and
 * users needed the same thing, because three copies of an error shape is how a
 * form ends up with one field whose errors never appear.
 */
export function badRequest(issues: { path: PropertyKey[]; message: string }[]): BadRequestException {
  const errors: Record<string, string[]> = {};

  for (const issue of issues) {
    // Empty path means the object as a whole failed — a strict-object rejection
    // of an unknown key, typically. `_` is where the form shows those.
    const field = issue.path.join(".") || "_";
    const existing = errors[field] ?? [];
    existing.push(issue.message);
    errors[field] = existing;
  }

  return new BadRequestException({ errors });
}
