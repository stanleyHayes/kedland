import { Injectable, Logger } from "@nestjs/common";
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
export class TurnstileService {
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
}
