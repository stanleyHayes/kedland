import { z } from "zod";

/**
 * Environment contract.
 *
 * The process refuses to boot on a bad env (agent_plan §6.7). A missing JWT
 * secret discovered at startup is an incident; a missing JWT secret discovered
 * when the first parent tries to log in is a much worse one.
 *
 * Names here must stay in step with `.env.example` and `render.yaml` — the
 * `env.validation.spec.ts` suite asserts the example file covers every required
 * key, so the two cannot drift.
 */

const nodeEnv = z.enum(["development", "test", "production"]).default("development");

/** A comma-separated origin allowlist. Never `*` — see agent_plan §6.7. */
const originList = z
  .string()
  .min(1)
  .transform((value) =>
    value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()).min(1));

/** Secrets must be long enough to be worth having. */
const secret = z.string().min(32, "must be at least 32 characters");

export const envSchema = z
  .object({
    NODE_ENV: nodeEnv,
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),

    MONGODB_URI: z.string().min(1).startsWith("mongodb"),
    MONGODB_DB: z.string().min(1).default("kedland"),

    CORS_ORIGINS: originList,

    JWT_ACCESS_SECRET: secret,
    JWT_REFRESH_SECRET: secret,
    JWT_ACCESS_TTL: z.string().default("15m"),
    JWT_REFRESH_TTL: z.string().default("7d"),

    // Optional integrations. Absent means the feature degrades loudly rather
    // than the process refusing to start — a missing Cloudinary key must not
    // take the public site down.
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().optional(),
    MAIL_TO_SCHOOL: z.email().optional(),

    TURNSTILE_SECRET_KEY: z.string().optional(),

    REVALIDATE_WEBHOOK_URL: z.url().optional(),
    REVALIDATE_SECRET: z.string().optional(),

    // Rate limits, as configuration rather than constants.
    //
    // Every request in the integration suite arrives from 127.0.0.1, so a
    // production-shaped per-IP limit throttles the tests rather than the
    // attacker it is meant for. Making it configurable lets the test
    // environment raise it without weakening the deployed default, and keeps
    // the number somewhere an operator can find it.
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
    THROTTLE_LOGIN_LIMIT: z.coerce.number().int().positive().default(8),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;

    // In production these stop being optional. Failing here beats a school
    // discovering on launch day that enquiries were silently going nowhere.
    const required: [keyof typeof env, string][] = [
      ["RESEND_API_KEY", "the contact form cannot notify the school without it"],
      ["MAIL_TO_SCHOOL", "there is nowhere to send parent enquiries"],
      ["TURNSTILE_SECRET_KEY", "the contact form would have no spam protection"],
      ["REVALIDATE_SECRET", "publishing would not refresh the public site"],
    ];

    for (const [key, why] of required) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required in production — ${why}.`,
        });
      }
    }

    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["JWT_REFRESH_SECRET"],
        message:
          "JWT_REFRESH_SECRET must differ from JWT_ACCESS_SECRET — sharing one key means a leaked access token can mint refresh tokens.",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Nest's ConfigModule calls this. Throwing here aborts the boot, by design. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return result.data;
}
