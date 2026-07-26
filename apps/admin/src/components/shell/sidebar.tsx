"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@kedland/ui";

import { isActive, visibleGroups } from "./nav-config";

import type { UserRole } from "@kedland/types";

/**
 * The dashboard's fixed sidebar.
 *
 * Groups are always open. Collapsible groups look tidier in a screenshot and
 * cost a real click every time somebody wants a section they use daily — this
 * nav is fifteen items for three people, and the whole thing fits on screen.
 *
 * Filtering by role here is presentation only: it avoids showing an editor a
 * door they cannot open. The API's guard is what actually refuses them, and
 * `requireAdmin` is what stops the page rendering.
 */
export function Sidebar({ userRole, onNavigate }: Readonly<{ userRole: UserRole; onNavigate?: () => void }>) {
  const pathname = usePathname();
  const groups = visibleGroups(userRole);

  return (
    <nav aria-label="Dashboard" className="flex h-full flex-col gap-7 overflow-y-auto p-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-small font-bold uppercase tracking-[0.06em] text-grey">{group.title}</p>

          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const current = isActive(pathname, item);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    {...(onNavigate ? { onClick: onNavigate } : {})}
                    aria-current={current ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-[0.95rem] transition-colors ${
                      current
                        ? "bg-navy font-bold text-white"
                        : "font-semibold text-ink/80 hover:bg-sky/40 hover:text-navy"
                    }`}
                  >
                    {/* A dot, not an icon per item: fifteen invented icons for
                        fifteen abstract nouns is fifteen chances to pick a
                        confusing one. The dot marks position, nothing more. */}
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-pill ${current ? "bg-yellow" : "bg-sky"}`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <p className="mt-auto flex items-center gap-2 px-3 pt-4 text-small text-grey">
        <Icon name="star" className="size-4 text-yellow" />
        Kedland International School
      </p>
    </nav>
  );
}
