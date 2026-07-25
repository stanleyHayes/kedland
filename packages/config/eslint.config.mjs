import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import globals from "globals";

import { IGNORES } from "./eslint/base.mjs";

/**
 * @kedland/config lints itself with the plain JS rules only — it *is* the
 * TypeScript preset, so it cannot consume one without a circular dependency.
 */
export default [
  { ignores: IGNORES },
  js.configs.recommended,
  prettier,
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
    },
  },
];
