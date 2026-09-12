import { describe, expect, it } from "vitest";

import { normalizeSchoolContent, schoolCopy } from "./school-copy";

describe("school-approved public copy", () => {
  it.each(["Primary 1–3", "Primary 1-3", "Primary 1 to 3", "Primary 3"])("replaces %s", (value) => {
    expect(schoolCopy(value)).toBe("Primary");
  });
  it("changes nested CMS copy without changing asset identifiers or URLs", () => {
    const result = normalizeSchoolContent({
      name: "Mary",
      cards: [{ body: "Welcome from Mary to Primary 1–3." }],
      portrait: { mediaId: "principal-mary", alt: "Mary, Principal" },
      href: "/Mary/primary-1-3",
      slug: "Mary",
    });
    expect(result).toEqual({
      name: "the Principal",
      cards: [{ body: "Welcome from the Principal to Primary." }],
      portrait: { mediaId: "principal-mary", alt: "the Principal" },
      href: "/Mary/primary-1-3",
      slug: "Mary",
    });
    expect(normalizeSchoolContent(result)).toEqual(result);
  });
});
