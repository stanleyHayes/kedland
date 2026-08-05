import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";

import { buttonClasses, Icon, Star, WaveDivider, Watermark } from "@kedland/ui";

import { NAV_LINKS } from "./nav-config";

import { FALLBACK_SOCIALS, SCHOOL_ADDRESS, SCHOOL_PHONES, type SchoolSocials } from "@/lib/site";

/**
 * The global footer — build package §3.
 *
 * Deep navy with a wavy top edge, the logo in a white "sticker" card (the crest
 * is navy, so it must never sit bare on navy — §2.2), the tagline, quick links,
 * the contact block, socials, the school's motto, and the credits.
 *
 * Social profile URLs come from CMS settings (via the root layout). Contact
 * phones and address still read from `lib/site` until those fields are wired
 * the same way.
 */

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

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-5">
      <path d="M16.6 5.8A5.3 5.3 0 0114.5 2h-2.7v13.2a2.7 2.7 0 11-2.7-2.7c.2 0 .5 0 .7.1v-2.8a5.5 5.5 0 00-.7-.1 5.4 5.4 0 105.4 5.4V9.7a8 8 0 004.8 1.6V8.6a5.4 5.4 0 01-2.7-.8z" />
    </svg>
  );
}

const SOCIAL_LINK =
  "inline-flex size-12 items-center justify-center rounded-pill border border-white/20 text-white/85 transition-colors hover:border-yellow hover:text-yellow";

export function SiteFooter({ socials = FALLBACK_SOCIALS }: Readonly<{ socials?: SchoolSocials }>) {
  const year = new Date().getFullYear();
  const profiles = [
    { href: socials.instagram, label: "Instagram", icon: <InstagramIcon /> },
    { href: socials.facebook, label: "Facebook", icon: <FacebookIcon /> },
    { href: socials.tiktok, label: "TikTok", icon: <TikTokIcon /> },
  ].filter((profile) => profile.href.trim().length > 0);

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
                <span className="brand-sticker inline-flex shrink-0 rounded-lg bg-white p-2.5 shadow-card">
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
              <h2 className="text-small font-bold uppercase tracking-[0.12em] text-white/70">
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

              {profiles.length > 0 && (
                <>
                  <h2 className="mt-9 text-small font-bold uppercase tracking-[0.12em] text-white/70">
                    Follow our Stars
                  </h2>
                  <ul className="mt-4 flex flex-wrap gap-2.5">
                    {profiles.map((profile) => (
                      <li key={profile.label}>
                        <a
                          href={profile.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={profile.label}
                          className={SOCIAL_LINK}
                        >
                          {profile.icon}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </nav>

            <section
              aria-labelledby="footer-contact-heading"
              className="overflow-hidden rounded-[1.35rem] border border-white/12 bg-white/[0.055] shadow-[10px_12px_28px_rgba(1,20,34,0.26),-5px_-5px_16px_rgba(255,255,255,0.035)]"
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-[0.9rem] border border-white/10 bg-white/[0.07] text-yellow shadow-[inset_1px_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(1,20,34,0.2)]">
                    <Icon name="map-pin" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="footer-contact-heading"
                      className="text-small font-bold uppercase tracking-[0.12em] text-white/70"
                    >
                      Visit or call
                    </h2>
                    <address className="mt-2 not-italic leading-relaxed text-white/80">
                      {SCHOOL_ADDRESS.lines.map((line, index) => (
                        <Fragment key={line}>
                          {index > 0 && <br />}
                          {line}
                        </Fragment>
                      ))}
                    </address>
                  </div>
                </div>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Kedland%20International%20School%2C%20Community%2019%20Annex%2C%20Lashibi%2C%20Tema%2C%20Ghana"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group mt-5 flex min-h-12 items-center gap-3 rounded-[0.9rem] border border-white/10 bg-navy-deep/35 px-4 py-2.5 font-display font-bold text-yellow transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-yellow/45 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                >
                  <span className="flex-1">Open directions</span>
                  <Icon
                    name="chevron-right"
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </a>
              </div>

              <div className="border-t border-white/12 bg-navy-deep/20 p-6 sm:p-7">
                <p className="text-small font-semibold text-white/58">Call or WhatsApp the school:</p>
                <ul className="mt-3 divide-y divide-white/12">
                  {SCHOOL_PHONES.map((phone) => (
                    <li key={phone}>
                      <a
                        href={telHref(phone)}
                        className="group flex min-h-14 items-center gap-3 py-2 font-display font-bold text-white transition-colors hover:text-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow"
                      >
                        <Icon name="phone" className="size-4 shrink-0 text-yellow" />
                        <span className="flex-1">{phone}</span>
                        <Icon
                          name="chevron-right"
                          className="size-4 text-white/45 transition-transform group-hover:translate-x-1 group-hover:text-yellow"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-white/[0.025]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-small text-white/70 sm:flex-row sm:items-center sm:justify-between">
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
