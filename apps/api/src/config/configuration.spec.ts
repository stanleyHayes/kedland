import {
  appConfig,
  authConfig,
  databaseConfig,
  mailConfig,
  mediaConfig,
  revalidateConfig,
  turnstileConfig,
} from "./configuration";
import { setValidatedEnv, validateEnv, validatedEnv } from "./env.validation";

/**
 * The config factories read the environment ConfigModule validated, so these
 * tests seed it the same way — through `validateEnv` — rather than
 * hand-writing already-parsed values. That keeps the tests honest about the
 * boundary they are exercising.
 */
function applyEnv(overrides: Record<string, unknown> = {}): void {
  validateEnv({
    NODE_ENV: "development",
    MONGODB_URI: "mongodb://localhost:27017",
    MONGODB_DB: "kedland",
    CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
    ...overrides,
  });
}

afterEach(() => {
  setValidatedEnv(undefined);
});

/**
 * The regression this file exists for.
 *
 * `@nestjs/config`'s `validate` hook returns the parsed environment for Nest's
 * own use but leaves `process.env` holding the raw strings it was given. A
 * factory reading `process.env` therefore gets a string where the schema
 * promised a number, and nothing at all for a key the schema defaulted — which
 * is how a compiled build died on "Configuration key app.corsOrigins does not
 * exist" while every test passed.
 */
describe("the validated environment, not process.env", () => {
  it("gives the factories the schema's coercions", () => {
    applyEnv({ PORT: "9090" });

    // `process.env.PORT` is still the string; the factory must not see that.
    expect(typeof appConfig().port).toBe("number");
  });

  it("gives the factories the schema's transforms", () => {
    applyEnv({ CORS_ORIGINS: "https://a.example,https://b.example" });

    expect(Array.isArray(appConfig().corsOrigins)).toBe(true);
  });

  it("gives the factories the schema's defaults", () => {
    // MONGODB_DB and the JWT lifetimes are defaulted by the schema and are
    // absent from the raw environment entirely.
    applyEnv();

    expect(databaseConfig().dbName).toBe("kedland");
    expect(authConfig().accessTtl).toBe("1h");
  });

  it("refuses to be read before validation rather than returning undefined", () => {
    setValidatedEnv(undefined);

    // Silently handing back `undefined` is what turned a wiring mistake into a
    // crash three layers away from its cause.
    expect(() => validatedEnv()).toThrow(/before ConfigModule validated it/);
  });
});

describe("appConfig", () => {
  it("exposes the parsed port as a number", () => {
    applyEnv({ PORT: "9090" });
    expect(appConfig()).toMatchObject({ port: 9090 });
  });

  it("hands back the CORS allowlist already split into origins", () => {
    applyEnv();
    expect(appConfig().corsOrigins).toEqual(["http://localhost:3000", "http://localhost:3001"]);
  });

  it("flags production", () => {
    applyEnv({
      NODE_ENV: "production",
      CORS_ORIGINS: "https://kedland.edu.gh",
      RESEND_API_KEY: "re_key",
      MAIL_TO_SCHOOL: "office@kedland.edu.gh",
      TURNSTILE_SECRET_KEY: "turnstile",
      REVALIDATE_SECRET: "c".repeat(32),
    });
    expect(appConfig().isProduction).toBe(true);
  });

  it("does not flag development as production", () => {
    applyEnv();
    expect(appConfig().isProduction).toBe(false);
  });
});

describe("databaseConfig", () => {
  it("carries the URI and database name", () => {
    applyEnv();
    expect(databaseConfig()).toEqual({ uri: "mongodb://localhost:27017", dbName: "kedland" });
  });
});

describe("authConfig", () => {
  it("carries both secrets and their lifetimes", () => {
    applyEnv();
    expect(authConfig()).toEqual({
      accessSecret: "a".repeat(32),
      refreshSecret: "b".repeat(32),
      accessTtl: "1h",
      refreshTtl: "7d",
    });
  });
});

/**
 * The `enabled` flags are what let a missing integration degrade loudly instead
 * of taking the site down. Each is asserted in both directions.
 */
describe("optional integrations", () => {
  it("reports mail disabled when credentials are absent", () => {
    applyEnv();
    expect(mailConfig().enabled).toBe(false);
  });

  it("reports mail enabled only when both key and destination are present", () => {
    applyEnv({ RESEND_API_KEY: "re_key" });
    expect(mailConfig().enabled).toBe(false);

    applyEnv({ RESEND_API_KEY: "re_key", MAIL_TO_SCHOOL: "office@kedland.edu.gh" });
    expect(mailConfig().enabled).toBe(true);
  });

  it("reports media disabled until all three Cloudinary values are set", () => {
    applyEnv({ CLOUDINARY_CLOUD_NAME: "kedland", CLOUDINARY_API_KEY: "key" });
    expect(mediaConfig().enabled).toBe(false);

    applyEnv({
      CLOUDINARY_CLOUD_NAME: "kedland",
      CLOUDINARY_API_KEY: "key",
      CLOUDINARY_API_SECRET: "secret",
    });
    expect(mediaConfig().enabled).toBe(true);
  });

  it("reports revalidation disabled without both URL and secret", () => {
    applyEnv({ REVALIDATE_WEBHOOK_URL: "https://kedland.edu.gh/api/revalidate" });
    expect(revalidateConfig().enabled).toBe(false);

    applyEnv({
      REVALIDATE_WEBHOOK_URL: "https://kedland.edu.gh/api/revalidate",
      REVALIDATE_SECRET: "c".repeat(32),
    });
    expect(revalidateConfig().enabled).toBe(true);
  });

  it("reports Turnstile disabled without a secret key", () => {
    applyEnv();
    expect(turnstileConfig().enabled).toBe(false);

    applyEnv({ TURNSTILE_SECRET_KEY: "turnstile" });
    expect(turnstileConfig().enabled).toBe(true);
  });
});
