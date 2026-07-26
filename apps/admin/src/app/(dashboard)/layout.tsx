import { signOut } from "../login/actions";

import type { ShellAttention } from "@/components/shell/attention-menu";
import type { MediaItem, Paginated, PostSummary } from "@kedland/types";

import { AppShell } from "@/components/shell/app-shell";
import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/auth";

async function loadAttention(): Promise<{
  attention: ShellAttention[];
  badges: Record<string, number>;
}> {
  try {
    const [counts, drafts, media] = await Promise.all([
      apiFetch<{ unread: number; undelivered: number }>("/admin/enquiries/counts"),
      apiFetch<Paginated<PostSummary>>("/admin/posts?status=draft&pageSize=1"),
      apiFetch<MediaItem[]>("/admin/media"),
    ]);
    const enquiryCount = Math.max(counts.unread, counts.undelivered);
    const consentGaps = media.filter((item) => item.depictsPupils && !item.consentOnFile).length;
    const attention: ShellAttention[] = [];
    if (enquiryCount > 0) {
      attention.push({
        href: "/enquiries?status=new",
        icon: "message",
        title: "Parent enquiries",
        description:
          counts.undelivered > 0
            ? `${String(counts.undelivered)} were not delivered by email.`
            : "New messages are waiting for a staff response.",
        count: enquiryCount,
        tone: counts.undelivered > 0 ? "urgent" : "attention",
      });
    }
    if (drafts.total > 0) {
      attention.push({
        href: "/posts?status=draft",
        icon: "book",
        title: "Unfinished posts",
        description: "Draft stories are waiting for review or publication.",
        count: drafts.total,
        tone: "attention",
      });
    }
    if (consentGaps > 0) {
      attention.push({
        href: "/media?consent=gaps",
        icon: "images",
        title: "Media consent gaps",
        description: "Pupil images need a complete consent record.",
        count: consentGaps,
        tone: "urgent",
      });
    }
    return {
      attention,
      badges: {
        "/enquiries": enquiryCount,
        "/posts": drafts.total,
        "/media": consentGaps,
      },
    };
  } catch {
    return { attention: [], badges: {} };
  }
}

/**
 * Everything behind the sign-in.
 *
 * The route group exists so the login page can live outside it: a login screen
 * wrapped in the dashboard's own navigation would be absurd, and putting the
 * auth check in the root layout would make that unavoidable.
 *
 * `requireUser` runs on every navigation into this group. Next does not
 * guarantee a layout re-renders for every nested route change, so each page
 * calls it too — a layout is where the shell lives, not where access is
 * decided.
 */
export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const { attention, badges } = await loadAttention();

  return (
    <AppShell user={user} signOutAction={signOut} attention={attention} badges={badges}>
      {children}
    </AppShell>
  );
}
