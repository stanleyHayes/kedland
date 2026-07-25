import jest from "eslint-plugin-jest";

import { baseConfig, TEST_FILES } from "./base.mjs";

/**
 * NestJS API.
 *
 * Nest leans on decorators and DI, which trips a handful of rules that are
 * correct everywhere else. Each exemption below is narrow and explained — a
 * blanket disable would hide real problems.
 */
export function nestConfig({ tsconfigRootDir }) {
  return [
    ...baseConfig({ tsconfigRootDir }),

    {
      files: ["**/*.ts"],
      rules: {
        // Nest's DI resolves constructor params by design; a module class whose
        // whole content is its decorator is idiomatic, not an empty shell.
        "@typescript-eslint/no-extraneous-class": ["error", { allowWithDecorator: true }],
        "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
        "@typescript-eslint/no-unsafe-declaration-merging": "error",
      },
    },

    // Seeds intentionally carry the school's full page copy as literal data,
    // including the build package's PENDING markers.
    {
      files: ["**/seeds/**/*.ts", "**/*.seed.ts"],
      rules: {
        "sonarjs/no-duplicate-string": "off",
        "no-warning-comments": "off",
      },
    },

    {
      files: TEST_FILES,
      plugins: { jest },
      languageOptions: { globals: jest.environments.globals.globals },
      rules: {
        ...jest.configs["flat/recommended"].rules,
        "jest/expect-expect": "error",
        "jest/no-focused-tests": "error",
        "jest/no-disabled-tests": "error",
        "jest/no-identical-title": "error",
      },
    },
  ];
}

export default nestConfig;
