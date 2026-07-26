import Link from "next/link";

import { faqGroupSchema, type FaqGroup } from "@kedland/types";
import { Icon, Star } from "@kedland/ui";

import { getFaqs } from "@/lib/api";

const PAGE_SIZE = 6;
const GROUP_LABELS: Record<FaqGroup, string> = {
  admissions: "Admissions",
  curriculum: "Curriculum",
  "school-life": "School life",
  practical: "Practical details",
};

function href(page: number, group?: string, q?: string): string {
  const params = new URLSearchParams();
  if (group) params.set("group", group);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/faqs?${params.toString()}` : "/faqs";
}

export async function FaqDirectory({
  page,
  group,
  q,
}: Readonly<{ page: number; group?: string; q?: string }>) {
  const all = await getFaqs();
  const normalized = q?.toLocaleLowerCase();
  const filtered = all.filter((faq) => {
    const matchesGroup = !group || faq.group === group;
    const matchesSearch =
      !normalized || `${faq.question} ${faq.answer}`.toLocaleLowerCase().includes(normalized);
    return matchesGroup && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const items = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <section className="relative overflow-hidden bg-cream px-6 py-16 sm:py-20">
      <Star className="pointer-events-none absolute -right-12 top-6 size-64 text-yellow/15" />
      <div className="relative mx-auto max-w-5xl">
        <div className="rounded-lg border border-sky/70 bg-white p-5 shadow-soft sm:p-7">
          <form action="/faqs" method="get" role="search" className="grid gap-4">
            <label className="font-display font-bold text-navy" htmlFor="faq-search">
              Find an answer
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <span className="relative flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-blue"
                />
                <input
                  id="faq-search"
                  name="q"
                  defaultValue={q}
                  placeholder="Search admissions, fees, learning…"
                  className="min-h-12 w-full rounded-md border border-sky bg-cream/45 py-3 pl-12 pr-4 text-ink outline-none transition focus:border-blue focus:ring-4 focus:ring-blue/10"
                />
              </span>
              {group && <input type="hidden" name="group" value={group} />}
              <button className="min-h-12 rounded-md bg-navy px-6 font-display font-bold text-white">
                Search
              </button>
            </div>
          </form>
          <nav aria-label="FAQ categories" className="mt-5 flex flex-wrap gap-2">
            <Link
              href={href(1, undefined, q)}
              className={`rounded-pill px-4 py-2 text-small font-bold ${!group ? "bg-navy text-white" : "bg-sky/35 text-navy"}`}
            >
              All
            </Link>
            {faqGroupSchema.options.map((option) => (
              <Link
                key={option}
                href={href(1, option, q)}
                className={`rounded-pill px-4 py-2 text-small font-bold ${group === option ? "bg-navy text-white" : "bg-sky/35 text-navy"}`}
              >
                {GROUP_LABELS[option]}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 grid gap-3">
          {items.map((faq) => (
            <details
              key={faq.id}
              className="group rounded-lg border border-sky/70 bg-white p-5 shadow-soft open:border-blue/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-navy">
                {faq.question}
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-sky/35 text-blue transition group-open:rotate-45">
                  <Icon name="plus" className="size-4" />
                </span>
              </summary>
              <p className="mt-4 max-w-3xl border-t border-sky/55 pt-4 leading-relaxed text-ink/80">
                {faq.answer}
              </p>
            </details>
          ))}
          {items.length === 0 && (
            <div className="rounded-lg border border-sky/70 bg-white p-10 text-center">
              <Icon name="search" className="mx-auto size-9 text-blue" />
              <h2 className="mt-4 text-h3">No matching answers</h2>
              <p className="mt-2 text-grey">Try a shorter search or browse every question.</p>
              <Link href="/faqs" className="mt-5 inline-block font-bold text-blue hover:underline">
                Clear filters
              </Link>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label="FAQ pagination" className="mt-8 flex items-center justify-between gap-4">
            {current > 1 ? (
              <Link href={href(current - 1, group, q)} className="font-bold text-blue">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-small text-grey">
              Page {String(current)} of {String(totalPages)}
            </span>
            {current < totalPages ? (
              <Link href={href(current + 1, group, q)} className="font-bold text-blue">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
