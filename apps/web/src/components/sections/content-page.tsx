import { RenderSections } from "./resolve";

import type { PageKey } from "@kedland/types";

import { getPageSections } from "@/lib/api";

/**
 * Renders a page from the content registry.
 *
 * Every public page is this component plus a page key. The sections, their
 * order and their words all come from the API; the page file's only remaining
 * job is its metadata.
 *
 * When the API is unreachable the section list is empty and the page renders
 * its shell — header, footer, contact details — rather than an error. A parent
 * who cannot reach the API can still find the school's phone number.
 */
export async function ContentPage({ page }: Readonly<{ page: PageKey }>) {
  const sections = await getPageSections(page);

  if (sections.length === 0) {
    return <UnavailableNotice />;
  }

  return <RenderSections sections={sections} />;
}

function UnavailableNotice() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1>We could not load this page just now</h1>
      <p className="mt-4 text-grey">
        Please try again in a moment. If you need us urgently, call or WhatsApp{" "}
        <a href="tel:+233257130333" className="font-semibold text-blue underline">
          +233 257 130 333
        </a>
        .
      </p>
    </section>
  );
}
