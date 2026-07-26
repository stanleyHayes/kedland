import Image from "next/image";
import Link from "next/link";

import { Field, Icon, TextareaField } from "@kedland/ui";

import { AdminSelectField } from "./admin-select-field";
import { CollectionToolbar } from "./collection-toolbar";
import { ConfirmForm } from "./confirm-form";
import { FormDialog } from "./form-dialog";
import { ProfilePhotoUploader } from "./profile-photo-uploader";
import { AppearanceSettings, PasswordSettings } from "./settings-controls";
import {
  DANGER_BUTTON,
  Feedback,
  formatDate,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TableHead,
  TableShell,
  Td,
  Th,
  WorkflowError,
} from "./workflow-ui";

import type { Account } from "@/lib/auth";
import type { AuditEntry, Paginated, Role, SiteSettings, StaffAccount } from "@kedland/types";

import {
  assignUserRoleAction,
  createUserAction,
  deleteUserAction,
  inviteUserAction,
  logoutAllSessionsAction,
  updateProfileAction,
  updateSettingsAction,
  updateUserStatusAction,
} from "@/app/(dashboard)/actions";
import { EmptyState, PageHeader, Panel, PanelHeader, StatusChip } from "@/components/ui/primitives";
import { apiFetch } from "@/lib/api";

interface FeedbackProps {
  notice?: string | undefined;
  error?: string | undefined;
}

function auditTone(action: AuditEntry["action"]): "urgent" | "healthy" | "info" {
  if (action === "delete") return "urgent";
  if (action === "create") return "healthy";
  return "info";
}

function accountTone(user: StaffAccount): "attention" | "healthy" | "urgent" {
  if (user.isInvited) return "attention";
  return user.status === "active" ? "healthy" : "urgent";
}

export async function UsersWorkflow({
  q,
  status,
  notice,
  error,
}: Readonly<FeedbackProps & { q?: string | undefined; status?: string | undefined }>) {
  let users: StaffAccount[];
  let roles: Role[];
  try {
    [users, roles] = await Promise.all([
      apiFetch<StaffAccount[]>("/admin/users"),
      apiFetch<Role[]>("/admin/roles"),
    ]);
  } catch (caught) {
    return (
      <WorkflowError
        message={caught instanceof Error ? caught.message : "Staff accounts could not be loaded."}
      />
    );
  }

  const roleOptions = roles.map((role) => ({ value: role.slug, label: role.name }));
  const normalized = q?.trim().toLocaleLowerCase();
  const visibleUsers = users.filter((user) => {
    const matchesText =
      !normalized ||
      `${user.displayName} ${user.email} ${user.roleSlug}`.toLocaleLowerCase().includes(normalized);
    const matchesStatus =
      !status || (status === "invited" ? user.isInvited : !user.isInvited && user.status === status);
    return matchesText && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Account workspace"
        title="Staff accounts"
        description="Create the small set of trusted accounts and keep their role and status explicit."
        action={
          <div className="flex flex-wrap gap-2">
            <FormDialog
              title="Invite a staff member"
              description="They will receive a secure link and choose their own password. This is the recommended way to add staff."
              triggerLabel="Invite by email"
              triggerIcon="mail"
            >
              <form action={inviteUserAction} className="grid gap-4">
                <Field id="invite-user-name" name="displayName" label="Display name" required />
                <Field id="invite-user-email" name="email" type="email" label="Email address" required />
                <AdminSelectField
                  id="invite-user-role"
                  name="roleSlug"
                  label="Role"
                  required
                  options={roleOptions}
                  defaultValue="editor"
                />
                <p className="text-small text-grey">
                  The selected role is applied immediately. The account becomes usable after the invitation
                  link is completed.
                </p>
                <button type="submit" className={PRIMARY_BUTTON}>
                  Send invitation
                </button>
              </form>
            </FormDialog>
            <FormDialog
              title="Create staff account with a temporary password"
              description="Use this fallback only when email invitations are unavailable."
              triggerLabel="Create with password"
              triggerClassName={SECONDARY_BUTTON}
            >
              <form action={createUserAction} className="grid gap-4">
                <Field id="new-user-name" name="displayName" label="Display name" required />
                <Field id="new-user-email" name="email" type="email" label="Email address" required />
                <Field
                  id="new-user-password"
                  name="password"
                  type="password"
                  label="Temporary password"
                  minLength={12}
                  required
                  hint="At least 12 characters. Share it securely and ask the person to change it."
                />
                <AdminSelectField
                  id="new-user-role"
                  name="roleSlug"
                  label="Role"
                  required
                  options={roleOptions}
                  defaultValue="editor"
                />
                <button type="submit" className={PRIMARY_BUTTON}>
                  Create account
                </button>
              </form>
            </FormDialog>
          </div>
        }
      />
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <CollectionToolbar
        action="/users"
        query={q}
        placeholder="Search staff names, email or roles"
        filters={[
          {
            name: "status",
            label: "Status",
            value: status,
            options: [
              { value: "", label: "All accounts" },
              { value: "active", label: "Active" },
              { value: "invited", label: "Invited" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
      />

      <section aria-labelledby="staff-list" className="mt-8">
        <PanelHeader id="staff-list" title={`Accounts (${String(visibleUsers.length)})`} />
        <Panel flush className="mt-4 overflow-hidden">
          {visibleUsers.length === 0 ? (
            <EmptyState
              icon={q || status ? "search" : "user"}
              title={q || status ? "No matching staff accounts" : "No staff accounts yet"}
              body={
                q || status
                  ? "Try a broader search or clear the status filter."
                  : "Create the first trusted staff account and assign only the access they need."
              }
              action={
                q || status ? (
                  <Link href="/users" className={SECONDARY_BUTTON}>
                    Clear filters
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <TableShell label="Staff accounts">
              <TableHead>
                <Th>Staff member</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last sign-in</Th>
                <Th align="right">Actions</Th>
              </TableHead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id}>
                    <Td>
                      <p className="font-display font-bold text-navy">{user.displayName}</p>
                      <p className="mt-0.5 text-grey">{user.email}</p>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{user.roleSlug}</span>
                        <FormDialog
                          title={`Change role · ${user.displayName}`}
                          triggerLabel="Change"
                          triggerIcon="shield"
                          triggerClassName={SECONDARY_BUTTON}
                          size="md"
                        >
                          <form action={assignUserRoleAction} className="grid gap-4">
                            <input type="hidden" name="id" value={user.id} />
                            <AdminSelectField
                              id={`${user.id}-role`}
                              name="roleSlug"
                              label="Assigned role"
                              required
                              options={roleOptions}
                              defaultValue={user.roleSlug}
                            />
                            <button type="submit" className={PRIMARY_BUTTON}>
                              Save role
                            </button>
                          </form>
                        </FormDialog>
                      </div>
                    </Td>
                    <Td>
                      <StatusChip tone={accountTone(user)}>
                        {user.isInvited ? "invited" : user.status}
                      </StatusChip>
                    </Td>
                    <Td className="whitespace-nowrap text-grey">{formatDate(user.lastLoginAt)}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <form action={updateUserStatusAction}>
                          <input type="hidden" name="id" value={user.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={user.status === "active" ? "suspended" : "active"}
                          />
                          <button type="submit" className={SECONDARY_BUTTON}>
                            {user.status === "active" ? "Suspend" : "Restore"}
                          </button>
                        </form>
                        <ConfirmForm
                          action={deleteUserAction}
                          message={`Remove ${user.displayName}'s account?`}
                        >
                          <input type="hidden" name="id" value={user.id} />
                          <button type="submit" className={DANGER_BUTTON}>
                            Remove
                          </button>
                        </ConfirmForm>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Panel>
      </section>
    </div>
  );
}

export async function AuditWorkflow({
  page = 1,
  q,
  action,
}: Readonly<{
  page?: number | undefined;
  q?: string | undefined;
  action?: string | undefined;
}>) {
  let audit: Paginated<AuditEntry>;
  try {
    audit = await apiFetch<Paginated<AuditEntry>>(`/admin/audit?page=${String(page)}`);
  } catch (caught) {
    return (
      <WorkflowError
        message={caught instanceof Error ? caught.message : "Audit events could not be loaded."}
      />
    );
  }
  const normalized = q?.trim().toLocaleLowerCase();
  const visibleEntries = audit.items.filter((entry) => {
    const matchesText =
      !normalized ||
      `${entry.actorEmail ?? ""} ${entry.entityType} ${entry.entityId ?? ""}`
        .toLocaleLowerCase()
        .includes(normalized);
    return matchesText && (!action || entry.action === action);
  });
  const auditHref = (targetPage: number): string => {
    const query = new URLSearchParams();
    if (targetPage > 1) query.set("page", String(targetPage));
    if (q) query.set("q", q);
    if (action) query.set("action", action);
    return query.size > 0 ? `/audit?${query.toString()}` : "/audit";
  };

  return (
    <div className="mx-auto max-w-[92rem]">
      <PageHeader
        eyebrow="Account workspace"
        title="Audit log"
        description="Append-only evidence of important staff, content and security actions."
        action={<StatusChip tone="neutral">{String(audit.total)} events</StatusChip>}
      />
      <CollectionToolbar
        action="/audit"
        query={q}
        placeholder="Search actors, entities and record IDs"
        filters={[
          {
            name: "action",
            label: "Action",
            value: action,
            options: [
              { value: "", label: "All actions" },
              { value: "create", label: "Created" },
              { value: "update", label: "Updated" },
              { value: "delete", label: "Deleted" },
              { value: "login", label: "Sign-ins" },
            ],
          },
        ]}
      />
      <Panel flush className="mt-8 overflow-hidden">
        {visibleEntries.length === 0 ? (
          <EmptyState
            icon={q || action ? "search" : "shield"}
            title={q || action ? "No matching audit events" : "No audit events yet"}
            body={
              q || action
                ? "Try a broader search or clear the action filter."
                : "Important account, content and security changes will be recorded here automatically."
            }
            action={
              q || action ? (
                <Link href="/audit" className={SECONDARY_BUTTON}>
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        ) : (
          <TableShell label="Audit events">
            <TableHead>
              <Th>When</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
              <Th>Changes</Th>
            </TableHead>
            <tbody>
              {visibleEntries.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap text-grey">{formatDate(entry.createdAt)}</Td>
                  <Td>{entry.actorEmail ?? "System"}</Td>
                  <Td>
                    <StatusChip tone={auditTone(entry.action)}>{entry.action}</StatusChip>
                  </Td>
                  <Td>
                    <span className="font-bold text-navy">{entry.entityType}</span>
                    <span className="block max-w-56 truncate text-grey">{entry.entityId ?? "—"}</span>
                  </Td>
                  <Td>
                    <pre className="max-w-md overflow-auto whitespace-pre-wrap text-[0.72rem] text-grey">
                      {entry.changes ? JSON.stringify(entry.changes, null, 2) : "—"}
                    </pre>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
      <div className="mt-5 flex justify-between">
        {audit.page > 1 ? (
          <Link href={auditHref(audit.page - 1)} className={SECONDARY_BUTTON}>
            Previous
          </Link>
        ) : (
          <span />
        )}
        {audit.page < audit.totalPages && (
          <Link href={auditHref(audit.page + 1)} className={SECONDARY_BUTTON}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

type SettingsTab = "profile" | "security" | "appearance" | "website";

interface SettingsWorkflowProps extends FeedbackProps {
  user: Account;
  tab?: string | undefined;
}

function settingsTab(tab: string | undefined, user: Account): SettingsTab {
  if (tab === "security" || tab === "appearance" || tab === "profile") return tab;
  if (tab === "website" && user.role === "admin") return "website";
  return "profile";
}

const SETTINGS_TABS: readonly { value: SettingsTab; label: string; icon: string }[] = [
  { value: "profile", label: "Profile", icon: "user" },
  { value: "security", label: "Security", icon: "shield" },
  { value: "appearance", label: "Appearance", icon: "palette" },
  { value: "website", label: "Website", icon: "globe" },
];

export async function SettingsWorkflow({ user, tab, notice, error }: Readonly<SettingsWorkflowProps>) {
  const active = settingsTab(tab, user);
  let settings: SiteSettings | null = null;

  if (active === "website") {
    try {
      settings = await apiFetch<SiteSettings>("/admin/settings");
    } catch (caught) {
      return (
        <WorkflowError message={caught instanceof Error ? caught.message : "Settings could not be loaded."} />
      );
    }
  }

  return (
    <div className="mx-auto max-w-[88rem]">
      <PageHeader
        eyebrow="Account workspace"
        title="Settings"
        description="Manage your profile, account security, appearance and public website defaults."
        action={
          active === "website" && settings ? (
            <StatusChip tone="info">Updated {formatDate(settings.updatedAt)}</StatusChip>
          ) : undefined
        }
      />
      <nav
        aria-label="Settings sections"
        className="admin-settings-tabs mt-7 flex gap-1 overflow-x-auto rounded-lg p-1.5"
      >
        {SETTINGS_TABS.filter((item) => item.value !== "website" || user.role === "admin").map((item) => (
          <Link
            key={item.value}
            href={`/settings?tab=${item.value}`}
            aria-current={active === item.value ? "page" : undefined}
            className={`admin-settings-tab flex min-h-11 shrink-0 items-center gap-2 rounded-md px-4 font-display text-small font-bold ${
              active === item.value ? "admin-settings-tab-active" : ""
            }`}
          >
            <Icon name={item.icon} className="size-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">
        <Feedback notice={notice} error={error} />
      </div>
      <div className="mt-7">
        {active === "profile" && <ProfileSettings user={user} />}
        {active === "security" && <SecuritySettings />}
        {active === "appearance" && <AppearanceSettings />}
        {active === "website" && settings && <WebsiteSettingsCard settings={settings} />}
      </div>
    </div>
  );
}

function ProfileSettings({ user }: Readonly<{ user: Account }>) {
  return (
    <div className="grid gap-6">
      <Panel className="overflow-hidden p-0">
        <div className="bg-navy-deep px-6 py-7 text-white">
          <span className="admin-profile-avatar grid size-16 place-items-center overflow-hidden rounded-lg font-display text-xl font-extrabold">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={128}
                height={128}
                className="size-full object-cover"
              />
            ) : (
              user.displayName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")
            )}
          </span>
          <h2 className="mt-5 text-white">{user.displayName}</h2>
          <p className="mt-1 text-small text-sky">{user.email}</p>
        </div>
        <dl className="grid gap-4 p-6 text-small sm:grid-cols-2 xl:grid-cols-1">
          <div>
            <dt className="font-bold uppercase tracking-[0.08em] text-grey">Role</dt>
            <dd className="mt-1 capitalize text-ink">{user.role}</dd>
          </div>
          <div>
            <dt className="font-bold uppercase tracking-[0.08em] text-grey">Last sign-in</dt>
            <dd className="mt-1 text-ink">{formatDate(user.lastLoginAt)}</dd>
          </div>
        </dl>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="admin-settings-icon grid size-11 place-items-center rounded-md text-blue">
              <Icon name="user" className="size-5" />
            </span>
            <div>
              <h2 className="text-h3">Profile details</h2>
              <p className="mt-0.5 text-small text-grey">
                Keep the name shown in the staff workspace current.
              </p>
            </div>
          </div>
          <FormDialog
            title="Edit profile details"
            description="Update the display name used throughout the staff workspace."
            triggerLabel="Edit profile"
            triggerIcon="user"
            size="md"
          >
            <form action={updateProfileAction} className="grid gap-5">
              <Field
                id="profile-display-name"
                name="displayName"
                label="Display name"
                minLength={2}
                maxLength={100}
                required
                defaultValue={user.displayName}
                className="admin-neu-field"
              />
              <Field
                id="profile-email"
                name="email"
                type="email"
                label="Email address"
                value={user.email}
                disabled
                required
                hint="Ask another administrator if this sign-in address must change."
                className="admin-neu-field"
              />
              <div className="flex justify-end">
                <button type="submit" className={PRIMARY_BUTTON}>
                  Save profile
                </button>
              </div>
            </form>
          </FormDialog>
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-h3">Profile photograph</h2>
            <p className="mt-1 text-small text-grey">
              Keep your workspace identity recognisable to colleagues.
            </p>
          </div>
          <FormDialog
            title="Update profile photograph"
            description="Upload a clear portrait for your dashboard account."
            triggerLabel={user.avatarUrl ? "Change photograph" : "Add photograph"}
            triggerIcon="images"
            size="md"
          >
            <ProfilePhotoUploader currentUrl={user.avatarUrl} displayName={user.displayName} />
          </FormDialog>
        </div>
      </Panel>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <span className="admin-settings-icon grid size-11 place-items-center rounded-md text-blue">
              <Icon name="shield" className="size-5" />
            </span>
            <div>
              <h2 className="text-h3">Change password</h2>
              <p className="mt-0.5 text-small text-grey">Changing it signs out every active device.</p>
            </div>
          </div>
          <FormDialog
            title="Change password"
            description="Confirm the current password, then choose a new password with at least 12 characters."
            triggerLabel="Change password"
            triggerIcon="shield"
            size="lg"
          >
            <PasswordSettings embedded />
          </FormDialog>
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <span className="admin-settings-icon grid size-11 shrink-0 place-items-center rounded-md text-blue">
              <Icon name="shield" className="size-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-h3">Two-factor authentication</h2>
                <StatusChip tone="neutral">Not configured</StatusChip>
              </div>
              <p className="mt-1 max-w-3xl text-small text-grey">
                Authenticator-app verification is not enabled in this deployment. Password security and
                session revocation remain active.
              </p>
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-3">
            <span className="admin-account-signout-icon grid size-11 shrink-0 place-items-center rounded-md text-red-text">
              <Icon name="user" className="size-5" />
            </span>
            <div>
              <h2 className="text-h3">Sign out every device</h2>
              <p className="mt-1 max-w-2xl text-small text-grey">
                Revoke every active Kedland dashboard session, including this one.
              </p>
            </div>
          </div>
          <form action={logoutAllSessionsAction}>
            <button type="submit" className={DANGER_BUTTON}>
              Sign out all
            </button>
          </form>
        </div>
      </Panel>
    </div>
  );
}

function WebsiteSettingsCard({ settings }: Readonly<{ settings: SiteSettings }>) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3">
          <span className="admin-settings-icon grid size-11 place-items-center rounded-md text-blue">
            <Icon name="globe" className="size-5" />
          </span>
          <div>
            <h2 className="text-h3">Website configuration</h2>
            <p className="mt-0.5 max-w-2xl text-small text-grey">
              Contact details, admissions links, search defaults and the announcement banner.
            </p>
          </div>
        </div>
        <FormDialog
          title="Edit website configuration"
          description="Changes affect the public website after the dashboard refreshes its content cache."
          triggerLabel="Edit website settings"
          triggerIcon="globe"
          size="wide"
        >
          <WebsiteSettingsForm settings={settings} />
        </FormDialog>
      </div>
    </Panel>
  );
}

function WebsiteSettingsForm({ settings }: Readonly<{ settings: SiteSettings }>) {
  return (
    <form action={updateSettingsAction} className="grid gap-6">
      <Panel>
        <PanelHeader title="Contact and school hours" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <TextareaField
            id="settings-phones"
            name="phones"
            label="Phone numbers"
            rows={4}
            defaultValue={settings.contact.phones.join("\n")}
            hint="One number per line."
          />
          <TextareaField
            id="settings-hours"
            name="hours"
            label="School hours"
            rows={4}
            defaultValue={settings.hours}
          />
          <Field
            id="settings-email"
            name="email"
            type="email"
            label="School email"
            defaultValue={settings.contact.email}
          />
          <Field
            id="settings-gps"
            name="gpsCode"
            label="GhanaPost GPS"
            defaultValue={settings.contact.gpsCode}
          />
          <TextareaField
            id="settings-address"
            name="address"
            label="Address"
            rows={3}
            defaultValue={settings.contact.address}
          />
          <Field
            id="settings-map"
            name="mapEmbed"
            type="url"
            label="Map URL"
            defaultValue={settings.contact.mapEmbed}
          />
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="Admissions and social" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            id="settings-instagram"
            name="instagram"
            type="url"
            label="Instagram URL"
            defaultValue={settings.socials.instagram}
          />
          <Field
            id="settings-form"
            name="admissionFormUrl"
            type="url"
            label="Admission form URL"
            defaultValue={settings.admissionFormUrl}
          />
          <TextareaField
            id="settings-footer"
            name="footerNote"
            label="Footer note"
            rows={3}
            defaultValue={settings.footerNote}
          />
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="SEO defaults" />
        <div className="mt-5 grid gap-4">
          <Field
            id="settings-title-template"
            name="titleTemplate"
            label="Title template"
            required
            defaultValue={settings.seoDefaults.titleTemplate}
          />
          <TextareaField
            id="settings-seo-description"
            name="seoDescription"
            label="Default description"
            rows={3}
            required
            defaultValue={settings.seoDefaults.description}
          />
          <Field
            id="settings-og-image"
            name="ogImageId"
            label="Default social image ID"
            defaultValue={settings.seoDefaults.ogImageId}
          />
        </div>
      </Panel>
      <Panel>
        <PanelHeader title="Announcement banner" />
        <div className="mt-5 grid gap-4">
          <label className="flex items-center gap-2 font-semibold text-navy">
            <input
              type="checkbox"
              name="announcementEnabled"
              defaultChecked={settings.announcementBanner.enabled}
              className="admin-checkbox size-4 accent-navy"
            />
            Show announcement
          </label>
          <Field
            id="settings-announcement-message"
            name="announcementMessage"
            label="Message"
            defaultValue={settings.announcementBanner.message}
          />
          <Field
            id="settings-announcement-href"
            name="announcementHref"
            type="url"
            label="Optional link"
            defaultValue={settings.announcementBanner.href}
          />
        </div>
      </Panel>
      <div className="flex justify-end">
        <button type="submit" className={PRIMARY_BUTTON}>
          Save website settings
        </button>
      </div>
    </form>
  );
}

export function HelpWorkflow() {
  const guides = [
    {
      title: "Publish a school story",
      body: "Create a draft in Posts, complete the article and SEO fields, then publish from the editor.",
      href: "/posts",
    },
    {
      title: "Update public page copy",
      body: "Choose a page, edit one section's validated JSON and save. The public cache is refreshed automatically.",
      href: "/content",
    },
    {
      title: "Handle a parent enquiry",
      body: "Read the message, contact the parent, then move the record through read, replied or archived.",
      href: "/enquiries",
    },
    {
      title: "Use pupil photographs safely",
      body: "Mark pupil images, record whether written consent exists and add the consent reference before public use.",
      href: "/media",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Account workspace"
        title="Help & guide"
        description="Short, task-based guidance for the workflows available in this console."
      />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {guides.map((guide) => (
          <Panel key={guide.title}>
            <h2 className="text-h3">{guide.title}</h2>
            <p className="mt-2 text-small leading-relaxed text-grey">{guide.body}</p>
            <Link href={guide.href} className="mt-4 inline-block font-bold text-blue hover:underline">
              Open workspace →
            </Link>
          </Panel>
        ))}
      </div>
      <Panel className="mt-6">
        <PanelHeader title="When something fails" />
        <ul className="mt-4 list-disc space-y-2 pl-5 text-small text-grey">
          <li>Do not treat unavailable data as zero; retry after checking the API health.</li>
          <li>Unpublish a post instead of deleting it when the change may need to be reversed.</li>
          <li>Use enquiry deletion only for an explicit data-protection request.</li>
          <li>Ask an administrator before changing roles, settings or consent records you cannot verify.</li>
        </ul>
      </Panel>
    </div>
  );
}
