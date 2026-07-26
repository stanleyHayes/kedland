import { signOut } from "../login/actions";

import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth";

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

  return (
    <AppShell user={user} signOutAction={signOut}>
      {children}
    </AppShell>
  );
}
