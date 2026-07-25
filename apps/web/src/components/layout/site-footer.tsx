import Image from "next/image";
import Link from "next/link";

import { Star, WaveDivider } from "@kedland/ui";

import { NAV_LINKS } from "./nav-config";

/**
 * The global footer — build package §3.
 *
 * Deep navy with a wavy top edge, the logo in a white "sticker" card (the crest
 * is navy, so it must never sit bare on navy — §2.2), the tagline, quick links,
 * the contact block, socials, the school's motto, and the credits.
 *
 * The contact details are the real ones from the flyers. They move to the CMS
 * `settings` document in Phase 3; until then this is the single place to change
 * them.
 */

const PHONES = ["+233 257 130 333", "+233 202 472 472", "+233 244 958 103"] as const;

/** Strips spaces for the `tel:` target while the displayed number stays readable. */
function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      className="size-5"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24">
      <WaveDivider fill="navyDeep" variant="double" />

      <div className="relative overflow-hidden bg-navy-deep text-white">
        <Star className="pointer-events-none absolute -right-6 top-10 size-40 text-white/[0.04]" />
        <Star className="pointer-events-none absolute bottom-8 left-8 size-20 text-white/[0.05]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
          <div>
            {/* White sticker: the crest is navy and would disappear otherwise. */}
            <span className="inline-flex rounded-lg bg-white p-3 shadow-card">
              <Image
                src="/logo/kedland-logo-256.png"
                alt="Kedland International School"
                width={256}
                height={256}
                className="h-16 w-auto"
              />
            </span>
            <p className="mt-5 font-display text-h3 font-bold">The future begins here</p>
            <p className="mt-2 max-w-xs text-small text-white/70">
              A warm, British-curriculum school for Daycare through Primary 3 in Lashibi-Tema.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-small font-bold uppercase tracking-[0.08em] text-white/60">Explore</h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/85 transition-colors hover:text-yellow">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/faqs" className="text-white/85 transition-colors hover:text-yellow">
                  FAQs
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-small font-bold uppercase tracking-[0.08em] text-white/60">Visit us</h2>
            <address className="mt-4 not-italic text-white/85">
              Community 19 Annex, Lashibi-Tema
              <br />
              near Deon Recreational Centre
              <br />
              Greater Accra, Ghana
            </address>
            <ul className="mt-4 flex flex-col gap-1.5">
              {PHONES.map((phone) => (
                <li key={phone}>
                  <a href={telHref(phone)} className="text-white/85 transition-colors hover:text-yellow">
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-small font-bold uppercase tracking-[0.08em] text-white/60">Follow</h2>
            <a
              href="https://www.instagram.com/kedlandintlschool"
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-2.5 rounded-pill border border-white/25 px-4 py-2.5 transition-colors hover:border-yellow hover:text-yellow"
            >
              <InstagramIcon />
              <span>@kedlandintlschool</span>
            </a>

            <p className="mt-8 flex items-center gap-2 font-display text-h3 font-bold text-yellow">
              <Star className="size-4" />
              In God We Trust
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/12">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-small text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} Kedland International School. All rights reserved.</p>
            <p>
              Website by <span className="font-semibold text-white/80">XCreativs Technologies</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
