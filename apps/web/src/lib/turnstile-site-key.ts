/**
 * The Turnstile site key, if what is configured is actually one.
 *
 * Turnstile site keys are opaque but they have a shape: `0x` followed by
 * alphanumerics. Checking it is not pedantry — it is the difference between two
 * failure modes that look identical to a parent and completely different to
 * whoever has to fix them.
 *
 * The live site had `https://kedland.vercel.app` in this variable. A URL is not
 * a key, so the widget errored, no token was issued, and the API — which does
 * hold a secret and therefore does demand a token — refused every enquiry. The
 * form said only "we could not send that just now", so from the outside the site
 * looked fine and every parent who wrote in was silently turned away.
 *
 * An absent key is a legitimate state: local development and preview deploys run
 * without Cloudflare, and the API only demands a token when it has a secret of
 * its own. A *malformed* key is not a state, it is a mistake, so it is treated as
 * absent and said out loud rather than rendered as a widget that cannot work.
 */

/**
 * What a site key is definitely *not*.
 *
 * Deliberately a list of disqualifiers rather than a pattern the key must
 * match. Cloudflare's keys look like `0x4AAAAAAA…` today, but a checker that
 * demands that shape turns any future or unfamiliar format into an outage —
 * and this check exists to prevent outages, not cause them. So it rejects only
 * what cannot possibly be a key: a URL, something with whitespace in it, or
 * something far too short to be a credential.
 */
function isNotAKey(value: string): boolean {
  return value.includes("://") || /\s/.test(value) || value.length < 8;
}

export function turnstileSiteKey(raw: string | undefined): string | undefined {
  const key = raw?.trim();
  if (!key) return undefined;

  if (isNotAKey(key)) {
    // Server-side, once per render of a page carrying the form. Loud on purpose:
    // the alternative is a contact form that fails for everyone, forever, with
    // nothing anywhere to say why.
    // The one place in this app a console call earns its keep. This runs on the
    // server, and the deployment log is the only channel that reaches whoever
    // can fix it — a parent must never be shown the site's own configuration.
    // eslint-disable-next-line no-console
    console.error(
      "NEXT_PUBLIC_TURNSTILE_SITE_KEY cannot be a Turnstile site key " +
        `(got ${JSON.stringify(key.slice(0, 24))}). Cloudflare's look like 0x4AAAAAAA… — ` +
        "this is the Site Key from the Turnstile widget, not its Secret Key and not a URL. " +
        "Every enquiry will be refused until it is corrected in the site's environment.",
    );
    return undefined;
  }

  return key;
}
