import Link from "next/link";

import { emptyValueFor, getSection, SECTION_SCHEMAS, toFormSpec } from "@kedland/types/content";
import { Field, SelectField, TextareaField } from "@kedland/ui";

import { ConfirmForm } from "./confirm-form";
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

export async function ContentWorkflow({
  selectedPage,
  notice,
  error,
}: Readonly<{ selectedPage?: string | undefined } & FeedbackProps>) {
  let pages: PageSummary[];
  try {
    pages = await apiFetch<PageSummary[]>("/admin/content");
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "Pages could not be loaded."} />
    );
  }

  const current = pages.find((page) => page.page === selectedPage);
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
        <>
          {pages.length === 0 ? (
            <Panel flush className="mt-8 overflow-hidden">
              <EmptyState
                icon="book"
                title="No managed pages are configured"
                body="Page definitions are code-owned. Add a page definition before editors can manage its content here."
              />
            </Panel>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pages.map((page) => (
                <Link
                  key={page.page}
                  href={`/content?page=${encodeURIComponent(page.page)}`}
                  className="admin-panel rounded-lg p-5 transition hover:-translate-y-0.5 hover:border-blue/35"
                >
                  <p className="font-display text-h3 font-bold text-navy">{page.label}</p>
                  <p className="mt-2 text-small text-grey">{page.page}</p>
                  <StatusChip tone={page.sectionCount > 0 ? "healthy" : "attention"}>
                    {String(page.sectionCount)} sections
                  </StatusChip>
                </Link>
              ))}
            </div>
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
                  <form
                    action={updateSectionMediaAction}
                    className="mt-5 grid gap-4 rounded-md border border-blue/15 bg-blue/[0.04] p-4"
                  >
                    <input type="hidden" name="page" value={current.page} />
                    <input type="hidden" name="key" value={section.key} />
                    <input type="hidden" name="field" value={mediaField.field} />
                    <input type="hidden" name="data" value={JSON.stringify(section.data)} />
                    <p className="font-display font-bold text-navy">Public image</p>
                    {mediaOptions.length > 0 ? (
                      <>
                        <SelectField
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
                    <SectionForm
                      page={current.page}
                      sectionKey={section.key}
                      spec={spec}
                      // A section nobody has filled in yet gets a blank shaped
                      // like its schema, so the form has controls to type into.
                      value={Object.keys(section.data).length > 0 ? section.data : emptyValueFor(spec)}
                      mediaOptions={mediaOptions}
                      action={updateSectionAction}
                      submitClassName={PRIMARY_BUTTON}
                    />
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

export async function FaqsWorkflow({ notice, error }: Readonly<FeedbackProps>) {
  let faqs: Faq[];
  try {
    faqs = await apiFetch<Faq[]>("/admin/faqs");
  } catch (caught) {
    return <WorkflowError message={caught instanceof Error ? caught.message : "FAQs could not be loaded."} />;
  }

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Content workspace"
        title="FAQs"
        description="Create, order and publish the answers parents see on the FAQ page."
        action={
          <a href="#new-faq" className={PRIMARY_BUTTON}>
            Add FAQ
          </a>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(21rem,0.7fr)]">
        <section aria-labelledby="faq-list">
          <PanelHeader id="faq-list" title={`Questions (${String(faqs.length)})`} />
          <div className="mt-4 space-y-3">
            {faqs.length === 0 && (
              <Panel flush className="overflow-hidden">
                <EmptyState
                  icon="message"
                  title="No FAQs yet"
                  body="Create the first answer parents should be able to find without contacting the office."
                  action={
                    <a href="#new-faq" className={PRIMARY_BUTTON}>
                      Add first FAQ
                    </a>
                  }
                />
              </Panel>
            )}
            {faqs.map((faq) => (
              <details key={faq.id} className="admin-panel rounded-lg p-5">
                <summary className="cursor-pointer">
                  <span className="font-display font-bold text-navy">{faq.question}</span>
                  <span className="ml-3">
                    <StatusChip tone={faq.published ? "healthy" : "attention"}>
                      {faq.published ? "Published" : "Draft"}
                    </StatusChip>
                  </span>
                </summary>
                <form action={updateFaqAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="id" value={faq.id} />
                  <FaqFields faq={faq} prefix={faq.id} />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={PRIMARY_BUTTON}>
                      Save FAQ
                    </button>
                  </div>
                </form>
                <ConfirmForm action={deleteFaqAction} message={`Delete “${faq.question}”?`} className="mt-3">
                  <input type="hidden" name="id" value={faq.id} />
                  <button type="submit" className={DANGER_BUTTON}>
                    Delete
                  </button>
                </ConfirmForm>
              </details>
            ))}
          </div>
        </section>
        <section id="new-faq" aria-labelledby="new-faq-title">
          <PanelHeader id="new-faq-title" title="New FAQ" />
          <Panel className="mt-4">
            <form action={createFaqAction} className="grid gap-4">
              <FaqFields prefix="new-faq" />
              <button type="submit" className={PRIMARY_BUTTON}>
                Create FAQ
              </button>
            </form>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function FaqFields({ faq, prefix }: Readonly<{ faq?: Faq; prefix: string }>) {
  return (
    <>
      <SelectField
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

export async function InstagramWorkflow({ notice, error }: Readonly<FeedbackProps>) {
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

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Content workspace"
        title="Instagram showcase"
        description="Curate a manual, token-free grid using images already approved in the media library."
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>

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

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(21rem,0.7fr)]">
        <section aria-labelledby="tile-list">
          <PanelHeader id="tile-list" title={`Showcase tiles (${String(tiles.length)})`} />
          <div className="mt-4 space-y-3">
            {tiles.length === 0 && (
              <Panel flush className="overflow-hidden">
                <EmptyState
                  icon="camera"
                  title="No showcase tiles yet"
                  body={
                    media.length > 0
                      ? "Create the first curated tile from an approved media-library image."
                      : "Upload an approved image first, then return here to create the showcase."
                  }
                  action={
                    <a href={media.length > 0 ? "#new-tile" : "/media"} className={SECONDARY_BUTTON}>
                      {media.length > 0 ? "Create first tile" : "Open media library"}
                    </a>
                  }
                />
              </Panel>
            )}
            {tiles.map((tile) => (
              <details key={tile.id} className="admin-panel rounded-lg p-5">
                <summary className="cursor-pointer">
                  <span className="font-display font-bold text-navy">{tile.caption}</span>
                  <span className="ml-3">
                    <StatusChip tone={tile.published ? "healthy" : "attention"}>
                      {tile.published ? "Published" : "Hidden"}
                    </StatusChip>
                  </span>
                </summary>
                <form action={updateInstagramTileAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="id" value={tile.id} />
                  <InstagramFields tile={tile} mediaOptions={mediaOptions} prefix={tile.id} />
                  <button type="submit" className={PRIMARY_BUTTON}>
                    Save tile
                  </button>
                </form>
                <ConfirmForm
                  action={deleteInstagramTileAction}
                  message="Delete this showcase tile?"
                  className="mt-3"
                >
                  <input type="hidden" name="id" value={tile.id} />
                  <button type="submit" className={DANGER_BUTTON}>
                    Delete
                  </button>
                </ConfirmForm>
              </details>
            ))}
          </div>
        </section>
        <section aria-labelledby="new-tile">
          <PanelHeader id="new-tile" title="Add showcase tile" />
          <Panel className="mt-4">
            {media.length > 0 ? (
              <form action={createInstagramTileAction} className="grid gap-4">
                <InstagramFields mediaOptions={mediaOptions} prefix="new-instagram" />
                <button type="submit" className={PRIMARY_BUTTON}>
                  Create tile
                </button>
              </form>
            ) : (
              <EmptyState
                compact
                icon="images"
                title="Media required"
                body="Choose from the approved media library after the first image is uploaded."
                action={
                  <Link href="/media" className={SECONDARY_BUTTON}>
                    Open media library
                  </Link>
                }
              />
            )}
          </Panel>
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
      <SelectField
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
