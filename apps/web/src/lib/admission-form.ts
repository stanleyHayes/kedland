import { existsSync } from "node:fs";
import { join } from "node:path";

import { ADMISSION_FORM_PATH } from "./admission-form-path";

export { ADMISSION_FORM_PATH } from "./admission-form-path";

/**
 * Whether the admission form has actually been supplied.
 *
 * Checked on the filesystem rather than tracked in the CMS: the question is
 * "is the file there?", and asking the filesystem cannot get out of step with
 * reality the way a checkbox someone forgot to tick can.
 *
 * This runs during the static build, so there is no per-request cost — and no
 * `fs` in the browser bundle, because only Server Components call it.
 */
export function admissionFormExists(): boolean {
  return existsSync(join(process.cwd(), "public", ADMISSION_FORM_PATH));
}
