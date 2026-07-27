import { join } from "node:path";

import { IGNORES } from "@kedland/config/eslint/base";
import { libraryConfig } from "@kedland/config/eslint/library";
import { nestConfig } from "@kedland/config/eslint/nest";
import { nextConfig } from "@kedland/config/eslint/next";
import { reactConfig } from "@kedland/config/eslint/react";

/**
 * Root ESLint config.
 *
 * Each workspace package has its own `eslint.config.mjs`, which is what runs
 * under `pnpm lint`. This file exists so ESLint also works when invoked from
 * the repository root — which lint-staged does on every commit, and which is
 * the natural thing to type.
 *
 * It composes the same presets, scoping each to its directory so a file is
 * linted by exactly the rules its package would apply. `tsconfigRootDir` stays
 * absolute per package, so type-aware linting resolves the right program.
 */

const root = import.meta.dirname;

/**
 * Restricts a preset's config objects to one directory.
 *
 * Global-ignore entries (`ignores` and nothing else) must stay global — ESLint
 * treats those specially and scoping them would silently stop them ignoring.
 */
function scopeTo(configs, dir) {
  return configs.map((config) => {
    if (config.files === undefined && config.ignores !== undefined) return config;

    const files =
      config.files === undefined
        ? [`${dir}/**/*.{ts,tsx,mts,cts,js,mjs,cjs}`]
        : config.files.flatMap((pattern) =>
            typeof pattern === "string" ? [`${dir}/${pattern.replace(/^\*\*\//, "")}`] : pattern,
          );

    return { ...config, files };
  });
}

function pkg(preset, dir) {
  return scopeTo(preset({ tsconfigRootDir: join(root, dir) }), dir);
}

export default [
  { ignores: [...IGNORES, "Kedland_Website_Build_Package/**"] },

  ...pkg(nextConfig, "apps/web"),
  ...pkg(nextConfig, "apps/admin"),
  ...pkg(nestConfig, "apps/api"),
  ...pkg(libraryConfig, "packages/types"),
  ...pkg(reactConfig, "packages/ui"),
  ...pkg(libraryConfig, "packages/testing"),

  {
    // Mirrors the per-package overrides so the root run agrees with `pnpm lint`.
    files: ["packages/ui/src/lib/tokens.ts", "packages/ui/src/lib/*.spec.ts", "apps/api/**/*.ts"],
    rules: { "brand/no-raw-color": "off" },
  },
  {
    files: ["apps/*/e2e/**/*.ts"],
    rules: { "vitest/expect-expect": "off" },
  },
  {
    // Mirrors apps/web/eslint.config.mjs: opengraph-image renders through
    // ImageResponse (Satori), where next/image cannot run.
    files: ["apps/web/src/app/opengraph-image.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
];
