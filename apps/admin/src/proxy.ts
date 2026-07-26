import { NextResponse, type NextRequest } from "next/server";

/**
 * Sends a visitor with no session to the sign-in page.
 *
 * Named `proxy`, in `proxy.ts`: Next 16 deprecated the `middleware`
 * convention in favour of this one, and ships a codemod for the rename.
 *
 * **This is a convenience, not the control.** It runs before the app and
 * cannot call the API, so all it can see is whether a cookie exists — not
 * whether the token in it is valid, expired, or belongs to an account that has
 * since been suspended. Treating that as authorisation would be a hole.
 *
 * The real check is `requireUser()` in the dashboard layout and in each page,
 * which asks the API. All this does is save an obviously signed-out visitor a
 * round trip that was always going to end in a redirect.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has("kedland_refresh");

  if (!hasSession) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except the login page and public/static assets.
   *
   * `login` has to be excluded or a signed-out visitor is redirected to a page
   * that redirects them again, forever.
   */
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico|logo|fonts|images).*)"],
};
