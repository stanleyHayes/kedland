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
  // Controllers are intentionally exercised by the integration suite, so a
  // unit-only threshold would fail before that suite can run. The command
  // merges both LCOV reports and SonarQube enforces the complete quality gate.
};
