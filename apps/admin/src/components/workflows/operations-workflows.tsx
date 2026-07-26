import Image from "next/image";
import Link from "next/link";

import { Field, Icon, TextareaField } from "@kedland/ui";

import { AdminSelectField } from "./admin-select-field";
import { CollectionToolbar } from "./collection-toolbar";
import { ConfirmForm } from "./confirm-form";
import { FormDialog } from "./form-dialog";
import { MediaUploader } from "./media-uploader";
import {
  DANGER_BUTTON,
  Feedback,
  formatDate,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  WorkflowError,
} from "./workflow-ui";

import type { Enquiry, EnquiryStatus, MediaItem, Paginated } from "@kedland/types";

import {
  deleteEnquiryAction,
  deleteMediaAction,
  updateEnquiryStatusAction,
  updateMediaAction,
} from "@/app/(dashboard)/actions";
import {
  EmptyState,
  PageHeader,
  Pagination,
  Panel,
  PanelHeader,
  StatusChip,
} from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";

interface FeedbackProps {
  notice?: string | undefined;
  error?: string | undefined;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function MediaWorkflow({
  q,
  consent,
  notice,
  error,
}: Readonly<FeedbackProps & { q?: string | undefined; consent?: string | undefined }>) {
  let media: MediaItem[];
  try {
    media = await apiFetch<MediaItem[]>("/admin/media");
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "Media could not be loaded."} />
    );
  }

  const consentGaps = media.filter((item) => item.depictsPupils && !item.consentOnFile).length;
  const normalized = q?.trim().toLocaleLowerCase();
  const filteredMedia = media.filter((item) => {
    const matchesText = !normalized || item.alt.toLocaleLowerCase().includes(normalized);
    const matchesConsent =
      !consent ||
      (consent === "gaps" && item.depictsPupils && !item.consentOnFile) ||
      (consent === "pupils" && item.depictsPupils) ||
      (consent === "clear" && (!item.depictsPupils || item.consentOnFile));
    return matchesText && matchesConsent;
  });

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Content workspace"
        title="Media library"
        description="Upload reusable images, maintain alt text and keep pupil-consent evidence visible."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone={consentGaps > 0 ? "urgent" : "healthy"}>
              {String(consentGaps)} consent gaps
            </StatusChip>
            <FormDialog
              title="Upload image"
              description="Add approved media with useful alt text and explicit pupil-consent evidence."
              triggerLabel="Upload image"
              triggerIcon="images"
            >
              <MediaUploader />
            </FormDialog>
          </div>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <CollectionToolbar
        action="/media"
        query={q}
        placeholder="Search image descriptions"
        filters={[
          {
            name: "consent",
            label: "Consent",
            value: consent,
            options: [
              { value: "", label: "All media" },
              { value: "gaps", label: "Consent gaps" },
              { value: "pupils", label: "Depicts pupils" },
              { value: "clear", label: "Consent clear" },
            ],
          },
        ]}
      />

      <div className="mt-8">
        <section aria-labelledby="media-list">
          <PanelHeader id="media-list" title={`Library (${String(filteredMedia.length)})`} />
          {filteredMedia.length === 0 ? (
            <Panel flush className="mt-4 overflow-hidden">
              <EmptyState
                icon={q || consent ? "search" : "images"}
                title={q || consent ? "No matching media" : "The media library is empty"}
                body={
                  q || consent
                    ? "Try a broader description or clear the consent filter."
                    : "Upload an approved image with useful alt text and its consent details."
                }
                action={
                  q || consent ? (
                    <Link href="/media" className={SECONDARY_BUTTON}>
                      Clear filters
                    </Link>
                  ) : undefined
                }
              />
            </Panel>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredMedia.map((item) => (
                <article
                  key={item.id}
                  className="admin-media-record admin-panel group overflow-hidden rounded-lg"
                >
                  <div className="relative min-h-44 overflow-hidden bg-sky/20 sm:min-h-full">
                    <Image
                      src={item.url}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 1280px) 13rem, (min-width: 640px) 10rem, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="min-w-0 p-5">
                    <p className="max-w-3xl text-pretty font-display text-[1.05rem] font-bold leading-snug text-navy">
                      {item.alt}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-grey">
                      <span>
                        {item.width} × {item.height}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.format.toUpperCase()}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatBytes(item.bytes)}</span>
                      <span aria-hidden="true">·</span>
                      <span>Added {formatDate(item.createdAt)}</span>
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusChip tone={item.depictsPupils ? "attention" : "neutral"}>
                        {item.depictsPupils ? "Pupils shown" : "No pupils marked"}
                      </StatusChip>
                      {item.depictsPupils && (
                        <StatusChip tone={item.consentOnFile ? "healthy" : "urgent"}>
                          {item.consentOnFile ? "Consent on file" : "Consent missing"}
                        </StatusChip>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <FormDialog
                        title="Edit media details"
                        description="Maintain alt text and the consent record attached to this image."
                        triggerLabel="Edit metadata"
                        triggerIcon="images"
                        triggerClassName={SECONDARY_BUTTON}
                      >
                        <form action={updateMediaAction} className="grid gap-4">
                          <input type="hidden" name="id" value={item.id} />
                          <TextareaField
                            id={`${item.id}-alt`}
                            name="alt"
                            label="Alt text"
                            rows={3}
                            required
                            defaultValue={item.alt}
                          />
                          <div className="admin-consent-grid">
                            <label className="flex items-start gap-3 font-semibold text-navy">
                              <input
                                type="checkbox"
                                name="depictsPupils"
                                defaultChecked={item.depictsPupils}
                                className="admin-checkbox size-4 accent-navy"
                              />
                              Depicts identifiable pupils
                            </label>
                            <label className="flex items-start gap-3 font-semibold text-navy">
                              <input
                                type="checkbox"
                                name="consentOnFile"
                                defaultChecked={item.consentOnFile}
                                className="admin-checkbox size-4 accent-navy"
                              />
                              Written consent on file
                            </label>
                          </div>
                          <Field
                            id={`${item.id}-consent-ref`}
                            name="consentRef"
                            label="Consent reference"
                            defaultValue={item.consentRef ?? ""}
                          />
                          <button type="submit" className={PRIMARY_BUTTON}>
                            Save metadata
                          </button>
                        </form>
                      </FormDialog>
                      <ConfirmForm
                        action={deleteMediaAction}
                        message="Remove this media record? The Cloudinary file will remain."
                      >
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className={DANGER_BUTTON}>
                          Remove record
                        </button>
                      </ConfirmForm>
                    </div>
                  </div>
                  <div className="admin-media-record-mark hidden items-center justify-center border-l border-sky/45 px-5 xl:flex">
                    <Icon name="images" className="size-6" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

const FILTERS: { value: "" | EnquiryStatus; label: string }[] = [
  { value: "", label: "All" },
  ...STATUS_OPTIONS.map((option) => ({ value: option.value as EnquiryStatus, label: option.label })),
];

export async function EnquiriesWorkflow({
  page = 1,
  status,
  q,
  notice,
  error,
}: Readonly<
  { page?: number | undefined; status?: string | undefined; q?: string | undefined } & FeedbackProps
>) {
  const selected = STATUS_OPTIONS.some((option) => option.value === status) ? status : undefined;
  let enquiries: Paginated<Enquiry>;
  try {
    const params = new URLSearchParams({ page: String(page) });
    if (selected) params.set("status", selected);
    enquiries = await apiFetch<Paginated<Enquiry>>(`/admin/enquiries?${params.toString()}`);
  } catch (caught) {
    return (
      <WorkflowError message={caught instanceof Error ? caught.message : "Enquiries could not be loaded."} />
    );
  }
  const normalized = q?.trim().toLocaleLowerCase();
  const filteredEnquiries = normalized
    ? enquiries.items.filter((enquiry) =>
        [
          enquiry.parentName,
          enquiry.email,
          enquiry.phone,
          enquiry.message,
          enquiry.topic,
          enquiry.level,
        ].some((value) => value.toLocaleLowerCase().includes(normalized)),
      )
    : enquiries.items;
  let emptyEnquiryTitle = "The inbox is clear";
  let emptyEnquiryBody = "New parent messages will appear here with their delivery and follow-up status.";
  if (selected) {
    emptyEnquiryTitle = `No ${selected} enquiries`;
    emptyEnquiryBody =
      "There are no parent enquiries in this status. Try another filter or return to the full inbox.";
  }
  if (q) {
    emptyEnquiryTitle = "No matching enquiries";
    emptyEnquiryBody = "Try a broader search or clear the filters to return to the full inbox.";
  }
  const enquiryHref = (target: number): string => {
    const params = new URLSearchParams();
    if (target > 1) params.set("page", String(target));
    if (selected) params.set("status", selected);
    if (q) params.set("q", q);
    return params.size ? `/enquiries?${params.toString()}` : "/enquiries";
  };

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Enquiries workspace"
        title="Inbox"
        description="Read parent messages, track follow-up and surface enquiries that were not emailed."
        action={<StatusChip tone="info">{String(enquiries.total)} enquiries</StatusChip>}
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <CollectionToolbar
        action="/enquiries"
        query={q}
        placeholder="Search names, email, phone or message"
        filters={[
          {
            name: "status",
            label: "Status",
            value: selected,
            options: FILTERS,
          },
        ]}
      />

      <div className="mt-6 space-y-4">
        {filteredEnquiries.length === 0 && (
          <Panel flush className="overflow-hidden">
            <EmptyState
              icon="message"
              title={emptyEnquiryTitle}
              body={emptyEnquiryBody}
              action={
                selected || q ? (
                  <Link href="/enquiries" className={SECONDARY_BUTTON}>
                    View all enquiries
                  </Link>
                ) : undefined
              }
            />
          </Panel>
        )}
        {filteredEnquiries.map((enquiry) => (
          <article key={enquiry.id} className="admin-panel rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-h3 font-bold text-navy">{enquiry.parentName}</p>
                <p className="mt-1 text-small text-grey">
                  <a href={`mailto:${enquiry.email}`} className="text-blue hover:underline">
                    {enquiry.email}
                  </a>
                  {" · "}
                  <a href={`tel:${enquiry.phone}`} className="text-blue hover:underline">
                    {enquiry.phone}
                  </a>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusChip tone={enquiry.status === "new" ? "attention" : "neutral"}>
                  {enquiry.status}
                </StatusChip>
                <StatusChip tone={enquiry.notified ? "healthy" : "urgent"}>
                  {enquiry.notified ? "Email delivered" : "Not emailed"}
                </StatusChip>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 text-small sm:grid-cols-3">
              <div>
                <dt className="font-bold text-grey">Topic</dt>
                <dd className="mt-1 capitalize text-ink">{enquiry.topic.replaceAll("-", " ")}</dd>
              </div>
              <div>
                <dt className="font-bold text-grey">Level</dt>
                <dd className="mt-1 capitalize text-ink">{enquiry.level.replaceAll("-", " ")}</dd>
              </div>
              <div>
                <dt className="font-bold text-grey">Received</dt>
                <dd className="mt-1 text-ink">{formatDate(enquiry.createdAt)}</dd>
              </div>
            </dl>
            <p className="mt-4 whitespace-pre-wrap rounded-md border border-sky/50 bg-white/45 p-4 leading-relaxed text-ink">
              {enquiry.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <FormDialog
                title={`Update enquiry · ${enquiry.parentName}`}
                description="Change the office follow-up status after reviewing this message."
                triggerLabel="Update status"
                triggerIcon="message"
                triggerClassName={SECONDARY_BUTTON}
              >
                <form action={updateEnquiryStatusAction} className="grid gap-4">
                  <input type="hidden" name="id" value={enquiry.id} />
                  <AdminSelectField
                    id={`${enquiry.id}-status`}
                    name="status"
                    label="Triage status"
                    required
                    options={STATUS_OPTIONS}
                    defaultValue={enquiry.status}
                  />
                  <button type="submit" className={PRIMARY_BUTTON}>
                    Update status
                  </button>
                </form>
              </FormDialog>
              <ConfirmForm
                action={deleteEnquiryAction}
                message={`Permanently erase the enquiry from ${enquiry.parentName}? Use this only for a data-protection request.`}
              >
                <input type="hidden" name="id" value={enquiry.id} />
                <button type="submit" className={DANGER_BUTTON}>
                  Erase
                </button>
              </ConfirmForm>
            </div>
          </article>
        ))}
      </div>
      <Pagination page={enquiries.page} totalPages={enquiries.totalPages} href={enquiryHref} />
    </div>
  );
}
