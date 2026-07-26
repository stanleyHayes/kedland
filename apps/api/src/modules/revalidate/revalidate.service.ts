import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const TIMEOUT_MS = 5000;

/**
 * Tells the public site that something it cached has changed.
 *
 * The site is statically rendered with a one-hour revalidation window, which is
 * right for pages nobody edits most days and wrong for the moment somebody
 * presses Publish. This closes that gap: an edit calls the site's
 * `/api/revalidate` route, which purges the affected cache tags.
 *
 * Every failure here is logged and swallowed. The alternative — letting a
 * revalidation failure fail the write that triggered it — would mean the
 * school cannot save a correction because a cache could not be cleared. The
 * page still refreshes within the hour regardless, so the cost of a missed
 * call is staleness, not data loss.
 */
@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  constructor(private readonly config: ConfigService) {}

  /** A single post, plus the lists it appears in. */
  async post(slug: string): Promise<void> {
    await this.call({ tags: ["posts"], paths: [`/news/${slug}`, "/news", "/"] });
  }

  /** One page's CMS content. */
  async page(pageKey: string): Promise<void> {
    await this.call({ tags: [`content:${pageKey}`, "content"], paths: [] });
  }

  private async call(body: { tags: string[]; paths: string[] }): Promise<void> {
    const url = this.config.get<string>("revalidate.webhookUrl");
    const secret = this.config.get<string>("revalidate.secret");

    if (!url || !secret) {
      // Expected in development, where the site is not running a cache worth
      // purging. Logged at debug so it does not cry wolf on every save.
      this.logger.debug("Revalidation is not configured; the site will refresh on its own schedule");
      return;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // A shared secret rather than a signature: both ends are ours, the
          // body carries nothing sensitive, and the only thing this authorises
          // is "clear a cache".
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.warn(
          `The site refused a revalidation (${String(response.status)}); it will refresh on its own schedule`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Could not reach the site to revalidate (${error instanceof Error ? error.message : "unknown"}); it will refresh on its own schedule`,
      );
    }
  }
}
