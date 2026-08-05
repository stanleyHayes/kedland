import { describe, expect, it } from "vitest";

import { educationalOrganization } from "./organization";

import {
  FALLBACK_SOCIALS,
  SCHOOL_ADDRESS,
  SCHOOL_FACEBOOK,
  SCHOOL_INSTAGRAM,
  SCHOOL_PHONES,
  SCHOOL_TIKTOK,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

describe("educationalOrganization", () => {
  it("declares the school as an EducationalOrganization", () => {
    const data = educationalOrganization();

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@type"]).toBe("EducationalOrganization");
    expect(data["name"]).toBe(SITE_NAME);
    expect(data["url"]).toBe(SITE_URL);
  });

  it("points the logo at an absolute URL", () => {
    expect(educationalOrganization()["logo"]).toBe(`${SITE_URL}/logo/kedland-logo-512.png`);
  });

  it("carries every school phone number, not just the first", () => {
    expect(educationalOrganization()["telephone"]).toEqual([...SCHOOL_PHONES]);
  });

  it("carries the real address as a PostalAddress", () => {
    expect(educationalOrganization()["address"]).toEqual({
      "@type": "PostalAddress",
      streetAddress: SCHOOL_ADDRESS.streetAddress,
      addressLocality: SCHOOL_ADDRESS.locality,
      addressRegion: SCHOOL_ADDRESS.region,
      addressCountry: "GH",
    });
  });

  it("links the school's social profiles as sameAs", () => {
    expect(educationalOrganization(FALLBACK_SOCIALS)["sameAs"]).toEqual([
      SCHOOL_INSTAGRAM,
      SCHOOL_FACEBOOK,
      SCHOOL_TIKTOK,
    ]);
  });

  it("uses the socials passed from CMS settings", () => {
    expect(
      educationalOrganization({
        instagram: "https://www.instagram.com/custom",
        facebook: "",
        tiktok: "https://www.tiktok.com/@custom",
      })["sameAs"],
    ).toEqual(["https://www.instagram.com/custom", "https://www.tiktok.com/@custom"]);
  });

  it("omits geo rather than guessing coordinates the school never supplied", () => {
    expect(educationalOrganization()).not.toHaveProperty("geo");
  });
});
