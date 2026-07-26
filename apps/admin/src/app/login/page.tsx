import Image from "next/image";
import { redirect } from "next/navigation";

import { Icon, Watermark } from "@kedland/ui";

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
    <main className="relative min-h-dvh overflow-hidden bg-cream">
      <span className="pointer-events-none absolute -right-32 -top-32 size-[32rem] rounded-full bg-yellow/12 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-48 right-[18%] size-[34rem] rounded-full bg-blue/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-dvh max-w-[100rem] lg:grid-cols-[minmax(27rem,0.82fr)_minmax(0,1.18fr)]">
        <section className="admin-login-rail relative flex min-h-60 overflow-hidden px-7 py-7 text-white sm:px-12 lg:min-h-dvh lg:flex-col lg:justify-between lg:px-14 lg:py-12">
          <Icon
            name="star"
            strokeWidth={1}
            className="pointer-events-none absolute -right-24 top-20 size-[24rem] text-yellow opacity-[0.08]"
          />
          <Icon
            name="shield"
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-24 -left-24 size-[23rem] text-blue opacity-[0.09]"
          />

          <div className="relative flex w-full items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-[0.8rem] bg-cream p-2 shadow-[8px_10px_24px_rgb(3_24_36/0.28),-4px_-4px_14px_rgb(61_155_233/0.1)]">
                <Image
                  src="/logo/kedland-logo-256.png"
                  alt=""
                  width={256}
                  height={256}
                  priority
                  className="size-12 object-contain"
                />
              </span>
              <span className="font-display font-extrabold leading-tight text-white">
                Kedland
                <span className="mt-0.5 block text-[0.68rem] font-bold uppercase tracking-[0.13em] text-sky/65">
                  Staff console
                </span>
              </span>
            </div>
            <span
              aria-hidden="true"
              className="grid size-11 place-items-center rounded-[0.7rem] border border-white/12 bg-white/[0.06] text-yellow shadow-[5px_6px_14px_rgb(3_24_36/0.22),-3px_-3px_10px_rgb(61_155_233/0.08),inset_1px_1px_0_rgb(255_255_255/0.08)]"
            >
              <Icon name="shield" className="size-5" />
            </span>
          </div>

          <div className="relative hidden max-w-lg lg:block">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-yellow">
              School operations
            </p>
            <h2 className="mt-4 max-w-md text-[clamp(2.6rem,4vw,4.1rem)] leading-[0.98] text-white">
              One calm place to run the school website.
            </h2>
            <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-white/65">
              Review parent enquiries, publish school stories and keep public information current.
            </p>

            <ul className="mt-8 max-w-md divide-y divide-white/10 border-y border-white/10">
              {[
                ["message", "Enquiries", "See what is waiting and what failed to notify staff."],
                ["book", "Publishing", "Move stories clearly from draft to live."],
                ["shield", "Accountability", "Keep access and operational status visible."],
              ].map(([icon, label, description]) => (
                <li key={label} className="flex items-start gap-3 py-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-white/[0.07] text-yellow">
                    <Icon name={icon ?? "star"} className="size-4" />
                  </span>
                  <span>
                    <span className="block font-display text-small font-bold text-white">{label}</span>
                    <span className="mt-0.5 block text-[0.76rem] leading-snug text-white/52">
                      {description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative hidden text-[0.72rem] uppercase tracking-[0.1em] text-white/38 lg:block">
            Kedland International School · Lashibi-Tema
          </p>
        </section>

        <section className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16 lg:py-8">
          <div className="admin-panel relative w-full max-w-[33rem] overflow-hidden rounded-lg p-7 sm:p-9">
            <span className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-red via-pink to-yellow" />
            <Watermark name="shield" className="-bottom-12 -right-10 size-56 text-navy opacity-[0.03]" />

            <div className="relative">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-red-text">
                    Protected staff access
                  </p>
                  <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.5rem)]">Welcome back</h1>
                </div>
                <span className="admin-icon-button grid size-11 shrink-0 place-items-center text-navy">
                  <Icon name="shield" className="size-5" />
                </span>
              </div>
              <p className="mt-3 max-w-md text-grey">Sign in with your Kedland staff account to continue.</p>

              <div className="mt-7">
                <LoginForm />
              </div>

              <div className="mt-7 flex items-start gap-3 border-t border-sky/60 pt-5 text-small text-grey">
                <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-blue" />
                <p>Need access help? Ask a Kedland administrator to reset your account.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
