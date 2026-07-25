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
        // In an HTTP test the assertion is supertest's own `.expect(200)`,
        // not a jest `expect`. Without this the rule reports a request that
        // asserts its status code as having no assertions at all.
        "jest/expect-expect": [
          "error",
          { assertFunctionNames: ["expect", "request.**.expect", "**.expect"] },
        ],
        "sonarjs/assertions-in-tests": "off",
        "jest/no-focused-tests": "error",
        "jest/no-disabled-tests": "error",
        "jest/no-identical-title": "error",

        // Jest types `mock.calls` as `any[][]`, so reading an argument back to
        // assert on it is unavoidably "unsafe" by the type system's reckoning.
        // The alternative is casting at every call site, which adds noise
        // without adding safety.
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/restrict-template-expressions": "off",

        // Test fixtures contain invented credentials by definition. The rule
        // stays on everywhere a real secret could live.
        "sonarjs/no-hardcoded-passwords": "off",

        // Mock factories and chain helpers read better inferred; the rule earns
        // its keep on exported application code, not on local test scaffolding.
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-unnecessary-type-parameters": "off",
      },
    },
  ];
}

export default nestConfig;
