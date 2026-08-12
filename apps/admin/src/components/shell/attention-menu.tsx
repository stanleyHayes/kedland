"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@kedland/ui";

export interface ShellAttention {
  href: string;
  icon: string;
  title: string;
  description: string;
  count: number;
  tone: "urgent" | "attention";
}

const NOTIFICATION_SIGNATURE_KEY = "kedland-admin-attention-notified";

export function AttentionMenu({ items }: Readonly<{ items: ShellAttention[] }>) {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window
      ? window.Notification.permission
      : "unsupported",
  );
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const signature = items.map((item) => `${item.href}:${String(item.count)}`).join("|");

  useEffect(() => {
    const close = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    if (permission !== "granted" || total === 0 || !signature) return;
    if (window.localStorage.getItem(NOTIFICATION_SIGNATURE_KEY) === signature) return;

    const notification = new window.Notification("Kedland needs attention", {
      body: `${String(total)} ${total === 1 ? "item needs" : "items need"} a staff response.`,
      icon: "/logo/kedland-logo-256.png",
      tag: "kedland-admin-attention",
    });
    notification.onclick = () => {
      window.focus();
      setOpen(true);
    };
    window.localStorage.setItem(NOTIFICATION_SIGNATURE_KEY, signature);
  }, [permission, signature, total]);

  const enableBrowserAlerts = async (): Promise<void> => {
    if (!("Notification" in window)) return;
    setPermission(await window.Notification.requestPermission());
  };

  return (
    <div ref={root} data-tour="attention" className="static sm:relative">
      <button
        ref={trigger}
        type="button"
        aria-label={total > 0 ? `Notifications, ${String(total)} need attention` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="admin-icon-button relative grid size-11 place-items-center text-navy"
      >
        <Icon name="bell" className="size-5" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-pill bg-red px-1.5 py-0.5 text-[0.65rem] font-extrabold leading-4 text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Items needing attention"
          /*
           * Pinned to both edges of the screen on a phone, anchored to the bell
           * above `sm`.
           *
           * This panel is 24rem wide and used to measure that leftward from the
           * bell — which is not the rightmost thing in the header, the avatar
           * is. So it started already inset from the right and ran off the left
           * edge, with its heading and its text cut in half.
           *
           * The wrapper is `static` on small screens, which makes the sticky
           * header the containing block here, so `inset-x-3` is the screen and
           * overflowing it is no longer possible.
           */
          className="admin-attention-menu absolute inset-x-3 top-[calc(100%_+_0.75rem)] z-60 overflow-hidden rounded-lg sm:inset-x-auto sm:right-0 sm:w-[min(24rem,calc(100vw-2rem))]"
        >
          <div className="border-b border-sky/60 px-5 py-4">
            <p className="font-display text-[1.05rem] font-bold text-navy">Needs attention</p>
            <p className="mt-1 text-small text-grey">
              {total > 0 ? `${String(total)} live items across the workspace.` : "Everything is caught up."}
            </p>
          </div>
          <div className="max-h-[22rem] overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-pill bg-green/12 text-green">
                  <Icon name="check" className="size-6" />
                </span>
                <p className="mt-3 font-display font-bold text-navy">No urgent work</p>
                <p className="mt-1 text-small text-grey">New items will appear here automatically.</p>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                  }}
                  className="admin-attention-item flex gap-3 rounded-md px-3 py-3 transition"
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-md ${
                      item.tone === "urgent" ? "bg-red/12 text-red" : "bg-yellow/20 text-navy"
                    }`}
                  >
                    <Icon name={item.icon} className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display font-bold text-navy">{item.title}</span>
                      <span className="rounded-pill bg-navy px-2 py-0.5 text-[0.68rem] font-bold text-white">
                        {item.count}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-small leading-snug text-grey">{item.description}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
          {permission !== "granted" && permission !== "denied" && (
            <div className="border-t border-sky/60 p-3">
              <button
                type="button"
                onClick={() => void enableBrowserAlerts()}
                disabled={permission === "unsupported"}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-3 font-display text-small font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="bell" className="size-4" />
                {permission === "unsupported" ? "Browser alerts unavailable" : "Enable browser alerts"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
