"use server";

import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { clearSession, writeSession } from "@/lib/session";

/**
 * Sign in and sign out.
 *
 * Server Actions rather than route handlers: the credentials go straight from
 * the form to the server without any client-side JavaScript, so the form works
 * before hydration and the password never sits in a React state value.
 */

export interface LoginState {
  error?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string; role: string };
}

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  // `FormData.get` can return a File, which stringifies to "[object File]".
  // Reading only genuine strings means a crafted multipart body cannot smuggle
  // an object through as a credential.
  const emailField = formData.get("email");
  const passwordField = formData.get("password");
  const email = typeof emailField === "string" ? emailField.trim() : "";
  const password = typeof passwordField === "string" ? passwordField : "";

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  let tokens: LoginResponse;
  try {
    tokens = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      authenticated: false,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      /*
       * One message for every rejection, whatever the API said.
       *
       * "No such account" and "wrong password" told apart is an account
       * enumeration oracle — somebody can discover which staff addresses
       * exist by watching which error comes back. The API already answers both
       * in constant time for the same reason; undoing that here in the name of
       * a friendlier message would waste the effort.
       *
       * 429 is different: it is not about the credentials, and leaving an
       * editor to guess why their correct password stopped working would be
       * unkind.
       */
      if (error.status === 429) {
        return { error: "Too many attempts. Please wait a minute and try again." };
      }
      if (error.status >= 500 || error.status === 503) {
        return { error: "We could not reach the server. Please try again in a moment." };
      }

      return { error: "That email address and password do not match an account." };
    }

    throw error;
  }

  await writeSession(tokens);
  redirect("/");
}

export async function signOut(): Promise<void> {
  // Told to the API first, so the refresh token is revoked server-side rather
  // than merely forgotten by this browser. A failure there must not stop the
  // local sign-out: an editor pressing "sign out" on a shared computer needs
  // the cookies gone regardless.
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {
    // Intentionally ignored — see above.
  }

  await clearSession();
  redirect("/login");
}
