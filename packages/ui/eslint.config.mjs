import { reactConfig } from "@kedland/config/eslint/react";

export default [
  ...reactConfig({ tsconfigRootDir: import.meta.dirname }),
  {
    // The token definitions are the one sanctioned home for colour literals.
    files: ["src/lib/tokens.ts", "src/lib/*.spec.ts"],
    rules: { "brand/no-raw-color": "off" },
  },
];
