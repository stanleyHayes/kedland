import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import importX from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import globals from "globals";

import brand from "../rules/no-raw-color.mjs";

/** Build artefacts and generated output — never linted. */
export const IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/build/**",
  "**/coverage/**",
  "**/.turbo/**",
  "**/playwright-report/**",
  "**/test-results/**",
  "**/*.tsbuildinfo",
  "**/next-env.d.ts",
];

/**
 * Files every preset treats as tests: fixtures repeat strings and shapes by
 * nature, and a test that reaches into internals is doing its job.
 */
export const TEST_FILES = [
  "**/*.{spec,test}.{ts,tsx}",
  "**/__tests__/**/*.{ts,tsx}",
  "**/e2e/**/*.ts",
  "test/**/*.ts",
];

/**
 * The shared rule set. Everything here is an ERROR — `--max-warnings=0` runs in
 * CI, so a warning would fail the build anyway; making that explicit avoids the
 * fiction that some violations are optional (agent_plan §7.2).
 *
 * The `sonarjs` plugin is deliberately first-class: it catches the same smells
 * the SonarQube gate will, at the keyboard rather than in CI.
 *
 * @param {object} options
 * @param {string} options.tsconfigRootDir  Directory holding the app's tsconfig.
 */
export function baseConfig({ tsconfigRootDir }) {
  return tseslint.config(
    { ignores: IGNORES },

    js.configs.recommended,
    sonarjs.configs.recommended,
    prettier,

    // Type-aware linting applies to TypeScript sources only. The config files
    // themselves are plain ESM and are deliberately outside every tsconfig
    // program, so asking a typed rule about them would just throw.
    {
      files: ["**/*.{ts,tsx,mts,cts}"],
      extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        parserOptions: {
          // `projectService` discovers the right tsconfig per file rather than
          // us maintaining a list, and it is mutually exclusive with `project`.
          // Every package's tsconfig includes its own tooling files
          // (vitest.config.ts, vitest.setup.ts) so they resolve too.
          projectService: true,
          tsconfigRootDir,
        },
        globals: { ...globals.node },
      },
      plugins: {
        "import-x": importX,
        brand,
      },
      settings: {
        "import-x/resolver-next": [importX.createNodeResolver()],
      },
      rules: {
        // ── Type safety ───────────────────────────────────────────────────
        // `any` is banned outright; `unknown` plus a narrowing guard is the answer.
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-return": "error",
        "@typescript-eslint/no-unsafe-argument": "error",
        "@typescript-eslint/explicit-function-return-type": [
          "error",
          { allowExpressions: true, allowTypedFunctionExpressions: true, allowHigherOrderFunctions: true },
        ],
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { prefer: "type-imports", fixStyle: "inline-type-imports" },
        ],
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
        "@typescript-eslint/require-await": "error",
        "@typescript-eslint/prefer-nullish-coalescing": "error",
        "@typescript-eslint/prefer-optional-chain": "error",

        // ── Sonar-parity smells (mirrors the quality gate) ────────────────
        "sonarjs/cognitive-complexity": ["error", 15],
        "sonarjs/no-identical-functions": "error",
        "sonarjs/no-duplicate-string": ["error", { threshold: 4 }],
        "sonarjs/no-nested-conditional": "error",
        "sonarjs/no-commented-code": "error",
        "sonarjs/no-all-duplicated-branches": "error",
        "sonarjs/no-collapsible-if": "error",
        "sonarjs/prefer-immediate-return": "error",
        // typescript-eslint's equivalent is configured above with the `^_`
        // convention, which sonarjs's copy does not honour — so `const { x: _omitted,
        // ...rest }` (the safe way to drop a key) would be flagged as dead code.
        "sonarjs/no-unused-vars": "off",
        // Sonar's own a11y/react rules are handled by jsx-a11y in the react preset.
        "sonarjs/todo-tag": "off", // superseded by our own no-warning-comments below

        // ── General hygiene ───────────────────────────────────────────────
        eqeqeq: ["error", "always", { null: "ignore" }],
        curly: ["error", "multi-line"],
        "default-case": "error",
        "no-console": "error",
        "no-alert": "error",
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-param-reassign": ["error", { props: true }],
        "no-return-await": "off",
        "prefer-const": "error",
        "object-shorthand": "error",
        // A deferred-work marker without a ticket reference is a promise nobody kept.
        "no-warning-comments": ["error", { terms: ["todo", "fixme", "xxx", "hack"], location: "anywhere" }],

        // ── Colour tokens ─────────────────────────────────────────────────
        "brand/no-raw-color": "error",

        // ── Imports ───────────────────────────────────────────────────────
        "import-x/no-cycle": ["error", { maxDepth: 6 }],
        "import-x/no-self-import": "error",
        "import-x/no-duplicates": "error",
        "import-x/order": [
          "error",
          {
            groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
            pathGroups: [{ pattern: "@kedland/**", group: "internal", position: "before" }],
            pathGroupsExcludedImportTypes: ["type"],
            "newlines-between": "always",
            alphabetize: { order: "asc", caseInsensitive: true },
          },
        ],
      },
    },

    // Plain-JS files (flat configs, setup scripts, Tailwind/PostCSS config).
    // They get the untyped rule set; `disableTypeChecked` must contribute its
    // own `rules` here, so it is spread *inside* the rules object rather than
    // alongside it — a sibling `rules` key would silently replace it.
    {
      files: ["**/*.{js,mjs,cjs}"],
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        globals: { ...globals.node },
      },
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        "no-console": "off",
        "sonarjs/no-duplicate-string": "off",
      },
    },

    // TS config/setup files still typecheck, but the strictures that only make
    // sense in application code are relaxed.
    {
      files: ["**/*.config.{ts,mts}", "**/*.setup.{ts,mts}", "**/vitest.setup.ts"],
      rules: {
        "no-console": "off",
        "brand/no-raw-color": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },

    // Shared test relaxations. Individual presets add their runner's plugin
    // (vitest or jest) on top of this.
    {
      files: TEST_FILES,
      rules: {
        // Fixtures repeat the school's copy verbatim; that is the data, not debt.
        "sonarjs/no-duplicate-string": "off",
        "sonarjs/no-identical-functions": "off",
        // A test that asserts on a value it just constructed knows it is there.
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/unbound-method": "off",
      },
    },
  );
}

export default baseConfig;
