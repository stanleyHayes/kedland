// One small pattern per RFC 1918 / loopback range keeps each expression
// readable — and under the lint complexity ceiling a single combined
// alternation was not.
const PRIVATE_V4 = [
  /^127(?:\.\d{1,3}){3}$/,
  /^10(?:\.\d{1,3}){3}$/,
  /^192\.168(?:\.\d{1,3}){2}$/,
  /^172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}$/,
];

function parsedOrigin(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(new URL(value).origin);
  } catch {
    return null;
  }
}

function isLocalDevelopmentOrigin(origin: URL): boolean {
  if (origin.protocol !== "http:") return false;
  return (
    origin.hostname === "localhost" ||
    origin.hostname === "[::1]" ||
    PRIVATE_V4.some((pattern) => pattern.test(origin.hostname))
  );
}

/**
 * Resolve the one dashboard origin allowed to exchange preview drafts.
 *
 * Production remains pinned to the configured dashboard. Development also
 * accepts loopback and private-LAN origins so opening the same local dashboard
 * through 127.0.0.1 or a phone on Wi-Fi does not make a healthy preview look
 * offline.
 */
export function resolvePreviewParentOrigin({
  requested,
  configured,
  isDev,
}: Readonly<{
  requested?: string | undefined;
  configured?: string | undefined;
  isDev: boolean;
}>): string {
  const configuredUrl = parsedOrigin(configured);
  const requestedUrl = parsedOrigin(requested);

  if (requestedUrl && requestedUrl.origin === configuredUrl?.origin) {
    return requestedUrl.origin;
  }
  if (isDev && requestedUrl && isLocalDevelopmentOrigin(requestedUrl)) {
    return requestedUrl.origin;
  }
  return configuredUrl?.origin ?? "null";
}
