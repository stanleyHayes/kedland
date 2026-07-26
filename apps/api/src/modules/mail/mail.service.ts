import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ENQUIRY_TOPIC_LABELS, SCHOOL_LEVEL_LABELS, type EnquiryInput } from "@kedland/types";

const RESEND_URL = "https://api.resend.com/emails";

/** `"https://x/"` → `"https://x"`. See the note at the call site. */
function trimTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === "/") end -= 1;
  return url.slice(0, end);
}
const TIMEOUT_MS = 8000;

/**
 * Tells the school about an enquiry.
 *
 * Delivery is attempted *after* the enquiry is persisted and its result is
 * recorded rather than thrown. A Resend outage must never turn into a parent
 * seeing an error and assuming the school did not receive their message — the
 * message is already saved, and the dashboard flags anything undelivered.
 *
 * The email is **plain text, not HTML**. A parent's message is untrusted input
 * landing in the school's inbox, and the only robust way to put untrusted text
 * into an HTML document is to not have an HTML document: hand-rolled escaping
 * is the classic place this goes wrong, and pulling in a sanitiser to send an
 * internal notification would be a dependency bought for nothing. Plain text
 * has no markup context to escape into, and reads perfectly well for what this
 * is — a note to the office saying somebody got in touch.
 *
 * Talking to Resend over `fetch` rather than their SDK keeps one fewer
 * dependency in a supply chain the repo deliberately keeps small; the API is
 * one POST.
 *
 * Lives in its own module rather than under `enquiries/` because staff
 * invitations need it too — and an invitation that fails to send is a person who
 * cannot sign in, so unlike an enquiry notification it is reported rather than
 * logged and swallowed.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Whether mail can actually be sent.
   *
   * Callers that must not proceed without delivery check this first — inviting
   * somebody, above all. `sendEnquiry` deliberately does not: an enquiry is
   * saved either way, and refusing the parent's message because the school has
   * not finished configuring Resend would be the worse failure.
   */
  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>("mail.apiKey") &&
      this.config.get<string>("mail.from") &&
      this.config.get<string>("mail.dashboardUrl"),
    );
  }

  /**
   * Invites a member of staff to set their own password.
   *
   * Throws rather than returning false. An invitation is the only thing standing
   * between the new person and an account they cannot use, so a silent failure
   * would leave an administrator believing they had invited somebody. The
   * account is created first and kept — resending is a button in the dashboard,
   * and a fresh token is one click away.
   */
  async sendInvitation(invitation: { to: string; displayName: string; token: string }): Promise<void> {
    const apiKey = this.config.get<string>("mail.apiKey");
    const from = this.config.get<string>("mail.from");
    const dashboardUrl = this.config.get<string>("mail.dashboardUrl");

    if (!apiKey || !from || !dashboardUrl) {
      throw new Error("Mail is not configured, so the invitation could not be sent");
    }

    // Trailing slashes trimmed without a regex: an anchored `/+$` backtracks on
    // a long run of them, and a URL pasted into an environment variable is
    // exactly where a run of slashes comes from.
    //
    // `encodeURIComponent` on a hex token is belt and braces — but the token
    // generator is one edit away from base64url, whose `-` and `_` are safe
    // while a future `+` or `=` would not be.
    const base = trimTrailingSlashes(dashboardUrl);
    const link = `${base}/password/reset?token=${encodeURIComponent(invitation.token)}`;

    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [invitation.to],
        subject: "Your Kedland dashboard account",
        text: [
          `Hello ${invitation.displayName},`,
          "",
          "An account has been created for you on the Kedland International School",
          "dashboard. Choose your password here:",
          "",
          link,
          "",
          "The link is valid for one hour. If it has expired, ask whoever invited",
          "you to send another.",
          "",
          "—",
          "Kedland International School",
        ].join("\n"),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Resend refused the invitation email (${String(response.status)})`);
    }
  }

  /** @returns whether the school was actually told. */
  async sendEnquiry(enquiry: EnquiryInput): Promise<boolean> {
    const apiKey = this.config.get<string>("mail.apiKey");
    const to = this.config.get<string>("mail.toSchool");
    const from = this.config.get<string>("mail.from");

    if (!apiKey || !to || !from) {
      this.logger.warn("Mail is not configured; the enquiry was saved but nobody was emailed");
      return false;
    }

    try {
      const response = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          // So a reply from the office goes to the parent, not into the void.
          reply_to: enquiry.email,
          subject: this.subject(enquiry),
          text: this.body(enquiry),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        this.logger.error(`Resend refused the enquiry email: ${String(response.status)}`);
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Could not send the enquiry email: ${error instanceof Error ? error.message : "unknown"}`,
      );
      return false;
    }
  }

  /**
   * The subject line leads with the topic, so the office can triage from the
   * inbox list without opening anything.
   */
  private subject(enquiry: EnquiryInput): string {
    return `${ENQUIRY_TOPIC_LABELS[enquiry.topic]} — ${enquiry.parentName}`;
  }

  private body(enquiry: EnquiryInput): string {
    return [
      "A new enquiry came in through the Kedland website.",
      "",
      `Name:      ${enquiry.parentName}`,
      `Email:     ${enquiry.email}`,
      `Phone:     ${enquiry.phone}`,
      `About:     ${ENQUIRY_TOPIC_LABELS[enquiry.topic]}`,
      `Level:     ${SCHOOL_LEVEL_LABELS[enquiry.level]}`,
      "",
      "Message:",
      enquiry.message,
      "",
      "—",
      "Reply to this email to answer the parent directly.",
    ].join("\n");
  }
}
