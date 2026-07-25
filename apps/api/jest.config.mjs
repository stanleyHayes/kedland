/**
 * Unit tests. Integration/e2e tests run from `test/jest-e2e.json` against
 * mongodb-memory-server.
 *
 * @type {import("jest").Config}
 */
export default {
  rootDir: "src",
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/../tsconfig.json" }],
  },
  moduleNameMapper: {
    // Workspace packages are consumed as TypeScript source, not built output.
    "^@kedland/types$": "<rootDir>/../../../packages/types/src/index.ts",
  },
  collectCoverageFrom: ["**/*.ts", "!**/*.spec.ts", "!**/*.module.ts", "!**/main.ts", "!**/index.ts"],
  coverageDirectory: "../coverage",
  coverageReporters: ["text", "lcov"],
  // agent_plan §7.4 — the API's modules are held to a higher bar than the
  // repo-wide 80% because this is where the school's data actually lives.
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
    // Glob keys resolve from the process cwd, not `rootDir`.
    "**/src/modules/**/*.ts": { statements: 85, branches: 85, functions: 85, lines: 85 },
  },
};
