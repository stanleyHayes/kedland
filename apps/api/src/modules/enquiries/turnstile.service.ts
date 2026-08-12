import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/** Cloudflare's verification endpoint. */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Cloudflare is normally well under a second; this is a ceiling, not a target. */
const TIMEOUT_MS = 5000;

interface SiteVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Server-side Turnstile verification.
 *
 * The widget's token proves nothing on its own — anyone can post any string to
 * the enquiry endpoint. It only means something once Cloudflare confirms it,
 * which is what this does.
 *
 * Two deliberate decisions about failure:
 *
 *  - **No secret configured** (local development, and any environment where the
 *    school has not set one) verifies as passed. Production requires the secret
 *    at boot — `env.validation.ts` refuses to start without it — so this cannot
 *    silently disable the check on the live site.
 *
 *  - **Cloudflare unreachable** also verifies as passed, and logs a warning.
 *    The alternative is that a Cloudflare outage stops a parent from contacting
 *    the school at all. Spam is an annoyance; an unreachable school is lost
 *    enrolments.
 */
@Injectable()
export class TurnstileService implements OnModuleInit {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly config: ConfigService) {}

  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    const secret = this.config.get<string>("turnstile.secretKey");
    if (!secret) return true;

    if (!token) {
      this.logger.warn("Enquiry rejected: Turnstile is configured but no token was sent");
      return false;
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    try {
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(`Turnstile returned ${String(response.status)}; allowing the enquiry`);
        return true;
      }

      const result = (await response.json()) as SiteVerifyResponse;
      if (!result.success) {
        this.logger.warn(`Turnstile rejected a token: ${(result["error-codes"] ?? []).join(", ")}`);
      }
      return result.success;
    } catch (error) {
      // Reaching Cloudflare is not a precondition for a parent reaching the
      // school. Log it and let the enquiry through.
      this.logger.warn(
        `Could not reach Turnstile (${error instanceof Error ? error.message : "unknown"}); allowing the enquiry`,
      );
      return true;
    }
  }

  /**
   * Asks Cloudflare, once at boot, whether the configured secret is one it
   * recognises.
   *
   * The site key and the secret only work as a pair from the same widget, and
   * nothing anywhere says so when they are not. A mismatched pair fails exactly
   * like a bot: the enquiry is refused, the parent sees a polite apology, and
   * the school hears nothing. That has now cost this project three separate
   * outages across three different paired secrets, every one of them found by a
   * person noticing something was missing rather than by anything telling us.
   *
   * The probe is a deliberately invalid token. Cloudflare answers
   * `invalid-input-secret` when the secret itself is wrong and
   * `invalid-input-response` when the secret is fine and only the token was
   * bad — so one request separates "your key pair is broken" from "your key
   * pair is healthy", without needing a real visitor to have solved anything.
   *
   * It never blocks or fails startup. An API that will not boot because
   * Cloudflare was briefly unreachable is a worse outage than the one this
   * prevents.
   */
  async onModuleInit(): Promise<void> {
    const secret = this.config.get<string>("turnstile.secretKey");
    // Nothing to check, or Cloudflare's own always-pass test secret, which is
    // what local development deliberately runs on.
    if (!secret || secret.startsWith("1x")) return;

    try {
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        body: new URLSearchParams({ secret, response: "kedland-startup-probe" }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) return;

      const result = (await response.json()) as SiteVerifyResponse;
      const codes = result["error-codes"] ?? [];

      if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
        this.logger.error(
          "TURNSTILE_SECRET_KEY is not a secret Cloudflare recognises. Every enquiry will be " +
            "refused until it is replaced with the Secret Key from the same Turnstile widget as " +
            "the site's NEXT_PUBLIC_TURNSTILE_SITE_KEY.",
        );
        return;
      }

      this.logger.log("Turnstile secret accepted by Cloudflare");
    } catch {
      // Unreachable at boot says nothing about the secret. Silent on purpose:
      // a warning nobody can act on trains people to ignore the log.
    }
  }
}
