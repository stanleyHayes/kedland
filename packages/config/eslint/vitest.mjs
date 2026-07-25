import vitest from "@vitest/eslint-plugin";

/** Vitest assertion hygiene, shared by the library, react and next presets. */
export function vitestTestConfig(files) {
  return [
    {
      files,
      plugins: { vitest },
      rules: {
        ...vitest.configs.recommended.rules,
        "vitest/expect-expect": "error",
        "vitest/no-focused-tests": "error",
        "vitest/no-disabled-tests": "error",
        "vitest/no-identical-title": "error",
        // Vitest genuinely accepts `expect(value, "why this matters")`, unlike
        // Jest. The rule inherits Jest's one-argument assumption; raising the
        // cap keeps the useful failure messages our contrast and schema tests
        // rely on.
        "vitest/valid-expect": ["error", { maxArgs: 2 }],
      },
    },
  ];
}

export default vitestTestConfig;
