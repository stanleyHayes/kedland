import nextPlugin from "@next/eslint-plugin-next";

import { reactConfig } from "./react.mjs";

/**
 * Next.js apps (apps/web and apps/admin).
 *
 * `next lint` no longer exists in Next 16 — ESLint is invoked directly, so this
 * preset carries the Next rules itself rather than relying on the CLI wrapper.
 * Vitest hygiene and the a11y layer arrive via `reactConfig`.
 */
export function nextConfig({ tsconfigRootDir }) {
  return [
    ...reactConfig({ tsconfigRootDir }),

    {
      files: ["**/*.{ts,tsx}"],
      plugins: { "@next/next": nextPlugin },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs["core-web-vitals"].rules,
        // Enforced by core-web-vitals, restated because they protect the LCP
        // budget that parents on Ghanaian mobile data actually feel.
        "@next/next/no-img-element": "error",
        "@next/next/no-sync-scripts": "error",
        // Pages Router only. Both apps are App Router, so this rule just hunts
        // for a `pages/` directory that will never exist and warns when it
        // cannot find one.
        "@next/next/no-html-link-for-pages": "off",
      },
    },

    {
      // Next's config contract types `headers()`, `redirects()` and `rewrites()`
      // as async whether or not the implementation awaits anything. The
      // signature is the framework's, not ours.
      files: ["next.config.{ts,mjs,js}"],
      rules: { "@typescript-eslint/require-await": "off" },
    },
  ];
}

export default nextConfig;
