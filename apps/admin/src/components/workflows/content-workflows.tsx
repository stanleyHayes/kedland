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
import type { ReactNode } from "react";

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
import { MediaPicker, type MediaPickerOption } from "@/components/content/media-picker";
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

function readableLabel(key: string): string {
  return key
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("-", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function previewValue(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const items = value.map(previewValue).filter((item): item is string => item !== null);
    return items.length > 0 ? items.slice(0, 4).join(" · ") : null;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      previewValue(record["heading"]) ??
      previewValue(record["title"]) ??
      previewValue(record["label"]) ??
      previewValue(record["body"]) ??
      null
    );
  }
  return null;
}

function CurrentSectionSnapshot({
  data,
  image,
  imageAlt,
}: Readonly<{
  data: Record<string, unknown>;
  image?: MediaItem | undefined;
  imageAlt?: string | undefined;
}>) {
  const rows = Object.entries(data)
    .filter(([key]) => key !== "image" && key !== "portrait")
    .map(([key, value]) => ({ key, value: previewValue(value) }))
    .filter((row): row is { key: string; value: string } => row.value !== null)
    .slice(0, 5);

  return (
    <section className="admin-current-content mt-5 overflow-hidden rounded-md border border-sky/60 bg-white/55">
      <div className="flex items-center justify-between gap-3 border-b border-sky/55 px-4 py-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-blue">
          Current public content
        </p>
        <StatusChip tone="healthy">Available</StatusChip>
      </div>
      <div className={`grid gap-0 ${image ? "md:grid-cols-[15rem_minmax(0,1fr)]" : ""}`}>
        {image && (
          <div className="relative min-h-44 overflow-hidden border-b border-sky/45 bg-sky/20 md:border-b-0 md:border-r">
            <Image src={image.url} alt={imageAlt ?? image.alt} fill sizes="15rem" className="object-cover" />
          </div>
        )}
        <dl className="grid content-start gap-3 p-4 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="min-w-0">
              <dt className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-grey">
                {readableLabel(row.key)}
              </dt>
              <dd className="mt-1 line-clamp-3 text-small leading-relaxed text-ink">{row.value}</dd>
            </div>
          ))}
          {rows.length === 0 && (
            <div>
              <dt className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-grey">Section</dt>
              <dd className="mt-1 text-small text-grey">This section currently contains media only.</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
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
    .map((item) => ({ value: item.id, label: item.alt, imageUrl: item.url }));

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
            const currentMedia = mediaField
              ? media.find(
                  (item) =>
                    item.id === mediaField.reference.mediaId ||
                    item.publicId === mediaField.reference.mediaId,
                )
              : undefined;
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
                <CurrentSectionSnapshot
                  data={section.data}
                  image={currentMedia}
                  imageAlt={mediaField?.reference.alt}
                />
                <div className={`mt-5 grid gap-3 sm:items-start ${mediaField ? "sm:grid-cols-2" : ""}`}>
                  {mediaField && (
                    <FormDialog
                      title={`Change image · ${definition?.label ?? section.key}`}
                      description="Choose approved media and describe its purpose in this placement."
                      triggerLabel="Change image"
                      triggerClassName={`${SECONDARY_BUTTON} w-full`}
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
                            <MediaPicker
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
                        <p className="text-small text-grey sm:col-span-2">
                          This dashboard does not recognise the section type{" "}
                          <span className="font-bold">{section.type || "(none)"}</span>, so it cannot offer a
                          form for it safely. It is most likely newer than this dashboard.
                        </p>
                      );
                    }

                    return (
                      <FormDialog
                        title={`Edit ${definition?.label ?? section.key}`}
                        description={definition?.hint ?? "Update this public page section."}
                        triggerLabel="Edit section"
                        triggerClassName={`${PRIMARY_BUTTON} w-full`}
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
                    );
                  })()}
                </div>
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
                <p className="mt-5 max-w-4xl whitespace-pre-wrap text-pretty leading-7 text-ink">
                  {faq.answer}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/faqs/${faq.id}`} className={SECONDARY_BUTTON}>
                    View details
                  </Link>
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

export async function FaqDetailWorkflow({ id, notice, error }: Readonly<{ id: string } & FeedbackProps>) {
  let faq: Faq;
  try {
    faq = await apiFetch<Faq>(`/admin/faqs/${id}`);
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "The FAQ could not be loaded."} />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Content · FAQs"
        title={faq.question}
        description={`${FAQ_GROUP_OPTIONS.find((group) => group.value === faq.group)?.label ?? faq.group} · Last saved ${formatDate(faq.updatedAt)}`}
        icon="sparkle"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/faqs" className={SECONDARY_BUTTON}>
              Back to FAQs
            </Link>
            <FormDialog
              title={`Edit FAQ · ${faq.question}`}
              description="Update the answer, grouping, order and publication state."
              triggerLabel="Edit FAQ"
            >
              <form action={updateFaqAction} className="grid gap-4">
                <input type="hidden" name="id" value={faq.id} />
                <input type="hidden" name="returnTo" value={`/faqs/${faq.id}`} />
                <FaqFields faq={faq} prefix={`detail-${faq.id}`} />
                <button type="submit" className={PRIMARY_BUTTON}>
                  Save FAQ
                </button>
              </form>
            </FormDialog>
          </div>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-red-text">Answer</p>
          <p className="mt-4 whitespace-pre-wrap text-pretty text-[1.05rem] leading-8 text-ink">
            {faq.answer}
          </p>
        </Panel>
        <aside className="space-y-6">
          <Panel>
            <PanelHeader title="FAQ details" />
            <dl className="admin-detail-list mt-5">
              <DetailRow label="Publication">
                <StatusChip tone={faq.published ? "healthy" : "attention"}>
                  {faq.published ? "Published" : "Draft"}
                </StatusChip>
              </DetailRow>
              <DetailRow label="Group" value={faq.group.replaceAll("-", " ")} capitalize />
              <DetailRow label="Order" value={String(faq.order)} />
              <DetailRow label="Created" value={formatDate(faq.createdAt)} />
              <DetailRow label="Updated" value={formatDate(faq.updatedAt)} />
            </dl>
          </Panel>
          <ConfirmForm action={deleteFaqAction} message={`Delete “${faq.question}”?`}>
            <input type="hidden" name="id" value={faq.id} />
            <button type="submit" className={`${DANGER_BUTTON} w-full`}>
              Delete FAQ
            </button>
          </ConfirmForm>
        </aside>
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

  const mediaOptions = media.map((item) => ({ value: item.id, label: item.alt, imageUrl: item.url }));
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
                    <Link href={`/instagram/${tile.id}`} className={SECONDARY_BUTTON}>
                      View details
                    </Link>
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

export async function InstagramDetailWorkflow({
  id,
  notice,
  error,
}: Readonly<{ id: string } & FeedbackProps>) {
  let tile: InstagramTile;
  let media: MediaItem[];
  try {
    [tile, media] = await Promise.all([
      apiFetch<InstagramTile>(`/admin/instagram/${id}`),
      apiFetch<MediaItem[]>("/admin/media"),
    ]);
  } catch (caught) {
    return (
      <WorkflowError
        message={caught instanceof Error ? caught.message : "The showcase tile could not be loaded."}
      />
    );
  }

  const mediaItem = media.find((item) => item.id === tile.mediaId || item.publicId === tile.mediaId);
  const mediaOptions = media.map((item) => ({ value: item.id, label: item.alt, imageUrl: item.url }));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Content · Instagram"
        title="Showcase tile"
        description={`Position ${String(tile.order)} · Last saved ${formatDate(tile.updatedAt)}`}
        icon="camera"
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/instagram" className={SECONDARY_BUTTON}>
              Back to showcase
            </Link>
            <FormDialog
              title="Edit showcase tile"
              description="Update the image, caption, destination and public visibility."
              triggerLabel="Edit tile"
            >
              <form action={updateInstagramTileAction} className="grid gap-4">
                <input type="hidden" name="id" value={tile.id} />
                <input type="hidden" name="returnTo" value={`/instagram/${tile.id}`} />
                <InstagramFields tile={tile} mediaOptions={mediaOptions} prefix={`detail-${tile.id}`} />
                <button type="submit" className={PRIMARY_BUTTON}>
                  Save tile
                </button>
              </form>
            </FormDialog>
          </div>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="admin-panel overflow-hidden rounded-lg">
          <div className="relative min-h-80 overflow-hidden bg-sky/20 sm:min-h-[30rem]">
            {mediaItem ? (
              <Image src={mediaItem.url} alt={mediaItem.alt} fill sizes="50rem" className="object-cover" />
            ) : (
              <div className="grid min-h-[30rem] place-items-center text-grey">
                <Icon name="images" className="size-10" />
              </div>
            )}
          </div>
          <div className="p-6">
            <StatusChip tone={tile.published ? "healthy" : "attention"}>
              {tile.published ? "Published" : "Hidden"}
            </StatusChip>
            <p className="mt-4 whitespace-pre-wrap text-pretty text-[1.05rem] leading-8 text-ink">
              {tile.caption}
            </p>
            <a href={tile.href} target="_blank" rel="noreferrer" className={`${SECONDARY_BUTTON} mt-5`}>
              Open Instagram post
            </a>
          </div>
        </article>
        <aside className="space-y-6">
          <Panel>
            <PanelHeader title="Tile details" />
            <dl className="admin-detail-list mt-5">
              <DetailRow label="Image" value={mediaItem?.alt ?? "Linked media is unavailable"} />
              <DetailRow label="Position" value={String(tile.order)} />
              <DetailRow label="Created" value={formatDate(tile.createdAt)} />
              <DetailRow label="Updated" value={formatDate(tile.updatedAt)} />
            </dl>
          </Panel>
          <ConfirmForm action={deleteInstagramTileAction} message="Delete this showcase tile?">
            <input type="hidden" name="id" value={tile.id} />
            <button type="submit" className={`${DANGER_BUTTON} w-full`}>
              Delete tile
            </button>
          </ConfirmForm>
        </aside>
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
  mediaOptions: MediaPickerOption[];
  prefix: string;
}>) {
  return (
    <>
      <MediaPicker
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

function DetailRow({
  label,
  value,
  children,
  capitalize = false,
}: Readonly<{
  label: string;
  value?: string;
  children?: ReactNode;
  capitalize?: boolean;
}>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={capitalize ? "capitalize" : ""}>{children ?? value ?? "—"}</dd>
    </div>
  );
}
