/** Shared Prettier configuration. ESLint stands down on formatting via eslint-config-prettier. */

/** @type {import("prettier").Config} */
export default {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 110,
  tabWidth: 2,
  useTabs: false,
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "lf",
  overrides: [
    {
      files: ["*.md"],
      options: { proseWrap: "preserve" },
    },
    {
      files: ["*.yml", "*.yaml"],
      options: { singleQuote: false },
    },
  ],
};
