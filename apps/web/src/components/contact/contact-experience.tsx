import Link from "next/link";

import { Icon, Star, Watermark } from "@kedland/ui";

import { EnquiryForm } from "./enquiry-form";

import type { PageIntroData } from "@/components/sections/blocks";
import type { ContactDetailsData } from "@/components/sections/blocks-extra";

const PHONES = ["+233 257 130 333", "+233 202 472 472", "+233 244 958 103"] as const;
const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "Kedland International School, Community 19 Annex, Lashibi, Tema, Ghana",
)}`;

interface ContactExperienceProps {
  intro: PageIntroData;
  details: ContactDetailsData;
}

function ActionLink({
  href,
  icon,
  label,
  detail,
  external = false,
}: Readonly<{
  href: string;
  icon: string;
  label: string;
  detail: string;
  external?: boolean;
}>) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="group flex min-h-20 items-center gap-4 border-b border-white/12 py-4 last:border-0"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-white/10 text-yellow transition-colors group-hover:bg-yellow group-hover:text-navy">
        <Icon name={icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-small text-white/55">{detail}</span>
      </span>
      <span
        aria-hidden="true"
        className="text-xl text-white/45 transition-transform group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  );
}

/**
 * The contact page is deliberately its own composition instead of a stack of
 * generic CMS blocks. Contact has one job: help a parent choose how to reach
 * the school, then make that route effortless.
 */
export function ContactExperience({ intro, details }: Readonly<ContactExperienceProps>) {
  return (
    <>
      <section className="relative overflow-hidden bg-navy px-6 pb-28 pt-16 text-white sm:pb-32 sm:pt-20">
        <Star className="pointer-events-none absolute -right-8 top-12 size-52 text-yellow/[0.08]" />
        <span className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-pill bg-blue/15 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          <div>
            <p className="text-small font-bold uppercase tracking-[0.16em] text-yellow">{intro.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.98] text-white">
              Let&apos;s start a conversation.
            </h1>
            <p className="mt-7 max-w-2xl text-[1.12rem] leading-relaxed text-white/72">{intro.standfirst}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-small font-bold">
              <span className="rounded-pill bg-white/10 px-4 py-2 text-white/80">Admissions enquiries</span>
              <span className="rounded-pill bg-white/10 px-4 py-2 text-white/80">School tours</span>
              <span className="rounded-pill bg-white/10 px-4 py-2 text-white/80">General questions</span>
            </div>
          </div>

          <aside className="relative overflow-hidden rounded-lg border border-white/12 bg-navy-deep/65 px-6 py-5 shadow-lift backdrop-blur-sm sm:px-8">
            <Watermark name="phone" className="-bottom-8 -right-8 size-48 text-white opacity-[0.04]" />
            <p className="relative text-small font-bold uppercase tracking-[0.12em] text-white/45">
              Choose a quick route
            </p>
            <div className="relative mt-2">
              <ActionLink
                href={`tel:${PHONES[0].replace(/\s/g, "")}`}
                icon="phone"
                label="Call the school office"
                detail={PHONES[0]}
              />
              <ActionLink
                href="#enquiry"
                icon="star"
                label="Book a school tour"
                detail="Tell us your preferred day"
              />
              <ActionLink
                href={MAP_URL}
                icon="map-pin"
                label="Open directions"
                detail="Community 19 Annex, Lashibi-Tema"
                external
              />
            </div>
          </aside>
        </div>
      </section>

      <section className="relative z-10 -mt-16 px-6 pb-20 sm:-mt-20">
        <div className="mx-auto grid max-w-6xl items-start gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          <div
            id="enquiry"
            className="relative scroll-mt-32 overflow-hidden rounded-[1.5rem] border border-sky/70 bg-white p-7 shadow-lift sm:p-10 lg:p-12"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-red via-pink to-yellow" />
            <p className="text-small font-bold uppercase tracking-[0.13em] text-red">Send a note</p>
            <h2 className="mt-3">{details.formHeading}</h2>
            <p className="mt-3 max-w-2xl text-ink/70">
              Share a few details and we&apos;ll connect you with the right person at Kedland.
            </p>
            <div className="mt-8">
              <EnquiryForm
                apiUrl={process.env["NEXT_PUBLIC_API_URL"] ?? ""}
                turnstileSiteKey={process.env["NEXT_PUBLIC_TURNSTILE_SITE_KEY"]}
              />
            </div>
          </div>

          <div className="space-y-6 lg:pt-16">
            <section className="relative overflow-hidden rounded-[1.25rem] border border-blue/12 bg-sky/35 p-7 shadow-card sm:p-8">
              <Watermark name="map-pin" className="text-navy" />
              <div className="relative">
                <span className="grid size-12 place-items-center rounded-pill bg-white text-navy shadow-card">
                  <Icon name="map-pin" className="size-5" />
                </span>
                <p className="mt-6 text-small font-bold uppercase tracking-[0.11em] text-grey">
                  {details.mapHeading}
                </p>
                <h2 className="mt-2 text-h3">Community 19 Annex</h2>
                <address className="mt-3 not-italic leading-relaxed text-ink/75">
                  Lashibi-Tema, near Deon Recreational Centre
                  <br />
                  Greater Accra, Ghana
                </address>
                <a
                  href={MAP_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-pill bg-navy px-5 py-3 font-display font-bold text-white hover:bg-navy-deep"
                >
                  Get directions <span aria-hidden="true">→</span>
                </a>
              </div>
            </section>

            <section className="overflow-hidden rounded-[1.25rem] border border-yellow/55 bg-white shadow-card">
              <div className="bg-yellow/18 p-7 sm:p-8">
                <div className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-yellow/25 text-navy">
                    <Icon name="clock" className="size-5" />
                  </span>
                  <div>
                    <p className="text-small font-bold uppercase tracking-[0.1em] text-grey">School office</p>
                    <p className="mt-2 font-display text-h3 font-bold text-navy">Mon–Fri, 7:00am–5:00pm</p>
                    <p className="mt-2 text-small leading-relaxed text-grey">
                      After-school service and weekend drop-off are available by arrangement.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-yellow/45 p-7 sm:p-8">
                <p className="text-small font-semibold text-grey">Call or WhatsApp the school:</p>
                <ul className="mt-4 divide-y divide-sky/60">
                  {PHONES.map((phone) => (
                    <li key={phone}>
                      <a
                        href={`tel:${phone.replace(/\s/g, "")}`}
                        className="group flex min-h-12 items-center gap-3 py-2 font-display font-bold text-navy hover:text-blue"
                      >
                        <Icon name="phone" className="size-4 shrink-0 text-blue" />
                        <span className="flex-1">{phone}</span>
                        <span
                          aria-hidden="true"
                          className="text-grey transition-transform group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <p className="px-2 text-small text-grey">
              Looking for a quick answer?{" "}
              <Link href="/faqs" className="font-bold text-blue underline-offset-4 hover:underline">
                Browse our FAQs →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
