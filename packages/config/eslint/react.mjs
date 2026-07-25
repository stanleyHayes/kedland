import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import { baseConfig, TEST_FILES } from "./base.mjs";
import { vitestTestConfig } from "./vitest.mjs";

/**
 * React layer: hooks correctness plus accessibility.
 *
 * Every jsx-a11y rule is an ERROR, not a warning. WCAG 2.1 AA is a merge gate
 * on this project (agent_plan §6.8) — the site is for parents choosing a school
 * for a young child, and half of them are on a phone. Lint is the cheapest of
 * the three a11y checks we run; the other two are axe in tests and a manual
 * keyboard pass.
 */
export function reactConfig({ tsconfigRootDir }) {
  return [
    ...baseConfig({ tsconfigRootDir }),

    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        globals: { ...globals.browser, ...globals.node },
        parserOptions: {
          ecmaFeatures: { jsx: true },
        },
      },
      plugins: {
        "jsx-a11y": jsxA11y,
        "react-hooks": reactHooks,
      },
      rules: {
        ...jsxA11y.flatConfigs.strict.rules,
        ...reactHooks.configs.recommended.rules,

        // Images on this site carry meaning (children, facilities, diagrams);
        // an empty alt is a decision that must be made deliberately, not by default.
        "jsx-a11y/alt-text": ["error", { elements: ["img", "object", "area", 'input[type="image"]'] }],
        "jsx-a11y/anchor-is-valid": "error",
        "jsx-a11y/no-autofocus": ["error", { ignoreNonDOM: true }],
        "jsx-a11y/media-has-caption": "error",

        "react-hooks/exhaustive-deps": "error",
      },
    },

    {
      // Annotating every component `: React.JSX.Element` adds no information a
      // reader or the compiler lacks — the return is inferred from the JSX and
      // is never anything else. The rule stays on for .ts, where an inferred
      // return type genuinely can surprise you.
      files: ["**/*.tsx"],
      rules: { "@typescript-eslint/explicit-function-return-type": "off" },
    },

    ...vitestTestConfig(TEST_FILES),
  ];
}

export default reactConfig;
