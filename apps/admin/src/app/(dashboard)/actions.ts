"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { MediaRegister, UploadSignature } from "@kedland/types";

import { apiFetch } from "@/lib/api";
import { clearSession } from "@/lib/session";

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function number(formData: FormData, key: string): number {
  const value = Number.parseInt(text(formData, key), 10);
  return Number.isFinite(value) ? value : 0;
}

function destination(formData: FormData, fallback: string): string {
  const requested = text(formData, "returnTo");
  return requested.startsWith("/") && !requested.startsWith("//") ? requested : fallback;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "The request could not be completed.";
}

async function mutate(path: string, success: string, operation: () => Promise<unknown>): Promise<never> {
  let error: string | null = null;
  try {
    await operation();
  } catch (caught) {
    error = messageOf(caught);
  }

  revalidatePath(path.split("?")[0] ?? path);
  const query = new URLSearchParams(error ? { error } : { notice: success });
  redirect(`${path}${path.includes("?") ? "&" : "?"}${query.toString()}`);
}

export async function createPostAction(formData: FormData): Promise<never> {
  return mutate("/posts", "Draft created.", () =>
    apiFetch("/admin/posts", {
      method: "POST",
      body: {
        title: text(formData, "title"),
        slug: text(formData, "slug") || undefined,
        category: text(formData, "category"),
        excerpt: text(formData, "excerpt"),
        body: text(formData, "body"),
        seoTitle: text(formData, "seoTitle") || undefined,
        seoDescription: text(formData, "seoDescription") || undefined,
      },
    }),
  );
}

export async function updatePostAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/posts"), "Post saved.", () =>
    apiFetch(`/admin/posts/${id}`, {
      method: "PATCH",
      body: {
        title: text(formData, "title"),
        slug: text(formData, "slug"),
        category: text(formData, "category"),
        excerpt: text(formData, "excerpt"),
        body: text(formData, "body"),
        seoTitle: text(formData, "seoTitle"),
        seoDescription: text(formData, "seoDescription"),
      },
    }),
  );
}

export async function setPostPublicationAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  const operation = text(formData, "operation") === "publish" ? "publish" : "unpublish";
  return mutate(
    destination(formData, "/posts"),
    operation === "publish" ? "Post published." : "Post returned to draft.",
    () => apiFetch(`/admin/posts/${id}/${operation}`, { method: "POST" }),
  );
}

export async function deletePostAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate("/posts", "Post deleted.", () => apiFetch(`/admin/posts/${id}`, { method: "DELETE" }));
}

export async function updateSectionAction(formData: FormData): Promise<never> {
  const page = text(formData, "page");
  const key = text(formData, "key");
  return mutate(`/content?page=${encodeURIComponent(page)}`, `${key} saved.`, async () => {
    const data = JSON.parse(text(formData, "data")) as Record<string, unknown>;
    await apiFetch(`/admin/content/sections/${encodeURIComponent(key)}?page=${encodeURIComponent(page)}`, {
      method: "PATCH",
      body: { data },
    });
  });
}

export async function updateSectionMediaAction(formData: FormData): Promise<never> {
  const page = text(formData, "page");
  const key = text(formData, "key");
  const field = text(formData, "field");

  return mutate(`/content?page=${encodeURIComponent(page)}`, `${key} image saved.`, async () => {
    if (field !== "image" && field !== "portrait") {
      throw new Error("This section does not expose an editable image.");
    }

    const data = JSON.parse(text(formData, "data")) as Record<string, unknown>;
    const current =
      data[field] && typeof data[field] === "object" ? (data[field] as Record<string, unknown>) : {};

    data[field] = {
      ...current,
      mediaId: text(formData, "mediaId"),
      alt: text(formData, "alt"),
    };

    await apiFetch(`/admin/content/sections/${encodeURIComponent(key)}?page=${encodeURIComponent(page)}`, {
      method: "PATCH",
      body: { data },
    });
  });
}

export async function createFaqAction(formData: FormData): Promise<never> {
  return mutate("/faqs", "FAQ created.", () =>
    apiFetch("/admin/faqs", {
      method: "POST",
      body: {
        group: text(formData, "group"),
        question: text(formData, "question"),
        answer: text(formData, "answer"),
        order: number(formData, "order"),
        published: checked(formData, "published"),
      },
    }),
  );
}

export async function updateFaqAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/faqs"), "FAQ saved.", () =>
    apiFetch(`/admin/faqs/${id}`, {
      method: "PATCH",
      body: {
        group: text(formData, "group"),
        question: text(formData, "question"),
        answer: text(formData, "answer"),
        order: number(formData, "order"),
        published: checked(formData, "published"),
      },
    }),
  );
}

export async function deleteFaqAction(formData: FormData): Promise<never> {
  return mutate("/faqs", "FAQ deleted.", () =>
    apiFetch(`/admin/faqs/${text(formData, "id")}`, { method: "DELETE" }),
  );
}

export async function createInstagramTileAction(formData: FormData): Promise<never> {
  return mutate("/instagram", "Instagram tile created.", () =>
    apiFetch("/admin/instagram", {
      method: "POST",
      body: {
        mediaId: text(formData, "mediaId"),
        caption: text(formData, "caption"),
        href: text(formData, "href"),
        order: number(formData, "order"),
        published: checked(formData, "published"),
      },
    }),
  );
}

export async function updateInstagramTileAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/instagram"), "Instagram tile saved.", () =>
    apiFetch(`/admin/instagram/${id}`, {
      method: "PATCH",
      body: {
        mediaId: text(formData, "mediaId"),
        caption: text(formData, "caption"),
        href: text(formData, "href"),
        order: number(formData, "order"),
        published: checked(formData, "published"),
      },
    }),
  );
}

export async function deleteInstagramTileAction(formData: FormData): Promise<never> {
  return mutate("/instagram", "Instagram tile deleted.", () =>
    apiFetch(`/admin/instagram/${text(formData, "id")}`, { method: "DELETE" }),
  );
}

export async function getMediaUploadSignature(folder = "dashboard"): Promise<UploadSignature> {
  return apiFetch<UploadSignature>("/admin/media/signature", {
    method: "POST",
    body: { folder },
  });
}

export async function registerMedia(input: MediaRegister): Promise<void> {
  await apiFetch("/admin/media", { method: "POST", body: input });
  revalidatePath("/media");
}

export async function updateMediaAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/media"), "Media details saved.", () =>
    apiFetch(`/admin/media/${id}`, {
      method: "PATCH",
      body: {
        alt: text(formData, "alt"),
        depictsPupils: checked(formData, "depictsPupils"),
        consentOnFile: checked(formData, "consentOnFile"),
        consentRef: text(formData, "consentRef") || null,
      },
    }),
  );
}

export async function deleteMediaAction(formData: FormData): Promise<never> {
  return mutate("/media", "Media record removed.", () =>
    apiFetch(`/admin/media/${text(formData, "id")}`, { method: "DELETE" }),
  );
}

export async function updateEnquiryStatusAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/enquiries"), "Enquiry status updated.", () =>
    apiFetch(`/admin/enquiries/${id}/status`, {
      method: "PATCH",
      body: { status: text(formData, "status") },
    }),
  );
}

export async function deleteEnquiryAction(formData: FormData): Promise<never> {
  return mutate("/enquiries", "Enquiry erased.", () =>
    apiFetch(`/admin/enquiries/${text(formData, "id")}`, { method: "DELETE" }),
  );
}

export async function createUserAction(formData: FormData): Promise<never> {
  return mutate("/users", "Staff account created.", () =>
    apiFetch("/admin/users", {
      method: "POST",
      body: {
        email: text(formData, "email"),
        displayName: text(formData, "displayName"),
        password: text(formData, "password"),
        roleSlug: text(formData, "roleSlug"),
      },
    }),
  );
}

export async function inviteUserAction(formData: FormData): Promise<never> {
  return mutate("/users", "Invitation sent.", () =>
    apiFetch("/admin/users/invite", {
      method: "POST",
      body: {
        email: text(formData, "email"),
        displayName: text(formData, "displayName"),
        roleSlug: text(formData, "roleSlug"),
      },
    }),
  );
}

export async function updateUserStatusAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/users"), "Staff account status updated.", () =>
    apiFetch(`/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status: text(formData, "status") },
    }),
  );
}

export async function assignUserRoleAction(formData: FormData): Promise<never> {
  const id = text(formData, "id");
  return mutate(destination(formData, "/users"), "Staff role updated.", () =>
    apiFetch(`/admin/users/${id}/role`, {
      method: "PATCH",
      body: { roleSlug: text(formData, "roleSlug") },
    }),
  );
}

export async function deleteUserAction(formData: FormData): Promise<never> {
  return mutate("/users", "Staff account removed.", () =>
    apiFetch(`/admin/users/${text(formData, "id")}`, { method: "DELETE" }),
  );
}

export async function updateSettingsAction(formData: FormData): Promise<never> {
  return mutate("/settings?tab=website", "Website settings saved.", () =>
    apiFetch("/admin/settings", {
      method: "PATCH",
      body: {
        contact: {
          phones: text(formData, "phones")
            .split("\n")
            .map((phone) => phone.trim())
            .filter(Boolean),
          email: text(formData, "email"),
          address: text(formData, "address"),
          gpsCode: text(formData, "gpsCode"),
          mapEmbed: text(formData, "mapEmbed"),
        },
        hours: text(formData, "hours"),
        socials: {
          instagram: text(formData, "instagram"),
          facebook: text(formData, "facebook"),
          tiktok: text(formData, "tiktok"),
        },
        seoDefaults: {
          titleTemplate: text(formData, "titleTemplate"),
          description: text(formData, "seoDescription"),
          ogImageId: text(formData, "ogImageId"),
        },
        admissionFormUrl: text(formData, "admissionFormUrl"),
        footerNote: text(formData, "footerNote"),
        announcementBanner: {
          enabled: checked(formData, "announcementEnabled"),
          message: text(formData, "announcementMessage"),
          href: text(formData, "announcementHref"),
        },
      },
    }),
  );
}

export async function updateProfileAction(formData: FormData): Promise<never> {
  return mutate("/settings?tab=profile", "Profile updated.", () =>
    apiFetch("/auth/me", {
      method: "PATCH",
      body: { displayName: text(formData, "displayName") },
    }),
  );
}

export async function updateProfilePhoto(avatarUrl: string): Promise<string | null> {
  try {
    await apiFetch("/auth/me", { method: "PATCH", body: { avatarUrl } });
    revalidatePath("/settings");
    return null;
  } catch (error) {
    return messageOf(error);
  }
}

export async function changePasswordAction(formData: FormData): Promise<never> {
  let error: string | null = null;
  try {
    await apiFetch("/auth/password/change", {
      method: "POST",
      body: {
        currentPassword: text(formData, "currentPassword"),
        newPassword: text(formData, "newPassword"),
      },
    });
  } catch (caught) {
    error = messageOf(caught);
  }

  if (error) {
    redirect(`/settings?tab=security&error=${encodeURIComponent(error)}`);
  }

  await clearSession();
  redirect("/login");
}

export async function logoutAllSessionsAction(): Promise<never> {
  try {
    await apiFetch("/auth/logout-all", { method: "POST" });
  } finally {
    await clearSession();
  }

  redirect("/login");
}

/* ── Two-factor authentication ─────────────────────────────────────────── */

/**
 * Starts an enrolment. Nothing is stored until `enableMfa` confirms a code.
 *
 * Returns the secret to the browser deliberately — it has to be shown as a QR
 * and as text for manual entry. That is the same secret the authenticator app
 * will hold, so it is no more exposed here than it is on the phone; what matters
 * is that it is never persisted server-side until proven, and never stored in
 * the clear when it is.
 */
export async function beginMfaEnrolment(): Promise<{ secret: string; uri: string }> {
  return apiFetch<{ secret: string; uri: string }>("/auth/mfa/setup", { method: "POST" });
}

/** @returns the recovery codes, shown once and never retrievable again. */
export async function enableMfa(secret: string, code: string): Promise<string[]> {
  const result = await apiFetch<{ recoveryCodes: string[] }>("/auth/mfa/enable", {
    method: "POST",
    body: { secret, code },
  });

  revalidatePath("/settings");
  return result.recoveryCodes;
}

export async function disableMfa(password: string): Promise<void> {
  await apiFetch("/auth/mfa/disable", { method: "POST", body: { password } });
  revalidatePath("/settings");
}
