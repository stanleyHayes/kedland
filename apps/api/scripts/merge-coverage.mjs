import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Concatenates the unit and integration LCOV reports into one.
 *
 * The API's tests are split across two Jest configs by design — unit tests run
 * fast and mock the database; integration tests boot the whole app against a
 * real MongoDB. Reporting them separately understates coverage badly: the auth
 * controller, for instance, has thirty-two integration tests and no unit tests,
 * and would read as 0%.
 *
 * LCOV is line-oriented and additive, so concatenating the two files gives a
 * report every consumer (SonarQube included) merges correctly.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [join(root, "coverage/unit/lcov.info"), join(root, "coverage/e2e/lcov.info")];
const target = join(root, "coverage/lcov.info");

const present = sources.filter((path) => existsSync(path));

if (present.length === 0) {
  console.error("No LCOV reports found. Run the unit and e2e suites with --coverage first.");
  process.exit(1);
}

if (present.length < sources.length) {
  // Merging half the picture silently would be worse than saying so.
  console.warn(`Only ${String(present.length)} of ${String(sources.length)} LCOV reports were found.`);
}

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, present.map((path) => readFileSync(path, "utf8")).join("\n"));

console.log(`Merged ${String(present.length)} LCOV report(s) into ${target}`);
