"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@kedland/ui";

import { activeGroup, isActive, visibleGroups } from "./nav-config";

import type { UserRole } from "@kedland/types";

export const SIDEBAR_GROUPS_KEY = "kedland-admin-sidebar-groups";

function parseGroupState(stored: string): Record<string, boolean> {
  const parsed = JSON.parse(stored) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean"),
  );
}

interface SidebarProps {
  userRole: UserRole;
  collapsed?: boolean;
  idPrefix?: string;
  onNavigate?: () => void;
}

/**
 * Grouped navigation with a visible parent-to-child connector.
 *
 * Each group owns its expansion state. The active route is revealed whenever
 * navigation enters a new group, while a deliberate click can still collapse
 * the current group. State persists because staff should not have to organise
 * the same rail every time they move between workflows.
 */
export function Sidebar({
  userRole,
  collapsed = false,
  idPrefix = "desktop",
  onNavigate,
}: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const groups = visibleGroups(userRole);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((group) => [group.title, true])),
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_GROUPS_KEY);
    if (!stored) return undefined;

    try {
      const parsed = parseGroupState(stored);
      const restoreGroups = window.setTimeout(() => {
        setOpenGroups((current) => ({
          ...current,
          ...parsed,
        }));
      }, 0);

      return () => {
        window.clearTimeout(restoreGroups);
      };
    } catch {
      window.localStorage.removeItem(SIDEBAR_GROUPS_KEY);
      return undefined;
    }
  }, []);

  useEffect(() => {
    const currentGroup = activeGroup(pathname, groups);
    if (!currentGroup) return;

    const revealActiveGroup = window.setTimeout(() => {
      setOpenGroups((current) => {
        if (current[currentGroup.title] !== false) return current;
        const next = { ...current, [currentGroup.title]: true };
        window.localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
        return next;
      });
    }, 0);

    return () => {
      window.clearTimeout(revealActiveGroup);
    };
    // `pathname` is the meaningful trigger. `groups` is derived each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (title: string): void => {
    setOpenGroups((current) => {
      const next = { ...current, [title]: current[title] === false };
      window.localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <nav
      aria-label="Dashboard"
      className={`admin-sidebar flex h-[calc(100%-5.75rem)] flex-col overflow-y-auto py-4 ${
        collapsed ? "px-2" : "px-4"
      }`}
    >
      <div className="space-y-2">
        {groups.map((group) => {
          const open = openGroups[group.title] !== false;
          const groupId = `${idPrefix}-nav-${group.title.toLowerCase().replaceAll(" ", "-")}`;
          const containsCurrent = group.items.some((item) => isActive(pathname, item));

          return (
            <section
              key={group.title}
              className={`admin-nav-group ${containsCurrent ? "admin-nav-group-current" : ""}`}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={groupId}
                aria-label={`${open ? "Collapse" : "Expand"} ${group.title}`}
                title={collapsed ? group.title : undefined}
                onClick={() => {
                  toggleGroup(group.title);
                }}
                className={`admin-nav-group-trigger flex min-h-10 w-full items-center rounded-md text-left ${
                  collapsed ? "justify-center px-2" : "gap-2.5 px-3"
                }`}
              >
                <span className="admin-nav-group-icon grid size-7 shrink-0 place-items-center rounded-md">
                  <Icon name={group.icon} className="size-3.5" />
                </span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-[0.7rem] font-bold uppercase tracking-[0.13em]">
                      {group.title}
                    </span>
                    <Icon
                      name="chevron-down"
                      className={`size-3.5 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
                    />
                  </>
                )}
              </button>

              {open && (
                <div id={groupId} className={collapsed ? "mt-1" : "admin-nav-branch"}>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const current = isActive(pathname, item);

                      return (
                        <li key={item.href} className={collapsed ? "" : "admin-nav-child"}>
                          <Link
                            href={item.href}
                            {...(onNavigate ? { onClick: onNavigate } : {})}
                            aria-current={current ? "page" : undefined}
                            aria-label={collapsed ? item.label : undefined}
                            title={collapsed ? item.label : undefined}
                            className={`group relative flex min-h-10 min-w-0 items-center rounded-md text-[0.9rem] transition-all duration-200 ${
                              collapsed ? "justify-center px-2" : "gap-3 px-3 py-1.5"
                            } ${
                              current
                                ? "admin-nav-active font-bold text-white"
                                : "font-semibold text-white/62 hover:bg-white/[0.07] hover:text-white"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`admin-nav-node relative z-10 grid size-7 shrink-0 place-items-center rounded-md ${
                                current
                                  ? "border-yellow/55 bg-yellow/16 text-yellow"
                                  : "border-sky/15 bg-white/[0.035] text-sky/65 group-hover:border-sky/30 group-hover:text-sky"
                              }`}
                            >
                              <Icon name={item.icon} className="size-3.5" />
                            </span>
                            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                            {!collapsed && current && (
                              <span aria-hidden="true" className="size-1.5 rounded-pill bg-yellow" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {!collapsed && (
        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-start gap-3">
            <Icon name="shield" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-sky/70" />
            <div className="min-w-0">
              <p className="text-[0.82rem] font-semibold leading-snug text-white/78">
                Kedland International School
              </p>
              <p className="mt-0.5 text-[0.72rem] leading-snug text-white/45">Website administration</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
