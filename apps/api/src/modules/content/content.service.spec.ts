import { BadRequestException, NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";
import { RevisionsService } from "../revisions/revisions.service";

import { ContentService } from "./content.service";
import { PageSection } from "./schemas/page-section.schema";

interface QueryChain {
  exec: jest.Mock;
}

function query<T>(result: T): QueryChain {
  return { exec: jest.fn().mockResolvedValue(result) };
}

/** A stored section document, with the `save()` the service calls. */
function storedSection(key: string, data: Record<string, unknown>) {
  return {
    id: `id-${key}`,
    key,
    order: 0,
    data,
    updatedById: null,
    save: jest.fn().mockResolvedValue(undefined),
  };
}

const VALID_WELCOME = {
  heading: "Welcome to Kedland",
  body: "A vibrant, inclusive community where every child is known.",
  link: { label: "Read our story", href: "/about/our-story" },
};

describe("ContentService", () => {
  let service: ContentService;
  let model: {
    find: jest.Mock;
    findOne: jest.Mock;
    updateOne: jest.Mock;
    exists: jest.Mock;
    aggregate: jest.Mock;
  };
  let revisions: { snapshot: jest.Mock; snapshotFor: jest.Mock };
  let audit: { record: jest.Mock };
  let revalidate: { page: jest.Mock };

  beforeEach(async () => {
    model = {
      find: jest.fn().mockReturnValue(query([])),
      findOne: jest.fn().mockReturnValue(query(null)),
      updateOne: jest.fn().mockReturnValue(query({})),
      exists: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue([]),
    };
    revisions = { snapshot: jest.fn().mockResolvedValue({}), snapshotFor: jest.fn() };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    revalidate = { page: jest.fn().mockResolvedValue(true) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: getModelToken(PageSection.name), useValue: model },
        { provide: RevisionsService, useValue: revisions },
        { provide: AuditService, useValue: audit },
        { provide: RevalidateService, useValue: revalidate },
      ],
    }).compile();

    service = moduleRef.get(ContentService);
  });

  describe("reading a page", () => {
    it("reports a page the registry does not define", async () => {
      await expect(service.getPage("not-a-page" as never)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns sections in registry order, not storage order", async () => {
      // The registry is the source of truth for order. If the stored `order`
      // ever disagrees, the code is right and the database is stale.
      model.find.mockReturnValue(
        query([storedSection("cta-banner", {}), storedSection("hero", {}), storedSection("welcome", {})]),
      );

      const sections = await service.getPage("home");
      expect(sections.map((s) => s.key)).toEqual(["hero", "welcome", "cta-banner"]);
    });

    it("omits a section that has never been seeded rather than rendering it empty", async () => {
      model.find.mockReturnValue(query([storedSection("hero", { heading: "x" })]));

      const sections = await service.getPage("home");
      expect(sections.map((s) => s.key)).toEqual(["hero"]);
    });

    it("carries each section's type so the page can pick a component", async () => {
      model.find.mockReturnValue(query([storedSection("hero", {})]));

      const [hero] = await service.getPage("home");
      expect(hero?.type).toBe("hero");
    });
  });

  describe("updating a section", () => {
    it("reports a section the page does not have", async () => {
      await expect(
        service.updateSection("home", "not-a-section", {}, "507f1f77bcf86cd799439011"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects values that break the schema, with field-level detail", async () => {
      model.findOne.mockReturnValue(query(storedSection("welcome", VALID_WELCOME)));

      await expect(
        service.updateSection("home", "welcome", { heading: "" }, "507f1f77bcf86cd799439011"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("does not snapshot when validation fails", async () => {
      model.findOne.mockReturnValue(query(storedSection("welcome", VALID_WELCOME)));

      await service
        .updateSection("home", "welcome", { nope: true }, "507f1f77bcf86cd799439011")
        .catch(() => undefined);

      expect(revisions.snapshot).not.toHaveBeenCalled();
    });

    it("reports a section that was never seeded", async () => {
      model.findOne.mockReturnValue(query(null));

      await expect(
        service.updateSection("home", "welcome", VALID_WELCOME, "507f1f77bcf86cd799439011"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("snapshots the previous state before writing", async () => {
      const existing = storedSection("welcome", VALID_WELCOME);
      model.findOne.mockReturnValue(query(existing));

      await service.updateSection(
        "home",
        "welcome",
        { ...VALID_WELCOME, heading: "A new heading" },
        "507f1f77bcf86cd799439011",
      );

      // Snapshotting after the write would store the new state and make the
      // history useless for undoing.
      expect(revisions.snapshot).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: "page-section", snapshot: VALID_WELCOME }),
      );
    });

    it("saves the validated values", async () => {
      const existing = storedSection("welcome", VALID_WELCOME);
      model.findOne.mockReturnValue(query(existing));

      await service.updateSection(
        "home",
        "welcome",
        { ...VALID_WELCOME, heading: "A new heading" },
        "507f1f77bcf86cd799439011",
      );

      expect(existing.data).toMatchObject({ heading: "A new heading" });
      expect(existing.save).toHaveBeenCalled();
    });

    it("records the change in the audit trail", async () => {
      model.findOne.mockReturnValue(query(storedSection("welcome", VALID_WELCOME)));

      await service.updateSection("home", "welcome", VALID_WELCOME, "507f1f77bcf86cd799439011");

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "update", entityType: "page-section" }),
      );
    });
  });

  describe("restoring a version", () => {
    it("reports a section that does not exist", async () => {
      model.findOne.mockReturnValue(query(null));

      await expect(
        service.restoreSection("home", "welcome", 1, "507f1f77bcf86cd799439011"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("refuses a snapshot that no longer fits the current schema", async () => {
      model.findOne.mockReturnValue(query(storedSection("welcome", VALID_WELCOME)));
      revisions.snapshotFor.mockResolvedValue({ heading: "Only a heading" });

      // A snapshot predates the schema it is restored into. Writing it back
      // unchecked would break the page it belongs to.
      await expect(
        service.restoreSection("home", "welcome", 1, "507f1f77bcf86cd799439011"),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("restores a snapshot that still validates", async () => {
      const existing = storedSection("welcome", { ...VALID_WELCOME, heading: "Current" });
      model.findOne.mockReturnValue(query(existing));
      revisions.snapshotFor.mockResolvedValue(VALID_WELCOME);

      await service.restoreSection("home", "welcome", 1, "507f1f77bcf86cd799439011");

      expect(existing.data).toMatchObject({ heading: "Welcome to Kedland" });
    });

    it("snapshots the restore itself, so an unwanted restore is also undoable", async () => {
      model.findOne.mockReturnValue(query(storedSection("welcome", { ...VALID_WELCOME, heading: "X" })));
      revisions.snapshotFor.mockResolvedValue(VALID_WELCOME);

      await service.restoreSection("home", "welcome", 1, "507f1f77bcf86cd799439011");
      expect(revisions.snapshot).toHaveBeenCalled();
    });
  });

  describe("the page list", () => {
    it("names every registered page", async () => {
      const pages = await service.listPages();

      expect(pages.length).toBeGreaterThanOrEqual(14);
      expect(pages.map((p) => p.page)).toContain("home");
    });

    it("counts the sections each page has stored", async () => {
      model.aggregate.mockResolvedValue([{ _id: "home", count: 8 }]);

      const pages = await service.listPages();
      expect(pages.find((p) => p.page === "home")?.sectionCount).toBe(8);
    });

    it("reports zero for a page with nothing seeded yet", async () => {
      const pages = await service.listPages();
      expect(pages.find((p) => p.page === "privacy")?.sectionCount).toBe(0);
    });
  });

  describe("seeding", () => {
    it("upserts, so re-running changes nothing", async () => {
      await service.upsert("home", "hero", 0, { heading: "x" });

      expect(model.updateOne).toHaveBeenCalledWith(
        { page: "home", key: "hero" },
        expect.objectContaining({ $set: expect.objectContaining({ order: 0 }) }),
        { upsert: true },
      );
    });

    it("reports whether a section is already present", async () => {
      await expect(service.exists("home", "hero")).resolves.toBe(false);

      model.exists.mockResolvedValue({ _id: "1" });
      await expect(service.exists("home", "hero")).resolves.toBe(true);
    });

    it("backfills a new optional image without replacing existing intro copy", async () => {
      const section = storedSection("intro", {
        eyebrow: "ABOUT KEDLAND",
        heading: "About Kedland",
        standfirst: "A community built on kindness, curiosity and care.",
      });
      model.findOne.mockReturnValue(query(section));

      await expect(
        service.backfillMissingImage("about", "intro", {
          mediaId: "placeholder-hero",
          alt: "A bright Kedland classroom",
        }),
      ).resolves.toBe(true);

      expect(section.data).toEqual(
        expect.objectContaining({
          heading: "About Kedland",
          image: expect.objectContaining({ mediaId: "placeholder-hero" }),
        }),
      );
      expect(section.save).toHaveBeenCalled();
      expect(revalidate.page).toHaveBeenCalledWith("about");
    });

    it("preserves an image an editor has already chosen", async () => {
      const section = storedSection("intro", {
        eyebrow: "ABOUT KEDLAND",
        heading: "About Kedland",
        standfirst: "A community built on kindness, curiosity and care.",
        image: { mediaId: "editor-choice", alt: "An editor supplied image" },
      });
      model.findOne.mockReturnValue(query(section));

      await expect(
        service.backfillMissingImage("about", "intro", {
          mediaId: "placeholder-hero",
          alt: "A starter classroom",
        }),
      ).resolves.toBe(false);

      expect(section.save).not.toHaveBeenCalled();
      expect(revalidate.page).not.toHaveBeenCalled();
    });
  });
});
