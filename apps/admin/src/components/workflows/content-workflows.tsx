import Image from "next/image";
import Link from "next/link";

import { emptyValueFor, getSection, SECTION_SCHEMAS, toFormSpec } from "@kedland/types/content";
import { Field, Icon, TextareaField } from "@kedland/ui";

import { AdminSelectField } from "./admin-select-field";
import { CollectionToolbar } from "./collection-toolbar";
import { ConfirmForm } from "./confirm-form";
import { FormDialog } from "./form-dialog";
import {
  DANGER_BUTTON,
  Feedback,
  formatDate,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  WorkflowError,
} from "./workflow-ui";

import type { Faq, InstagramTile, MediaItem, PageKey } from "@kedland/types";
import type { FormField, SectionType } from "@kedland/types/content";

import {
  createFaqAction,
  createInstagramTileAction,
  deleteFaqAction,
  deleteInstagramTileAction,
  updateFaqAction,
  updateInstagramTileAction,
  updateSectionMediaAction,
  updateSectionAction,
} from "@/app/(dashboard)/actions";
import { SectionForm } from "@/components/content/section-form";
import { EmptyState, PageHeader, Panel, PanelHeader, StatusChip } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";

/**
 * The form description for a section type, derived once per type.
 *
 * `type` arrives from the API as a plain string, so it is checked against the
 * registry rather than asserted. A type this dashboard does not know about — a
 * newer API deployed ahead of it — yields no fields, and the caller shows a note
 * instead of an empty form that would save `{}` over real content.
 */
const SPEC_CACHE = new Map<string, readonly FormField[]>();

function specFor(type: string): readonly FormField[] {
  const cached = SPEC_CACHE.get(type);
  if (cached) return cached;

  if (!Object.hasOwn(SECTION_SCHEMAS, type)) return [];

  const spec = toFormSpec(type as SectionType);
  SPEC_CACHE.set(type, spec);
  return spec;
}

interface PublicSection {
  key: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

interface PageSummary {
  page: PageKey;
  label: string;
  sectionCount: number;
}

interface FeedbackProps {
  notice?: string | undefined;
  error?: string | undefined;
}

// The branch count is driven by schema-backed section editors, media fallbacks
// and honest error states. Splitting them would obscure the page-level flow.
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function ContentWorkflow({
  selectedPage,
  q,
  notice,
  error,
}: Readonly<{ selectedPage?: string | undefined; q?: string | undefined } & FeedbackProps>) {
  let pages: PageSummary[];
  try {
    pages = await apiFetch<PageSummary[]>("/admin/content");
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "Pages could not be loaded."} />
    );
  }

  const current = pages.find((page) => page.page === selectedPage);
  const normalized = q?.trim().toLocaleLowerCase();
  const visiblePages =
    !current && normalized
      ? pages.filter((page) => `${page.label} ${page.page}`.toLocaleLowerCase().includes(normalized))
      : pages;
  let sections: PublicSection[] = [];
  let media: MediaItem[] = [];
  let sectionError: string | null = null;
  if (current) {
    try {
      sections = await apiFetch<PublicSection[]>(`/content?page=${encodeURIComponent(current.page)}`);
    } catch (caught) {
      sectionError = caught instanceof Error ? caught.message : "Page sections could not be loaded.";
    }
    try {
      media = await apiFetch<MediaItem[]>("/admin/media");
    } catch {
      // The structured JSON editor remains available if the library is briefly unavailable.
    }
  }

  const mediaOptions = media
    .filter((item) => !item.depictsPupils || (item.consentOnFile && Boolean(item.consentRef)))
    .map((item) => ({ value: item.id, label: item.alt }));

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Content workspace"
        title={current ? current.label : "Pages"}
        description={
          current
            ? "Edit validated section values. Layout and section order remain protected in code."
            : "Choose a public page to edit its structured content."
        }
        action={
          current ? (
            <Link href="/content" className={SECONDARY_BUTTON}>
              All pages
            </Link>
          ) : undefined
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      {!current && (
        <CollectionToolbar action="/content" query={q} placeholder="Search page names and routes" />
      )}

      {!current && (
        <>
          {visiblePages.length === 0 ? (
            <Panel flush className="mt-8 overflow-hidden">
              <EmptyState
                icon={q ? "search" : "book"}
                title={q ? "No matching pages" : "No managed pages are configured"}
                body={
                  q
                    ? "Try a shorter page name or clear the search."
                    : "Page definitions are code-owned. Add a page definition before editors can manage its content here."
                }
                action={
                  q ? (
                    <Link href="/content" className={SECONDARY_BUTTON}>
                      Clear search
                    </Link>
                  ) : undefined
                }
              />
            </Panel>
          ) : (
            <Panel flush className="mt-8 overflow-hidden">
              <nav aria-label="Managed public pages" className="divide-y divide-sky/55">
                {visiblePages.map((page, index) => (
                  <Link
                    key={page.page}
                    href={`/content?page=${encodeURIComponent(page.page)}`}
                    className="admin-page-directory-row group grid min-h-24 grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition sm:grid-cols-[3.5rem_minmax(0,1fr)_auto_auto] sm:px-6"
                  >
                    <span className="font-mono text-[0.72rem] font-bold tabular-nums text-grey">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[1.05rem] font-bold text-navy transition-colors group-hover:text-blue">
                        {page.label}
                      </span>
                      <span className="mt-1 block truncate text-small text-grey">/{page.page}</span>
                    </span>
                    <StatusChip tone={page.sectionCount > 0 ? "healthy" : "attention"}>
                      {String(page.sectionCount)} {page.sectionCount === 1 ? "section" : "sections"}
                    </StatusChip>
                    <span className="hidden size-9 place-items-center rounded-md border border-sky/60 text-navy transition group-hover:translate-x-0.5 group-hover:border-blue/45 group-hover:text-blue sm:grid">
                      <Icon name="chevron-right" className="size-4" />
                    </span>
                  </Link>
                ))}
              </nav>
            </Panel>
          )}
        </>
      )}

      {current && (
        <div className="mt-8 space-y-5">
          {sectionError && <WorkflowError message={sectionError} />}
          {!sectionError && sections.length === 0 && (
            <Panel flush className="overflow-hidden">
              <EmptyState
                icon="blocks"
                title="This page has no editable sections"
                body="Its layout exists, but no schema-backed content sections are currently exposed to the dashboard."
              />
            </Panel>
          )}
          {sections.map((section, index) => {
            const mediaField = imageReferenceField(section.type, section.data);
            const definition = getSection(current.page, section.key);
            return (
              <details
                key={section.key}
                className="admin-panel rounded-lg p-5" // The first section open, the rest closed: ten collapsed rows give an
                // editor nothing to start from, and ten open forms are a wall.
                open={index === 0}
              >
                {/*
                  The registry's own words, not the storage keys.
                  
                  This read "hero  hero" and "welcome  prose-strip" — a lookup key
                  and a schema name, neither of which is what the section is called
                  or what it is for. `getSection` has carried a label and a
                  one-line hint all along; they were simply never shown.
                */}
                <summary className="cursor-pointer">
                  <span className="font-display font-bold text-navy">{definition?.label ?? section.key}</span>
                  {definition?.hint && (
                    <span className="mt-0.5 block font-body text-small font-normal text-grey">
                      {definition.hint}
                    </span>
                  )}
                </summary>
                {mediaField && (
                  <div className="mt-5">
                    <FormDialog
                      title={`Change image · ${definition?.label ?? section.key}`}
                      description="Choose approved media and describe its purpose in this placement."
                      triggerLabel="Change image"
                      triggerClassName={SECONDARY_BUTTON}
                    >
                      <form
                        action={updateSectionMediaAction}
                        className="grid gap-4 rounded-md border border-blue/15 bg-blue/[0.04] p-4"
                      >
                        <input type="hidden" name="page" value={current.page} />
                        <input type="hidden" name="key" value={section.key} />
                        <input type="hidden" name="field" value={mediaField.field} />
                        <input type="hidden" name="data" value={JSON.stringify(section.data)} />
                        <p className="font-display font-bold text-navy">Public image</p>
                        {mediaOptions.length > 0 ? (
                          <>
                            <AdminSelectField
                              id={`${section.key}-media`}
                              name="mediaId"
                              label="Approved media"
                              required
                              options={mediaOptions}
                              defaultValue={
                                mediaOptions.some((option) => option.value === mediaField.reference.mediaId)
                                  ? mediaField.reference.mediaId
                                  : mediaOptions[0]?.value
                              }
                            />
                            <Field
                              id={`${section.key}-media-alt`}
                              name="alt"
                              label="Contextual alt text"
                              required
                              defaultValue={mediaField.reference.alt}
                              hint="Describe what this image communicates in this specific placement."
                            />
                            <button type="submit" className={PRIMARY_BUTTON}>
                              Use this image
                            </button>
                          </>
                        ) : (
                          <p className="text-small text-grey">
                            Add an approved image in the{" "}
                            <Link href="/media" className="font-bold text-blue underline">
                              media library
                            </Link>{" "}
                            to replace this placement.
                          </p>
                        )}
                      </form>
                    </FormDialog>
                  </div>
                )}
                {/*
                  A form built from the section's schema, not a JSON textarea.
                  The person keeping this site current is the school office, and
                  the previous control asked them to hand-edit JSON — where a
                  missing comma failed with a message about a character offset.

                  It still posts one `data` field of JSON to the same action, so
                  the schema remains the only thing that decides what is valid.
                */}
                {(() => {
                  const spec = specFor(section.type);

                  if (spec.length === 0) {
                    return (
                      <p className="mt-5 text-small text-grey">
                        This dashboard does not recognise the section type{" "}
                        <span className="font-bold">{section.type || "(none)"}</span>, so it cannot offer a
                        form for it safely. It is most likely newer than this dashboard.
                      </p>
                    );
                  }

                  return (
                    <div className="mt-3">
                      <FormDialog
                        title={`Edit ${definition?.label ?? section.key}`}
                        description={definition?.hint ?? "Update this public page section."}
                        triggerLabel="Edit section"
                        size="wide"
                      >
                        <SectionForm
                          page={current.page}
                          sectionKey={section.key}
                          sectionType={section.type}
                          siteUrl={process.env["NEXT_PUBLIC_SITE_URL"]}
                          spec={spec}
                          // A section nobody has filled in yet gets a blank shaped
                          // like its schema, so the form has controls to type into.
                          value={Object.keys(section.data).length > 0 ? section.data : emptyValueFor(spec)}
                          mediaOptions={mediaOptions}
                          action={updateSectionAction}
                          submitClassName={PRIMARY_BUTTON}
                        />
                      </FormDialog>
                    </div>
                  );
                })()}
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}

function imageReferenceField(
  sectionType: string,
  data: Record<string, unknown>,
): {
  field: "image" | "portrait";
  reference: { mediaId: string; alt: string };
} | null {
  for (const field of ["image", "portrait"] as const) {
    const value = data[field];
    if (!value || typeof value !== "object") continue;
    const reference = value as Record<string, unknown>;
    if (typeof reference["mediaId"] !== "string" || typeof reference["alt"] !== "string") continue;
    return {
      field,
      reference: { mediaId: reference["mediaId"], alt: reference["alt"] },
    };
  }

  if (sectionType === "page-intro") {
    return {
      field: "image",
      reference: {
        mediaId: "",
        alt: "A welcoming view of life and learning at Kedland",
      },
    };
  }
  return null;
}

const FAQ_GROUP_OPTIONS = [
  { value: "admissions", label: "Admissions" },
  { value: "curriculum", label: "Curriculum" },
  { value: "school-life", label: "School life" },
  { value: "practical", label: "Practical" },
];

export async function FaqsWorkflow({
  q,
  published,
  notice,
  error,
}: Readonly<FeedbackProps & { q?: string | undefined; published?: string | undefined }>) {
  let faqs: Faq[];
  try {
    faqs = await apiFetch<Faq[]>("/admin/faqs");
  } catch (caught) {
    return <WorkflowError message={caught instanceof Error ? caught.message : "FAQs could not be loaded."} />;
  }
  const normalized = q?.trim().toLocaleLowerCase();
  const visibleFaqs = faqs.filter((faq) => {
    const matchesText =
      !normalized || `${faq.question} ${faq.answer}`.toLocaleLowerCase().includes(normalized);
    const matchesPublished =
      !published || (published === "yes" && faq.published) || (published === "no" && !faq.published);
    return matchesText && matchesPublished;
  });

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Content workspace"
        title="FAQs"
        description="Create, order and publish the answers parents see on the FAQ page."
        action={
          <FormDialog
            title="Create FAQ"
            description="Add a clear answer, choose its group and decide whether it is ready to publish."
            triggerLabel="Add FAQ"
          >
            <form action={createFaqAction} className="grid gap-4">
              <FaqFields prefix="new-faq" />
              <button type="submit" className={PRIMARY_BUTTON}>
                Create FAQ
              </button>
            </form>
          </FormDialog>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <CollectionToolbar
        action="/faqs"
        query={q}
        placeholder="Search questions and answers"
        filters={[
          {
            name: "published",
            label: "Publication",
            value: published,
            options: [
              { value: "", label: "All FAQs" },
              { value: "yes", label: "Published" },
              { value: "no", label: "Drafts" },
            ],
          },
        ]}
      />
      <div className="mt-8">
        <section aria-labelledby="faq-list">
          <PanelHeader id="faq-list" title={`Questions (${String(visibleFaqs.length)})`} />
          <div className="mt-4 space-y-3">
            {visibleFaqs.length === 0 && (
              <Panel flush className="overflow-hidden">
                <EmptyState
                  icon={q || published ? "search" : "message"}
                  title={q || published ? "No matching FAQs" : "No FAQs yet"}
                  body={
                    q || published
                      ? "Try a broader search or clear the publication filter."
                      : "Create the first answer parents should be able to find without contacting the office."
                  }
                  action={
                    q || published ? (
                      <Link href="/faqs" className={SECONDARY_BUTTON}>
                        Clear filters
                      </Link>
                    ) : undefined
                  }
                />
              </Panel>
            )}
            {visibleFaqs.map((faq) => (
              <details key={faq.id} className="admin-panel rounded-lg p-5">
                <summary className="cursor-pointer">
                  <span className="font-display font-bold text-navy">{faq.question}</span>
                  <span className="ml-3">
                    <StatusChip tone={faq.published ? "healthy" : "attention"}>
                      {faq.published ? "Published" : "Draft"}
                    </StatusChip>
                  </span>
                </summary>
                <div className="mt-5 flex flex-wrap gap-2">
                  <FormDialog
                    title={`Edit FAQ · ${faq.question}`}
                    triggerLabel="Edit FAQ"
                    triggerIcon="book"
                    triggerClassName={SECONDARY_BUTTON}
                  >
                    <form action={updateFaqAction} className="grid gap-4">
                      <input type="hidden" name="id" value={faq.id} />
                      <FaqFields faq={faq} prefix={faq.id} />
                      <button type="submit" className={PRIMARY_BUTTON}>
                        Save FAQ
                      </button>
                    </form>
                  </FormDialog>
                  <ConfirmForm action={deleteFaqAction} message={`Delete “${faq.question}”?`}>
                    <input type="hidden" name="id" value={faq.id} />
                    <button type="submit" className={DANGER_BUTTON}>
                      Delete
                    </button>
                  </ConfirmForm>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function FaqFields({ faq, prefix }: Readonly<{ faq?: Faq; prefix: string }>) {
  return (
    <>
      <AdminSelectField
        id={`${prefix}-group`}
        name="group"
        label="Group"
        required
        options={FAQ_GROUP_OPTIONS}
        defaultValue={faq?.group ?? "admissions"}
      />
      <Field
        id={`${prefix}-question`}
        name="question"
        label="Question"
        required
        defaultValue={faq?.question}
      />
      <TextareaField
        id={`${prefix}-answer`}
        name="answer"
        label="Answer"
        required
        rows={5}
        defaultValue={faq?.answer}
      />
      <Field
        id={`${prefix}-order`}
        name="order"
        type="number"
        min={0}
        label="Order"
        required
        defaultValue={faq?.order ?? 0}
      />
      <label className="flex items-center gap-2 font-semibold text-navy">
        <input
          type="checkbox"
          name="published"
          defaultChecked={faq?.published ?? false}
          className="admin-checkbox size-4 accent-navy"
        />
        Published
      </label>
    </>
  );
}

export async function InstagramWorkflow({
  q,
  published,
  notice,
  error,
}: Readonly<FeedbackProps & { q?: string | undefined; published?: string | undefined }>) {
  let tiles: InstagramTile[];
  let media: MediaItem[];
  try {
    [tiles, media] = await Promise.all([
      apiFetch<InstagramTile[]>("/admin/instagram"),
      apiFetch<MediaItem[]>("/admin/media"),
    ]);
  } catch (caught) {
    return (
      <WorkflowError
        message={caught instanceof Error ? caught.message : "Instagram tiles could not be loaded."}
      />
    );
  }

  const mediaOptions = media.map((item) => ({ value: item.id, label: item.alt }));
  const mediaById = new Map(media.map((item) => [item.id, item]));
  const normalized = q?.trim().toLocaleLowerCase();
  const visibleTiles = tiles.filter((tile) => {
    const mediaItem = mediaById.get(tile.mediaId);
    const matchesText =
      !normalized || `${tile.caption} ${mediaItem?.alt ?? ""}`.toLocaleLowerCase().includes(normalized);
    const matchesPublished =
      !published || (published === "yes" && tile.published) || (published === "no" && !tile.published);
    return matchesText && matchesPublished;
  });
  const emptyTileBody =
    q || published
      ? "Try a broader search or clear the publication filter."
      : "Create the first curated tile from an approved media-library image.";
  const finalEmptyTileBody =
    !q && !published && media.length === 0
      ? "Upload an approved image first, then return here to create the showcase."
      : emptyTileBody;

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Content workspace"
        title="Instagram showcase"
        description="Curate a manual, token-free grid using images already approved in the media library."
        action={
          media.length > 0 ? (
            <FormDialog
              title="Add showcase tile"
              description="Choose an approved image and prepare the caption shown in the public gallery."
              triggerLabel="Add tile"
            >
              <form action={createInstagramTileAction} className="grid gap-4">
                <InstagramFields mediaOptions={mediaOptions} prefix="new-instagram" />
                <button type="submit" className={PRIMARY_BUTTON}>
                  Create tile
                </button>
              </form>
            </FormDialog>
          ) : undefined
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <CollectionToolbar
        action="/instagram"
        query={q}
        placeholder="Search captions and image descriptions"
        filters={[
          {
            name: "published",
            label: "Publication",
            value: published,
            options: [
              { value: "", label: "All tiles" },
              { value: "yes", label: "Published" },
              { value: "no", label: "Drafts" },
            ],
          },
        ]}
      />

      {media.length === 0 && (
        <div className="mt-8">
          <Panel flush className="overflow-hidden">
            <EmptyState
              icon="images"
              title="Add media before building the showcase"
              body="Instagram tiles reuse approved images from the media library, including their alt text and consent record."
              action={
                <Link href="/media" className={PRIMARY_BUTTON}>
                  Open media library
                </Link>
              }
            />
          </Panel>
        </div>
      )}

      <div className="mt-8">
        <section aria-labelledby="tile-list">
          <PanelHeader id="tile-list" title={`Showcase tiles (${String(visibleTiles.length)})`} />
          <div className="mt-4 space-y-2.5">
            {visibleTiles.length === 0 && (
              <Panel flush className="overflow-hidden">
                <EmptyState
                  icon={q || published ? "search" : "camera"}
                  title={q || published ? "No matching showcase tiles" : "No showcase tiles yet"}
                  body={finalEmptyTileBody}
                  action={
                    media.length === 0 ? (
                      <Link href="/media" className={SECONDARY_BUTTON}>
                        Open media library
                      </Link>
                    ) : undefined
                  }
                />
              </Panel>
            )}
            {visibleTiles.map((tile, index) => {
              const tileMedia = mediaById.get(tile.mediaId);
              return (
                <article key={tile.id} className="admin-showcase-row admin-panel overflow-hidden rounded-lg">
                  <div className="relative min-h-28 overflow-hidden bg-sky/20">
                    {tileMedia ? (
                      <Image src={tileMedia.url} alt="" fill sizes="8rem" className="object-cover" />
                    ) : (
                      <span className="grid h-full min-h-28 place-items-center text-grey">
                        <Icon name="images" className="size-6" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[0.7rem] font-bold tabular-nums text-grey">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <StatusChip tone={tile.published ? "healthy" : "attention"}>
                        {tile.published ? "Published" : "Hidden"}
                      </StatusChip>
                    </div>
                    <p className="mt-2 line-clamp-2 max-w-4xl text-pretty font-display font-bold leading-snug text-navy">
                      {tile.caption}
                    </p>
                    <p className="mt-1 truncate text-[0.75rem] text-grey">
                      {tileMedia?.alt ?? "The linked image is no longer in the media library."}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-sky/45 p-4 sm:border-l sm:border-t-0">
                    <FormDialog
                      title="Edit showcase tile"
                      triggerLabel="Edit tile"
                      triggerIcon="camera"
                      triggerClassName={SECONDARY_BUTTON}
                    >
                      <form action={updateInstagramTileAction} className="grid gap-4">
                        <input type="hidden" name="id" value={tile.id} />
                        <InstagramFields tile={tile} mediaOptions={mediaOptions} prefix={tile.id} />
                        <button type="submit" className={PRIMARY_BUTTON}>
                          Save tile
                        </button>
                      </form>
                    </FormDialog>
                    <ConfirmForm action={deleteInstagramTileAction} message="Delete this showcase tile?">
                      <input type="hidden" name="id" value={tile.id} />
                      <button type="submit" className={DANGER_BUTTON}>
                        Delete
                      </button>
                    </ConfirmForm>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function InstagramFields({
  tile,
  mediaOptions,
  prefix,
}: Readonly<{
  tile?: InstagramTile;
  mediaOptions: { value: string; label: string }[];
  prefix: string;
}>) {
  return (
    <>
      <AdminSelectField
        id={`${prefix}-media`}
        name="mediaId"
        label="Image"
        required
        options={mediaOptions}
        defaultValue={tile?.mediaId}
      />
      <TextareaField
        id={`${prefix}-caption`}
        name="caption"
        label="Caption"
        rows={3}
        required
        defaultValue={tile?.caption}
      />
      <Field
        id={`${prefix}-href`}
        name="href"
        type="url"
        label="Instagram post URL"
        required
        defaultValue={tile?.href ?? "https://www.instagram.com/kedlandintlschool"}
      />
      <Field
        id={`${prefix}-order`}
        name="order"
        type="number"
        min={0}
        label="Order"
        required
        defaultValue={tile?.order ?? 0}
      />
      <label className="flex items-center gap-2 font-semibold text-navy">
        <input
          type="checkbox"
          name="published"
          defaultChecked={tile?.published ?? false}
          className="admin-checkbox size-4 accent-navy"
        />
        Published
      </label>
      {tile && <p className="text-small text-grey">Updated {formatDate(tile.updatedAt)}</p>}
    </>
  );
}
