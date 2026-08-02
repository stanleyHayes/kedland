import "server-only";

import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "./api";
import { readSession } from "./session";

import type { Permission, UserRole, UserStatus } from "@kedland/types";

/** The signed-in account, as `GET /auth/me` returns it. */
export interface Account {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  roleSlug: string;
  permissions: Permission[];
  /** Whether an authenticator app is enrolled on this account. */
  mfaEnabled: boolean;
  status: UserStatus;
  lastLoginAt: string | null;
}

/**
 * The signed-in account, or null.
 *
 * Asks the API rather than decoding the JWT here. Decoding locally would be
 * faster and would also happily keep showing a suspended account as signed in
 * until their token expired — the API is the only thing that knows whether the
 * account is still allowed in *now*.
 */
export async function currentUser(): Promise<Account | null> {
  const { accessToken, refreshToken } = await readSession();
  if (!accessToken && !refreshToken) return null;

  try {
    const account = await apiFetch<
      Omit<Account, "role" | "roleSlug" | "permissions" | "mfaEnabled"> & {
        role?: UserRole;
        roleSlug?: string;
        permissions?: Permission[];
        mfaEnabled?: boolean;
      }
    >("/auth/me");
    const roleSlug = account.roleSlug ?? account.role ?? "editor";

    return {
      ...account,
      role: account.role ?? (roleSlug === "administrator" || roleSlug === "admin" ? "admin" : "editor"),
      roleSlug,
      permissions: account.permissions ?? [],
      // An older API that predates two-factor simply reports it as off.
      mfaEnabled: account.mfaEnabled ?? false,
    };
  } catch (error) {
    // A 401 here means the session is genuinely finished — `apiFetch` has
    // already tried the refresh. Anything else (the API being down) is not the
    // editor's fault, but it still cannot be treated as signed in.
    if (error instanceof ApiError) return null;
    throw error;
  }
}

/**
 * The signed-in account, or a redirect to sign in.
 *
 * Every dashboard page calls this. The middleware also redirects an obviously
 * cookie-less request, but that is a convenience and not the control: the
 * middleware cannot tell a valid token from an expired one without asking the
 * API, so the page has to check too.
 */
export async function requireUser(): Promise<Account> {
  const user = await currentUser();
  if (!user) redirect("/login");

  return user;
}

/**
 * The signed-in account, or a redirect, for an administrator-only page.
 *
 * Sent to the dashboard rather than to sign-in: an editor who lands on the user
 * list is signed in correctly and simply not allowed here, and bouncing them to
 * a login form would suggest otherwise. The API refuses the underlying calls
 * regardless — this only avoids showing a page that would fail.
 */
export async function requireAdmin(): Promise<Account> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");

  return user;
}
