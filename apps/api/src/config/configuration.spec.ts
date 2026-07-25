import {
  appConfig,
  authConfig,
  databaseConfig,
  mailConfig,
  mediaConfig,
  revalidateConfig,
  turnstileConfig,
} from "./configuration";
import { validateEnv } from "./env.validation";

/**
 * The config factories read `process.env` *after* ConfigModule has validated
 * and coerced it, so these tests seed the environment the same way — through
 * `validateEnv` — rather than hand-writing already-parsed values. That keeps
 * the tests honest about the boundary they are exercising.
 */
const ORIGINAL_ENV = process.env;

function applyEnv(overrides: Record<string, unknown> = {}): void {
  const parsed = validateEnv({
    NODE_ENV: "development",
    MONGODB_URI: "mongodb://localhost:27017",
    MONGODB_DB: "kedland",
    CORS_ORIGINS: "http://localhost:3000,http://localhost:3001",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
    ...overrides,
  });

  process.env = parsed as unknown as NodeJS.ProcessEnv;
}

afterEach(() => {
  process.env = ORIGINAL_ENV;
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
      accessTtl: "15m",
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
