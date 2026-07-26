import { RenderSections } from "./resolve";

import type { PageKey } from "@kedland/types";

import { admissionFormExists } from "@/lib/admission-form";
import { getGalleryTiles, getPageSections } from "@/lib/api";

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
export interface ContentPageProps {
  page: PageKey;
  /** Optional page-family content placed immediately before the closing CTA. */
  beforeLast?: React.ReactNode;
  /**
   * Whether this component is the whole page.
   *
   * `/news` composes CMS copy *above its own generated post list*, so when the
   * copy fails to load the rest of the page is still working. Announcing "we
   * could not load this page" as the `h1` above a perfectly good list of posts
   * was both untrue and a second `h1` on the document. Pass `false` and the
   * failure is reported as a modest banner instead.
   */
  standalone?: boolean;
}

export async function ContentPage({ page, beforeLast, standalone = true }: Readonly<ContentPageProps>) {
  const sections = await getPageSections(page);

  if (sections.length === 0) {
    return <UnavailableNotice standalone={standalone} />;
  }

  const galleryTiles = sections.some((section) => section.type === "instagram")
    ? await getGalleryTiles()
    : undefined;

  return (
    <RenderSections
      sections={sections}
      admissionFormAvailable={admissionFormExists()}
      beforeLast={beforeLast}
      {...(galleryTiles ? { galleryTiles } : {})}
    />
  );
}

function UnavailableNotice({ standalone }: Readonly<{ standalone: boolean }>) {
  if (!standalone) {
    return (
      <section className="px-6 pt-12">
        <output className="mx-auto block max-w-6xl rounded-lg bg-yellow/25 px-5 py-4 text-ink">
          Some of this page could not be loaded just now. Everything below is up to date.
        </output>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1>We could not load this page just now</h1>
      <p className="mt-4 text-ink">
        Please try again in a moment. If you need us urgently, call or WhatsApp{" "}
        <a href="tel:+233257130333" className="font-semibold text-navy underline">
          +233 257 130 333
        </a>
        .
      </p>
    </section>
  );
}
