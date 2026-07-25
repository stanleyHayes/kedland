import { libraryConfig } from "@kedland/config/eslint/library";

export default [
  ...libraryConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // Fixtures carry the school's real page copy; repeated phrasing is the data,
    // not duplication debt. Matcher specs name colours explicitly on purpose.
    files: ["src/factories/**/*.ts", "src/matchers/**/*.ts"],
    rules: {
      "sonarjs/no-duplicate-string": "off",
      "brand/no-raw-color": "off",
    },
  },
];
