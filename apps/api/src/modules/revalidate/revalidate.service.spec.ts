import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { RevalidateService } from "./revalidate.service";

const CONFIG: Record<string, string> = {
  "revalidate.webhookUrl": "https://kedland.edu.gh/api/revalidate",
  "revalidate.secret": "a-shared-secret",
};

/**
 * Telling the site to refresh.
 *
 * Every test here is about the same decision: a revalidation failure must never
 * fail the write that triggered it. The school must be able to save a correction
 * even when the site cannot be reached — the page refreshes within the hour
 * regardless, so a missed call costs staleness, not data.
 */
describe("RevalidateService", () => {
  let service: RevalidateService;
  let config: { get: jest.Mock };
  let fetchMock: jest.SpyInstance;

  beforeEach(async () => {
    config = { get: jest.fn((key: string) => CONFIG[key]) };

    const moduleRef = await Test.createTestingModule({
      providers: [RevalidateService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = moduleRef.get(RevalidateService);
    fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  /** The JSON body the site was sent. */
  function sentBody(): { tags: string[]; paths: string[] } {
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    return JSON.parse(init.body) as { tags: string[]; paths: string[] };
  }

  describe("post", () => {
    it("purges the post, the listing and the home page together", async () => {
      // Publishing changes all three. Purging them separately would mean
      // remembering all three at every call site.
      await service.post("sports-day");

      expect(sentBody().paths).toEqual(["/news/sports-day", "/news", "/"]);
      expect(sentBody().tags).toContain("posts");
    });

    it("authenticates itself to the site", async () => {
      await service.post("sports-day");

      const [, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
      expect(init.headers["x-revalidate-secret"]).toBe(CONFIG["revalidate.secret"]);
    });

    it("gives up rather than holding a save open", async () => {
      await service.post("sports-day");

      const [, init] = fetchMock.mock.calls[0] as [string, { signal: AbortSignal }];
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe("when it cannot be done", () => {
    /**
     * Reports the failure rather than throwing it. The caller decides what it
     * means: for most edits staleness is cosmetic, but `unpublish` needs to
     * know, because a failed purge there leaves withdrawn content readable.
     */
    it("reports failure rather than throwing when the site is unreachable", async () => {
      fetchMock.mockRejectedValue(new Error("ENOTFOUND"));

      await expect(service.post("sports-day")).resolves.toBe(false);
    });

    it("reports failure rather than throwing when the site refuses the call", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 401 });

      await expect(service.post("sports-day")).resolves.toBe(false);
    });

    it("reports success when the site confirms the purge", async () => {
      await expect(service.post("sports-day")).resolves.toBe(true);
    });

    /**
     * Expected in development, where there is no cache worth purging. It must
     * not look like a failure every time somebody saves.
     */
    it.each(["revalidate.webhookUrl", "revalidate.secret"])(
      "stays quiet and sends nothing when %s is absent",
      async (missing) => {
        config.get.mockImplementation((key: string) => (key === missing ? undefined : CONFIG[key]));

        await expect(service.post("sports-day")).resolves.toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );
  });

  describe("page", () => {
    it("purges one page's content by tag", async () => {
      await service.page("about/our-story");

      expect(sentBody().tags).toEqual(["content:about/our-story", "content"]);
    });
  });
});
