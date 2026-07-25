import { ValidationPipe, VersioningType, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { SeedService } from "../src/database/seeds/seed.service";
import { UsersService } from "../src/modules/users/users.service";

import type { Server } from "node:http";

/**
 * The content model end to end: seed it, read it publicly, edit it as staff,
 * and undo the edit.
 *
 * Everything here runs against a real MongoDB. The point of the section
 * registry is that the *database* cannot introduce structure, so a test that
 * mocked the database would be testing nothing.
 */
const PASSWORD = "correct-horse-battery-staple";

describe("Content (e2e)", () => {
  let app: INestApplication;
  let server: Server;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    server = app.getHttpServer() as Server;

    // Seed the packaged copy, then sign in as staff for the write tests.
    await app.get(SeedService).run({ force: true });

    const email = `content-${String(Date.now())}@kedland.edu.gh`;
    await app.get(UsersService).create({ email, password: PASSWORD, displayName: "Editor", role: "admin" });

    const { body } = await request(server).post("/api/v1/auth/login").send({ email, password: PASSWORD });
    accessToken = body.accessToken as string;
  });

  afterAll(async () => {
    await app.close();
  });

  function auth(req: request.Test): request.Test {
    return req.set("Authorization", `Bearer ${accessToken}`);
  }

  describe("reading a page", () => {
    it("is public — a parent has no account", async () => {
      await request(server).get("/api/v1/content?page=home").expect(200);
    });

    it("returns the home page's sections in registry order", async () => {
      const { body } = await request(server).get("/api/v1/content?page=home").expect(200);

      expect(body.map((s: { key: string }) => s.key)).toEqual([
        "hero",
        "welcome",
        "why-cards",
        "levels",
        "values",
        "principal",
        "instagram",
        "cta-banner",
      ]);
    });

    it("serves the school's approved copy", async () => {
      const { body } = await request(server).get("/api/v1/content?page=home").expect(200);
      const hero = body.find((s: { key: string }) => s.key === "hero") as {
        data: { heading: string };
      };

      expect(hero.data.heading).toBe("Where little Stars learn, play, and shine.");
    });

    it("serves a nested page key", async () => {
      const { body } = await request(server).get("/api/v1/content?page=academics/early-years").expect(200);

      const eyfs = body.find((s: { key: string }) => s.key === "eyfs") as {
        data: { areas: unknown[] };
      };
      expect(eyfs.data.areas).toHaveLength(7);
    });

    it("404s on a page that is not in the registry", async () => {
      await request(server).get("/api/v1/content?page=not-a-page").expect(404);
    });

    it("404s when no page is given at all", async () => {
      await request(server).get("/api/v1/content").expect(404);
    });
  });

  describe("editing a section", () => {
    it("requires a signed-in user", async () => {
      await request(server)
        .patch("/api/v1/admin/content/sections/welcome?page=home")
        .send({ data: {} })
        .expect(401);
    });

    it("accepts a valid change", async () => {
      const { body: before } = await request(server).get("/api/v1/content?page=home");
      const welcome = before.find((s: { key: string }) => s.key === "welcome") as {
        data: Record<string, unknown>;
      };

      await auth(request(server).patch("/api/v1/admin/content/sections/welcome?page=home"))
        .send({ data: { ...welcome.data, heading: "Welcome to our school" } })
        .expect(200);

      const { body: after } = await request(server).get("/api/v1/content?page=home");
      const updated = after.find((s: { key: string }) => s.key === "welcome") as {
        data: { heading: string };
      };
      expect(updated.data.heading).toBe("Welcome to our school");
    });

    it("rejects a change that breaks the section's schema", async () => {
      const response = await auth(request(server).patch("/api/v1/admin/content/sections/hero?page=home"))
        .send({ data: { heading: "Only a heading, missing everything else" } })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it("rejects an unknown field rather than storing dead data", async () => {
      const { body } = await request(server).get("/api/v1/content?page=home");
      const hero = body.find((s: { key: string }) => s.key === "hero") as {
        data: Record<string, unknown>;
      };

      await auth(request(server).patch("/api/v1/admin/content/sections/hero?page=home"))
        .send({ data: { ...hero.data, headline: "a typo for heading" } })
        .expect(400);
    });

    it("refuses to add a section the registry does not define", async () => {
      // This is the guardrail: the database cannot grow new structure.
      await auth(request(server).patch("/api/v1/admin/content/sections/surprise?page=home"))
        .send({ data: { heading: "Hello" } })
        .expect(404);
    });

    it("holds the KEDLAND tiles to exactly seven", async () => {
      const { body } = await request(server).get("/api/v1/content?page=home");
      const values = body.find((s: { key: string }) => s.key === "values") as {
        data: { tiles: unknown[]; heading: string; cta: unknown };
      };

      await auth(request(server).patch("/api/v1/admin/content/sections/values?page=home"))
        .send({ data: { ...values.data, tiles: values.data.tiles.slice(0, 5) } })
        .expect(400);
    });

    it("refuses an external link on a call to action", async () => {
      const { body } = await request(server).get("/api/v1/content?page=home");
      const banner = body.find((s: { key: string }) => s.key === "cta-banner") as {
        data: Record<string, unknown>;
      };

      await auth(request(server).patch("/api/v1/admin/content/sections/cta-banner?page=home"))
        .send({
          data: { ...banner.data, primaryCta: { label: "Enrol", href: "https://example.com/phish" } },
        })
        .expect(400);
    });
  });

  describe("undoing an edit", () => {
    it("restores the previous version", async () => {
      const { body: original } = await request(server).get("/api/v1/content?page=about/our-story");
      const story = original.find((s: { key: string }) => s.key === "story") as {
        data: { heading: string; body: string };
      };
      const originalHeading = story.data.heading;

      await auth(request(server).patch("/api/v1/admin/content/sections/story?page=about/our-story"))
        .send({ data: { ...story.data, heading: "A mistaken heading" } })
        .expect(200);

      await auth(request(server).post("/api/v1/admin/content/sections/story/restore?page=about/our-story"))
        .send({ version: 1 })
        .expect(201);

      const { body: restored } = await request(server).get("/api/v1/content?page=about/our-story");
      const after = restored.find((s: { key: string }) => s.key === "story") as {
        data: { heading: string };
      };
      expect(after.data.heading).toBe(originalHeading);
    });

    it("reports a version that does not exist", async () => {
      await auth(request(server).post("/api/v1/admin/content/sections/welcome/restore?page=home"))
        .send({ version: 999 })
        .expect(404);
    });
  });

  describe("the dashboard's page list", () => {
    it("names every page and counts its sections", async () => {
      const { body } = await auth(request(server).get("/api/v1/admin/content")).expect(200);

      expect(body.length).toBeGreaterThanOrEqual(14);
      const home = body.find((p: { page: string }) => p.page === "home") as { sectionCount: number };
      expect(home.sectionCount).toBe(8);
    });

    it("is not public", async () => {
      await request(server).get("/api/v1/admin/content").expect(401);
    });
  });
});
