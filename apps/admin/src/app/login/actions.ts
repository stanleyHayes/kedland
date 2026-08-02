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
  /**
   * Set when the password was right but a code is still needed.
   *
   * The form switches to asking for one. No session cookie is written at this
   * point — the tokens do not exist yet — so an abandoned challenge leaves the
   * browser exactly as unauthenticated as it started.
   */
  challenge?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string; role: string };
}

/** What the API returns instead of tokens when two-factor is on. */
interface MfaChallengeResponse {
  mfaRequired: true;
  challenge: string;
}

function isChallenge(result: LoginResponse | MfaChallengeResponse): result is MfaChallengeResponse {
  return "mfaRequired" in result;
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

  let tokens: LoginResponse | MfaChallengeResponse;
  try {
    tokens = await apiFetch<LoginResponse | MfaChallengeResponse>("/auth/login", {
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

  // Password accepted, second factor outstanding. Nothing is written yet.
  if (isChallenge(tokens)) return { challenge: tokens.challenge };

  await writeSession(tokens);
  redirect("/");
}

/**
 * The second step: a code, against the challenge from the first.
 *
 * Its own action rather than a branch inside `signIn`, because the two take
 * different inputs and only this one can write a session. A failed code sends
 * the editor back to the password step — the API spends the challenge whichever
 * way it goes, so there is nothing left to retry against.
 */
export async function verifyMfa(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const challengeField = formData.get("challenge");
  const codeField = formData.get("code");
  const challenge = typeof challengeField === "string" ? challengeField : "";
  const code = typeof codeField === "string" ? codeField.trim() : "";

  if (!challenge || !code) {
    return { challenge, error: "Enter the code from your authenticator app." };
  }

  let tokens: LoginResponse;
  try {
    tokens = await apiFetch<LoginResponse>("/auth/mfa/verify", {
      method: "POST",
      body: { challenge, code },
      authenticated: false,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return { error: "Too many attempts. Please wait a minute and sign in again." };
      }
      // The challenge is spent, so there is nothing to return to — back to the
      // password step, which is the honest state.
      return { error: "That code was not accepted. Please sign in again." };
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
