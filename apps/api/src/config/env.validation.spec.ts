import { readFileSync } from "node:fs";
import { join } from "node:path";

import { envSchema, validateEnv } from "./env.validation";

/** A minimal environment that satisfies the schema outside production. */
function baseEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    NODE_ENV: "development",
    MONGODB_URI: "mongodb://localhost:27017",
    CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
    ...overrides,
  };
}

/** Everything production additionally insists on. */
function productionEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return baseEnv({
    NODE_ENV: "production",
    CORS_ORIGINS: "https://kedland.edu.gh",
    RESEND_API_KEY: "re_test_key",
    MAIL_TO_SCHOOL: "office@kedland.edu.gh",
    TURNSTILE_SECRET_KEY: "turnstile-secret",
    REVALIDATE_SECRET: "c".repeat(32),
    ...overrides,
  });
}

describe("validateEnv", () => {
  it("accepts a complete development environment", () => {
    expect(() => validateEnv(baseEnv())).not.toThrow();
  });

  it("applies documented defaults", () => {
    const env = validateEnv(baseEnv());
    expect(env.PORT).toBe(8080);
    expect(env.MONGODB_DB).toBe("kedland");
    expect(env.JWT_ACCESS_TTL).toBe("15m");
    expect(env.JWT_REFRESH_TTL).toBe("7d");
  });

  it("parses the CORS allowlist into trimmed origins", () => {
    const env = validateEnv(baseEnv({ CORS_ORIGINS: " https://a.example , https://b.example " }));
    expect(env.CORS_ORIGINS).toEqual(["https://a.example", "https://b.example"]);
  });

  it("rejects a wildcard CORS origin", () => {
    expect(() => validateEnv(baseEnv({ CORS_ORIGINS: "*" }))).toThrow(/CORS_ORIGINS/);
  });

  it("rejects a missing database URI", () => {
    const { MONGODB_URI: _omitted, ...env } = baseEnv();
    expect(() => validateEnv(env)).toThrow(/MONGODB_URI/);
  });

  it("rejects a database URI that is not a mongodb connection string", () => {
    expect(() => validateEnv(baseEnv({ MONGODB_URI: "postgres://localhost" }))).toThrow(/MONGODB_URI/);
  });

  it("rejects a short JWT secret", () => {
    expect(() => validateEnv(baseEnv({ JWT_ACCESS_SECRET: "too-short" }))).toThrow(/at least 32 characters/);
  });

  it("rejects a port outside the valid range", () => {
    expect(() => validateEnv(baseEnv({ PORT: "70000" }))).toThrow(/PORT/);
  });

  it("names every problem at once rather than one per restart", () => {
    const env = baseEnv({ JWT_ACCESS_SECRET: "short", MONGODB_URI: "nope" });

    expect(() => validateEnv(env)).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => validateEnv(env)).toThrow(/MONGODB_URI/);
  });
});

describe("production-only requirements", () => {
  it("accepts a complete production environment", () => {
    expect(() => validateEnv(productionEnv())).not.toThrow();
  });

  it.each([
    ["RESEND_API_KEY", /notify the school/],
    ["MAIL_TO_SCHOOL", /nowhere to send parent enquiries/],
    ["TURNSTILE_SECRET_KEY", /no spam protection/],
    ["REVALIDATE_SECRET", /would not refresh the public site/],
  ])("refuses to boot without %s", (key, reason) => {
    const { [key]: _omitted, ...env } = productionEnv();
    expect(() => validateEnv(env)).toThrow(reason);
  });

  it("refuses to reuse one secret for both token types", () => {
    const shared = "d".repeat(32);
    expect(() =>
      validateEnv(productionEnv({ JWT_ACCESS_SECRET: shared, JWT_REFRESH_SECRET: shared })),
    ).toThrow(/must differ/);
  });

  it("allows the optional integrations to be absent outside production", () => {
    expect(() => validateEnv(baseEnv())).not.toThrow();
  });
});

/**
 * `.env.example` is the only documentation a new developer reads before their
 * first `pnpm dev`. If it omits a required key they get a boot failure and no
 * clue which value is missing, so this asserts the two stay in step.
 */
describe(".env.example documents the contract", () => {
  const example = readFileSync(join(__dirname, "..", "..", "..", "..", ".env.example"), "utf8");
  const documented = new Set(
    example
      .split("\n")
      .map((line) => /^#?\s*([A-Z0-9_]+)=/.exec(line.trim())?.[1])
      .filter((key): key is string => Boolean(key)),
  );

  // Zod 4 keeps refinements inside the schema, so `.superRefine()` still
  // returns a ZodObject and `.shape` is reachable without unwrapping.
  const keys = Object.keys(envSchema.shape);

  it.each(keys)("documents %s", (key) => {
    expect(documented.has(key)).toBe(true);
  });
});
