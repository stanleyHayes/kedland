import Image from "next/image";
import Link from "next/link";

import { buttonClasses, Icon, Star, WaveDivider, Watermark } from "@kedland/ui";

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
        <Star className="pointer-events-none absolute -right-10 top-1/3 size-56 text-white/[0.035]" />
        <Star className="pointer-events-none absolute bottom-12 left-5 size-24 text-white/[0.04]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-6 sm:pb-16">
          <section className="relative -mt-2 overflow-hidden rounded-lg bg-linear-to-r from-red to-pink px-7 py-9 shadow-lift sm:px-10 sm:py-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <Watermark name="star" className="-bottom-14 -right-7 size-56 text-white opacity-[0.08]" />
            <div className="relative max-w-2xl">
              <p className="text-small font-bold uppercase tracking-[0.13em] text-white/70">
                Your next chapter starts here
              </p>
              <h2 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] text-white">Come and discover Kedland.</h2>
              <p className="mt-3 text-white/75">
                Meet our team, explore the school and see how your child could thrive as one of our Stars.
              </p>
            </div>
            <div className="relative mt-7 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
              <Link href="/admissions" className={buttonClasses({ variant: "tertiary", size: "lg" })}>
                Explore admissions
              </Link>
              <Link
                href="/contact"
                className={buttonClasses({
                  variant: "outline-inverse",
                  size: "lg",
                })}
              >
                Book a tour
              </Link>
            </div>
          </section>

          <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.8fr_1.05fr] lg:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <span className="inline-flex shrink-0 rounded-lg bg-white p-2.5 shadow-card">
                  <Image
                    src="/logo/kedland-logo-256.png"
                    alt="Kedland International School"
                    width={256}
                    height={256}
                    className="size-16 object-contain"
                  />
                </span>
                <div>
                  <p className="font-display text-h3 font-extrabold text-white">Kedland</p>
                  <p className="text-small text-white/55">International School</p>
                </div>
              </div>

              <p className="mt-7 max-w-sm font-display text-[1.65rem] font-extrabold leading-tight text-white">
                The future begins here
              </p>
              <p className="mt-3 max-w-md text-small leading-relaxed text-white/62">
                A warm, British-curriculum school for Daycare through Primary 3 in Lashibi-Tema.
              </p>

              <div className="relative mt-8 inline-flex min-h-20 items-center overflow-visible pl-5">
                <Star className="pointer-events-none absolute -left-3 top-1/2 size-24 -translate-y-1/2 text-yellow opacity-[0.11]" />
                <p className="relative font-display text-[clamp(2.15rem,3.3vw,3rem)] font-extrabold leading-none tracking-[-0.04em] text-yellow/58">
                  In God We Trust
                </p>
              </div>
            </div>

            <nav aria-label="Footer">
              <h2 className="text-small font-bold uppercase tracking-[0.12em] text-white/45">
                Explore Kedland
              </h2>
              <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-white/78 transition-colors hover:text-yellow"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/faqs" className="text-white/78 transition-colors hover:text-yellow">
                    FAQs
                  </Link>
                </li>
              </ul>

              <h2 className="mt-9 text-small font-bold uppercase tracking-[0.12em] text-white/45">
                Follow our Stars
              </h2>
              <a
                href="https://www.instagram.com/kedlandintlschool"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-4 inline-flex min-h-12 items-center gap-2.5 rounded-pill border border-white/20 px-4 py-2.5 text-white/85 transition-colors hover:border-yellow hover:text-yellow"
              >
                <InstagramIcon />
                <span>@kedlandintlschool</span>
              </a>
            </nav>

            <div>
              <h2 className="text-small font-bold uppercase tracking-[0.12em] text-white/45">
                Visit or call
              </h2>
              <address className="mt-5 not-italic leading-relaxed text-white/78">
                Community 19 Annex, Lashibi-Tema
                <br />
                near Deon Recreational Centre
                <br />
                Greater Accra, Ghana
              </address>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Kedland%20International%20School%2C%20Community%2019%20Annex%2C%20Lashibi%2C%20Tema%2C%20Ghana"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-pill bg-white/8 px-4 py-2 text-small font-bold text-white hover:bg-white/15 hover:text-yellow"
              >
                <Icon name="map-pin" className="size-4" />
                Open directions
              </a>

              <ul className="mt-6 border-t border-white/12 pt-5">
                {PHONES.map((phone, index) => (
                  <li key={phone} className={index === 0 ? "" : "mt-2"}>
                    <a
                      href={telHref(phone)}
                      className={`font-display font-bold transition-colors hover:text-yellow ${
                        index === 0 ? "text-h3 text-white" : "text-white/72"
                      }`}
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/[0.025]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-small text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} Kedland International School. All rights reserved.</p>
            <p>
              Thoughtfully built by{" "}
              <span className="font-semibold text-white/72">XCreativs Technologies</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
