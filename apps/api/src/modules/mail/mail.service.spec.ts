import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { MailService } from "./mail.service";

import type { EnquiryInput } from "@kedland/types";

const CONFIGURED: Record<string, string> = {
  "mail.apiKey": "re_test_key",
  "mail.toSchool": "office@kedland.edu.gh",
  "mail.from": "Kedland <noreply@kedland.edu.gh>",
  "mail.dashboardUrl": "https://dashboard.kedland.edu.gh",
};

const ENQUIRY: EnquiryInput = {
  parentName: "Ama Mensah",
  email: "ama@example.com",
  phone: "+233 24 123 4567",
  topic: "book-a-tour",
  level: "nursery-2",
  message: "I would like to book a tour for my daughter.",
};

/** The shape this service posts to Resend. `html` is absent by design. */
interface ResendPayload {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  html?: string;
}

/** The body Resend was actually asked to send. */
function sentPayload(fetchMock: jest.SpyInstance): ResendPayload {
  const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
  return JSON.parse(init.body) as ResendPayload;
}

describe("MailService", () => {
  let service: MailService;
  let config: { get: jest.Mock };
  let fetchMock: jest.SpyInstance;

  beforeEach(async () => {
    config = { get: jest.fn((key: string) => CONFIGURED[key]) };

    const moduleRef = await Test.createTestingModule({
      providers: [MailService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = moduleRef.get(MailService);
    fetchMock = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it("reports the school told when Resend accepts it", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await expect(service.sendEnquiry(ENQUIRY)).resolves.toBe(true);
  });

  /**
   * Never throws. The enquiry is already saved by the time this runs, and an
   * exception here would surface to the parent as "your message failed" when
   * in fact the school has it.
   */
  it("reports failure rather than throwing when Resend refuses", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 422 });

    await expect(service.sendEnquiry(ENQUIRY)).resolves.toBe(false);
  });

  it("reports failure rather than throwing when Resend is unreachable", async () => {
    fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(service.sendEnquiry(ENQUIRY)).resolves.toBe(false);
  });

  it.each(["mail.apiKey", "mail.toSchool", "mail.from"])(
    "sends nothing at all when %s is missing",
    async (missing) => {
      config.get.mockImplementation((key: string) => (key === missing ? undefined : CONFIGURED[key]));

      await expect(service.sendEnquiry(ENQUIRY)).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("sets reply-to to the parent, so the office can just hit reply", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await service.sendEnquiry(ENQUIRY);

    expect(sentPayload(fetchMock).reply_to).toBe(ENQUIRY.email);
  });

  it("leads the subject with the topic, so the inbox list is triageable", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await service.sendEnquiry(ENQUIRY);

    expect(sentPayload(fetchMock).subject).toBe("Book a tour — Ama Mensah");
  });

  /**
   * The reason this email is plain text. A parent's message is untrusted input
   * arriving in the school's inbox; with no HTML part there is no markup
   * context for it to escape into, so there is nothing to get wrong.
   */
  it("sends plain text with no HTML part", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await service.sendEnquiry(ENQUIRY);
    const payload = sentPayload(fetchMock);

    expect(payload).not.toHaveProperty("html");
    expect(typeof payload.text).toBe("string");
  });

  it("does not interpret markup in a parent's message", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    const message = "<script>alert(1)</script> Please call me";
    await service.sendEnquiry({ ...ENQUIRY, message });

    const payload = sentPayload(fetchMock);
    // Carried through verbatim as text — readable, and inert.
    expect(payload.text).toContain(message);
    expect(payload).not.toHaveProperty("html");
  });

  it("spells the level out rather than sending the code", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await service.sendEnquiry(ENQUIRY);

    expect(payloadText(fetchMock)).toContain("Nursery 2");
  });

  it("includes every detail the office needs to reply", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });

    await service.sendEnquiry(ENQUIRY);
    const text = payloadText(fetchMock);

    expect(text).toContain(ENQUIRY.parentName);
    expect(text).toContain(ENQUIRY.email);
    expect(text).toContain(ENQUIRY.phone);
    expect(text).toContain(ENQUIRY.message);
  });
});

function payloadText(fetchMock: jest.SpyInstance): string {
  return sentPayload(fetchMock).text;
}

describe("MailService — staff invitations", () => {
  let service: MailService;
  let config: { get: jest.Mock };
  let fetchMock: jest.SpyInstance;
  let settings: Record<string, string>;

  beforeEach(async () => {
    settings = { ...CONFIGURED };
    // Reads `settings` at call time, so a test that swaps it mid-run is seen.
    config = { get: jest.fn((key: string) => settings[key]) };

    const moduleRef = await Test.createTestingModule({
      providers: [MailService, { provide: ConfigService, useValue: config }],
    }).compile();

    service = moduleRef.get(MailService);
    fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, status: 200 } as Response);
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  const INVITATION = { to: "mary@kedland.edu.gh", displayName: "Mary Owusu", token: "abc123" };

  /** The configuration minus one key, without deleting a computed property. */
  const without = (key: string): Record<string, string> =>
    Object.fromEntries(Object.entries(CONFIGURED).filter(([name]) => name !== key));

  describe("isConfigured", () => {
    it("is true with a key, a sender and a dashboard address", () => {
      expect(service.isConfigured()).toBe(true);
    });

    /**
     * The dashboard URL counts. An invitation without a link in it is not an
     * invitation, so claiming mail works when it is missing would let the API
     * create an account nobody can ever sign in to.
     */
    it.each(["mail.apiKey", "mail.from", "mail.dashboardUrl"])("is false without %s", (key) => {
      Reflect.deleteProperty(settings, key);
      expect(service.isConfigured()).toBe(false);
    });

    /** The school's own address is for enquiries, not for inviting staff. */
    it("does not require the school's inbox address", () => {
      settings = without("mail.toSchool");
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe("sendInvitation", () => {
    it("sends the invitee a link carrying their token", async () => {
      await service.sendInvitation(INVITATION);

      const [, init] = fetchMock.mock.calls[0];
      const payload = JSON.parse(init.body) as { to: string[]; text: string; html?: string };

      expect(payload.to).toEqual(["mary@kedland.edu.gh"]);
      expect(payload.text).toContain("https://dashboard.kedland.edu.gh/password/reset?token=abc123");
    });

    /** Same reasoning as the enquiry email: no HTML context to escape into. */
    it("sends plain text only", async () => {
      await service.sendInvitation(INVITATION);

      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.parse(init.body)).not.toHaveProperty("html");
    });

    it("addresses the invitee by name", async () => {
      await service.sendInvitation(INVITATION);

      const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
      expect((JSON.parse(init.body) as { text: string }).text).toContain("Mary Owusu");
    });

    /**
     * A trailing slash in the environment variable must not produce a double
     * slash in the link — some hosts treat `//password` as a different path.
     */
    it("tolerates a dashboard URL with trailing slashes", async () => {
      settings["mail.dashboardUrl"] = "https://dashboard.kedland.edu.gh///";
      await service.sendInvitation(INVITATION);

      const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
      expect((JSON.parse(init.body) as { text: string }).text).toContain(
        "https://dashboard.kedland.edu.gh/password/reset",
      );
    });

    it("percent-encodes a token with URL-unsafe characters in it", async () => {
      await service.sendInvitation({ ...INVITATION, token: "a+b/c=" });

      const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
      expect((JSON.parse(init.body) as { text: string }).text).toContain("token=a%2Bb%2Fc%3D");
    });

    /**
     * Throws, unlike `sendEnquiry`, which logs and returns false. An enquiry is
     * already saved when delivery is attempted; an invitation is the only thing
     * standing between the new person and an account they cannot use.
     */
    it("throws when Resend refuses it", async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 422 });

      await expect(service.sendInvitation(INVITATION)).rejects.toThrow(/422/);
    });

    it("throws rather than sending nowhere when mail is unconfigured", async () => {
      settings = without("mail.dashboardUrl");

      await expect(service.sendInvitation(INVITATION)).rejects.toThrow(/not configured/);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
