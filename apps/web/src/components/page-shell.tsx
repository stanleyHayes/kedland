import Link from "next/link";

import { Chip, Star } from "@kedland/ui";

/**
 * Interim page shell.
 *
 * Every route in the navigation exists from Phase 1 so the header never links
 * to a 404. Phase 4 replaces the body of each with its real sections, built
 * from the content registry; the titles, descriptions and headings here are
 * already the build package's own (§4), so the SEO and the information
 * architecture are correct even while the content is pending.
 */
export interface PageShellProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** What Phase 4 will put here, so the page says something true meanwhile. */
  coming: readonly string[];
}

export function PageShell({ eyebrow, title, intro, coming }: Readonly<PageShellProps>) {
  return (
    <article className="relative mx-auto max-w-4xl px-6 py-16">
      <Star className="pointer-events-none absolute -right-4 top-6 -z-10 size-32 text-yellow/20" />

      <p className="text-small font-bold uppercase tracking-[0.06em] text-red-text">{eyebrow}</p>
      <h1 className="mt-3">{title}</h1>
      <p className="mt-5 max-w-2xl text-grey">{intro}</p>

      <section className="mt-12 rounded-lg border border-sky bg-white/70 p-7">
        <h2 className="text-h3">On this page</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {coming.map((item) => (
            <li key={item}>
              <Chip>{item}</Chip>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-small text-grey">
          This page is being built. In the meantime, you are very welcome to{" "}
          <Link href="/contact" className="font-semibold text-blue underline">
            get in touch
          </Link>{" "}
          — we would love to hear from you.
        </p>
      </section>
    </article>
  );
}
