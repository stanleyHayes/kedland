import { registerAs } from "@nestjs/config";

import { validatedEnv } from "./env.validation";

/**
 * Typed config slices.
 *
 * Services inject these rather than reading `process.env`, so a service is
 * testable without an environment and a rename shows up as a type error rather
 * than an undefined at runtime.
 *
 * These read the *validated* environment, not `process.env`. The two are not
 * the same: `@nestjs/config` does not write the schema's coercions or defaults
 * back to the process, so `process.env.PORT` is the string "8080" and
 * `CORS_ORIGINS` is a comma-separated string rather than the array the rest of
 * the application is typed against.
 */
const env = validatedEnv;

export const appConfig = registerAs("app", () => {
  const e = env();
  return {
    nodeEnv: e.NODE_ENV,
    port: e.PORT,
    isProduction: e.NODE_ENV === "production",
    corsOrigins: e.CORS_ORIGINS,
  };
});

export const throttleConfig = registerAs("throttle", () => {
  const e = env();
  return {
    ttlMs: 60_000,
    // Already coerced to numbers by the env schema.
    limit: e.THROTTLE_LIMIT,
    loginLimit: e.THROTTLE_LOGIN_LIMIT,
  };
});

export const databaseConfig = registerAs("database", () => {
  const e = env();
  return {
    uri: e.MONGODB_URI,
    dbName: e.MONGODB_DB,
  };
});

export const authConfig = registerAs("auth", () => {
  const e = env();
  return {
    accessSecret: e.JWT_ACCESS_SECRET,
    refreshSecret: e.JWT_REFRESH_SECRET,
    accessTtl: e.JWT_ACCESS_TTL,
    refreshTtl: e.JWT_REFRESH_TTL,
  };
});

export const mailConfig = registerAs("mail", () => {
  const e = env();
  return {
    apiKey: e.RESEND_API_KEY,
    from: e.MAIL_FROM,
    toSchool: e.MAIL_TO_SCHOOL,
    /** Absent credentials means enquiries still persist; only delivery is skipped. */
    enabled: Boolean(e.RESEND_API_KEY && e.MAIL_TO_SCHOOL),
  };
});

export const mediaConfig = registerAs("media", () => {
  const e = env();
  return {
    cloudName: e.CLOUDINARY_CLOUD_NAME,
    apiKey: e.CLOUDINARY_API_KEY,
    apiSecret: e.CLOUDINARY_API_SECRET,
    enabled: Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET),
  };
});

export const revalidateConfig = registerAs("revalidate", () => {
  const e = env();
  return {
    webhookUrl: e.REVALIDATE_WEBHOOK_URL,
    secret: e.REVALIDATE_SECRET,
    enabled: Boolean(e.REVALIDATE_WEBHOOK_URL && e.REVALIDATE_SECRET),
  };
});

export const turnstileConfig = registerAs("turnstile", () => {
  const e = env();
  return {
    secretKey: e.TURNSTILE_SECRET_KEY,
    enabled: Boolean(e.TURNSTILE_SECRET_KEY),
  };
});

export const configFactories = [
  appConfig,
  throttleConfig,
  databaseConfig,
  authConfig,
  mailConfig,
  mediaConfig,
  revalidateConfig,
  turnstileConfig,
];
