import { nestConfig } from "@kedland/config/eslint/nest";

export default [
  ...nestConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // The API renders no UI; a colour literal here would be data, not styling,
    // and the rule has nothing useful to say about it.
    files: ["**/*.ts"],
    rules: { "brand/no-raw-color": "off" },
  },
];
