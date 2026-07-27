import { describe, expect, it } from "vitest";

import { resolvePreviewParentOrigin } from "./preview-origin";

// A development dashboard reached from another device on the LAN is plain
// http by definition — accepting exactly those origins is the case under test.
/* eslint-disable sonarjs/no-clear-text-protocols */
const LAN_DASHBOARDS = ["http://192.168.1.20:3101", "http://10.0.0.12:3101", "http://172.20.0.4:3101"];
/* eslint-enable sonarjs/no-clear-text-protocols */

describe("resolvePreviewParentOrigin", () => {
  it("uses the configured dashboard in production", () => {
    expect(
      resolvePreviewParentOrigin({
        requested: "https://dashboard.kedland.edu.gh/settings",
        configured: "https://dashboard.kedland.edu.gh",
        isDev: false,
      }),
    ).toBe("https://dashboard.kedland.edu.gh");
  });

  it("does not let a query parameter widen production access", () => {
    expect(
      resolvePreviewParentOrigin({
        requested: "https://example.com",
        configured: "https://dashboard.kedland.edu.gh",
        isDev: false,
      }),
    ).toBe("https://dashboard.kedland.edu.gh");
  });

  it.each(["http://127.0.0.1:3101", "http://localhost:3101", ...LAN_DASHBOARDS])(
    "accepts the local development dashboard at %s",
    (requested) => {
      expect(
        resolvePreviewParentOrigin({
          requested,
          configured: "http://localhost:3101",
          isDev: true,
        }),
      ).toBe(requested);
    },
  );

  it("rejects a public HTTP origin even in development", () => {
    expect(
      resolvePreviewParentOrigin({
        requested: "http://example.com",
        configured: "http://localhost:3101",
        isDev: true,
      }),
    ).toBe("http://localhost:3101");
  });
});
