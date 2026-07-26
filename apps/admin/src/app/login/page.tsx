import Image from "next/image";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";

import type { Metadata } from "next";

import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  // A staff login has nothing to offer a search engine and no reason to be
  // indexed alongside the school's public pages.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Somebody already signed in has no use for this page. Checked here rather
  // than in the middleware because only the API can say whether the cookie
  // still represents a live session.
  if (await currentUser()) redirect("/");

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo/kedland-logo-256.png"
            alt="Kedland International School"
            width={256}
            height={256}
            priority
            className="size-20 object-contain"
          />
          <h1 className="mt-6 text-h2">Kedland Dashboard</h1>
          <p className="mt-2 text-grey">Sign in to manage the school&rsquo;s website.</p>
        </div>

        <div className="mt-8 rounded-lg bg-white p-8 shadow-card">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-small text-grey">
          Trouble signing in? Ask an administrator to reset your password.
        </p>
      </div>
    </main>
  );
}
