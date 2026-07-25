import { baseConfig, TEST_FILES } from "./base.mjs";
import { vitestTestConfig } from "./vitest.mjs";

/** Shared packages (types, testing) — the base set plus Vitest hygiene. */
export function libraryConfig({ tsconfigRootDir }) {
  return [...baseConfig({ tsconfigRootDir }), ...vitestTestConfig(TEST_FILES)];
}

export default libraryConfig;
