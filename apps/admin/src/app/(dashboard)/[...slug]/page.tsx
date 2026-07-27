import { notFound, redirect } from "next/navigation";

import type { Account } from "@/lib/auth";
import type { ReactNode } from "react";

import {
  AuditWorkflow,
  HelpWorkflow,
  SettingsWorkflow,
  UserDetailWorkflow,
  UsersWorkflow,
} from "@/components/workflows/account-workflows";
import {
  ContentWorkflow,
  FaqDetailWorkflow,
  FaqsWorkflow,
  InstagramDetailWorkflow,
  InstagramWorkflow,
} from "@/components/workflows/content-workflows";
import {
  EnquiriesWorkflow,
  EnquiryDetailWorkflow,
  MediaDetailWorkflow,
  MediaWorkflow,
} from "@/components/workflows/operations-workflows";
import {
  CategoriesWorkflow,
  PostEditorWorkflow,
  PostsWorkflow,
} from "@/components/workflows/publishing-workflows";
import { requireAdmin, requireUser } from "@/lib/auth";

type DashboardQuery = Record<string, string | string[] | undefined>;

interface DestinationRouteProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<DashboardQuery>;
}

function value(params: DashboardQuery, key: string): string | undefined {
  const found = params[key];
  return Array.isArray(found) ? found[0] : found;
}

interface RouteContext {
  query: DashboardQuery;
  user: Account;
  feedback: { notice?: string | undefined; error?: string | undefined };
}

async function usersRoute(
  query: RouteContext["query"],
  feedback: RouteContext["feedback"],
): Promise<ReactNode> {
  await requireAdmin();
  return <UsersWorkflow q={value(query, "q")} status={value(query, "status")} {...feedback} />;
}

async function auditRoute(query: RouteContext["query"]): Promise<ReactNode> {
  await requireAdmin();
  const page = Number.parseInt(value(query, "page") ?? "1", 10);
  return (
    <AuditWorkflow
      page={Number.isFinite(page) && page > 0 ? page : 1}
      q={value(query, "q")}
      action={value(query, "action")}
    />
  );
}

function exactRoutes({
  query,
  user,
  feedback,
}: RouteContext): Record<string, () => ReactNode | Promise<ReactNode>> {
  return {
    "/posts": () => (
      <PostsWorkflow
        page={Math.max(1, Number.parseInt(value(query, "page") ?? "1", 10) || 1)}
        q={value(query, "q")}
        category={value(query, "category")}
        status={value(query, "status")}
        {...feedback}
      />
    ),
    "/categories": () => <CategoriesWorkflow />,
    "/content": () => (
      <ContentWorkflow selectedPage={value(query, "page")} q={value(query, "q")} {...feedback} />
    ),
    "/faqs": () => <FaqsWorkflow q={value(query, "q")} published={value(query, "published")} {...feedback} />,
    "/instagram": () => (
      <InstagramWorkflow q={value(query, "q")} published={value(query, "published")} {...feedback} />
    ),
    "/media": () => <MediaWorkflow q={value(query, "q")} consent={value(query, "consent")} {...feedback} />,
    "/enquiries": () => (
      <EnquiriesWorkflow
        page={Math.max(1, Number.parseInt(value(query, "page") ?? "1", 10) || 1)}
        status={value(query, "status")}
        q={value(query, "q")}
        {...feedback}
      />
    ),
    "/profile": () => redirect("/settings?tab=profile"),
    "/help": () => <HelpWorkflow />,
    "/users": () => usersRoute(query, feedback),
    "/audit": () => auditRoute(query),
    "/settings": () => <SettingsWorkflow user={user} tab={value(query, "tab")} {...feedback} />,
  };
}

export default async function DestinationRoute({ params, searchParams }: Readonly<DestinationRouteProps>) {
  const user = await requireUser();
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const pathname = `/${slug.join("/")}`;
  const feedback = { notice: value(query, "notice"), error: value(query, "error") };

  if (slug[0] === "posts" && slug.length === 2 && slug[1]) {
    return <PostEditorWorkflow id={slug[1]} {...feedback} />;
  }
  if (slug[0] === "faqs" && slug.length === 2 && slug[1]) {
    return <FaqDetailWorkflow id={slug[1]} {...feedback} />;
  }
  if (slug[0] === "media" && slug.length === 2 && slug[1]) {
    return <MediaDetailWorkflow id={slug[1]} {...feedback} />;
  }
  if (slug[0] === "instagram" && slug.length === 2 && slug[1]) {
    return <InstagramDetailWorkflow id={slug[1]} {...feedback} />;
  }
  if (slug[0] === "enquiries" && slug.length === 2 && slug[1]) {
    return <EnquiryDetailWorkflow id={slug[1]} {...feedback} />;
  }
  if (slug[0] === "users" && slug.length === 2 && slug[1]) {
    return <UserDetailWorkflow id={slug[1]} {...feedback} />;
  }

  const render = exactRoutes({ query, user, feedback })[pathname];
  if (render) return render();

  notFound();
}
