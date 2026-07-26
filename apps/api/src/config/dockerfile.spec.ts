import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The Dockerfile agrees with the repo about which pnpm to use.
 *
 * This exists because of a deploy that failed, not a hypothetical one. The image
 * used to run `corepack enable`, which worked until Node 25 unbundled corepack —
 * after which the official images simply do not have it, and Render failed with
 * `/bin/sh: corepack: not found` at the first build step. Nothing local caught it
 * because nothing local builds the image.
 *
 * The replacement pins pnpm explicitly, which trades one failure mode for
 * another: a version that silently drifts from `packageManager`. The API would
 * then be built by a different resolver than every other environment uses, which
 * is precisely the sort of difference that produces a bug reproducible only in
 * production. Hence this test.
 */

// `__dirname`, not `import.meta`: this package compiles to CommonJS.
const ROOT = join(__dirname, "..", "..", "..", "..");

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("the API image", () => {
  const dockerfile = read("apps/api/Dockerfile");
  const rootManifest = JSON.parse(read("package.json")) as { packageManager?: string };

  it("pins a pnpm version", () => {
    expect(dockerfile).toMatch(/ARG PNPM_VERSION=\d+\.\d+\.\d+/);
  });

  it("uses the same pnpm the repo declares", () => {
    const declared = /^pnpm@(?<version>.+)$/.exec(rootManifest.packageManager ?? "")?.groups?.["version"];
    const pinned = [...dockerfile.matchAll(/ARG PNPM_VERSION=(?<version>[\d.]+)/g)].map(
      (match) => match.groups?.["version"],
    );

    expect(declared).toBeDefined();
    expect(pinned.length).toBeGreaterThan(0);
    // Every stage, not just the first — each is its own image and inherits
    // nothing, so they are pinned separately and can drift separately.
    for (const version of pinned) expect(version).toBe(declared);
  });

  /**
   * The line that broke. Worth naming explicitly: `corepack enable` is still the
   * first thing most people reach for, and it will fail the same way again.
   */
  it("does not depend on corepack, which Node no longer ships", () => {
    // Instructions only. The comments above deliberately mention corepack to say
    // why it went, and a test that banned the word would forbid the explanation.
    const instructions = dockerfile
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));

    expect(instructions.filter((line) => line.includes("corepack"))).toEqual([]);
  });

  it("installs pnpm in every stage that runs it", () => {
    const stages = dockerfile.split(/^FROM /m).slice(1);
    const runsPnpm = stages.filter((stage) => /^RUN pnpm /m.test(stage));

    expect(runsPnpm.length).toBeGreaterThan(0);
    for (const stage of runsPnpm) {
      // Jest has no per-assertion message argument, so the stage's own FROM line
      // goes in the pattern's failure output by naming it here.
      const name = stage.split("\n")[0] ?? "unknown stage";
      expect({ stage: name, installsPnpm: stage.includes("npm install --global pnpm@") }).toEqual({
        stage: name,
        installsPnpm: true,
      });
    }
  });
});
