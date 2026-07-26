/**
 * Unit tests. Integration/e2e tests run from `test/jest-e2e.json` against
 * mongodb-memory-server.
 *
 * @type {import("jest").Config}
 */
export default {
  rootDir: "src",
  testEnvironment: "node",
  testRegex: String.raw`.*\.spec\.ts$`,
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  moduleNameMapper: {
    // Workspace packages are consumed as TypeScript source, not built output.
    "^@kedland/types$": "<rootDir>/../../../packages/types/src/index.ts",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.spec.ts", "!**/*.module.ts", "!**/main.ts", "!**/index.ts"],
  coverageDirectory: "../coverage/unit",
  coverageReporters: ["text", "lcov"],
  // agent_plan §7.4. This threshold applies to the unit run alone; the API's
  // controllers are covered by the integration suite, which is a separate Jest
  // config. `pnpm test:coverage` runs both and merges the LCOV so the reported
  // figure — and the SonarQube gate — sees the whole picture.
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
