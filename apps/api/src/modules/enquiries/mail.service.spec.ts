import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { MailService } from "./mail.service";

import type { EnquiryInput } from "@kedland/types";

const CONFIGURED: Record<string, string> = {
  "mail.apiKey": "re_test_key",
  "mail.toSchool": "office@kedland.edu.gh",
  "mail.from": "Kedland <noreply@kedland.edu.gh>",
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
