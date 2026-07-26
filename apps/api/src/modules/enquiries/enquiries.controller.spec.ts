import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";

import { ALL_PERMISSIONS, type Permission } from "@kedland/types";

import { AdminEnquiriesController, EnquiriesController } from "./enquiries.controller";
import { EnquiriesService } from "./enquiries.service";
import { TurnstileService } from "./turnstile.service";

import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const VALID = {
  parentName: "Ama Mensah",
  email: "ama@example.com",
  phone: "+233 24 123 4567",
  topic: "book-a-tour",
  level: "nursery-2",
  message: "I would like to book a tour.",
};

const IP = ["203", "0", "113", "7"].join(".");
const USER: AuthenticatedUser = {
  id: "507f1f77bcf86cd799439011",
  email: "a@b.c",
  roleSlug: "administrator",
  permissions: ALL_PERMISSIONS as Permission[],
};

describe("EnquiriesController", () => {
  let controller: EnquiriesController;
  let enquiries: { submit: jest.Mock };
  let turnstile: { verify: jest.Mock };

  beforeEach(async () => {
    enquiries = { submit: jest.fn().mockResolvedValue({ id: "e1", notified: true }) };
    turnstile = { verify: jest.fn().mockResolvedValue(true) };

    const moduleRef = await Test.createTestingModule({
      controllers: [EnquiriesController],
      providers: [
        { provide: EnquiriesService, useValue: enquiries },
        { provide: TurnstileService, useValue: turnstile },
      ],
    }).compile();

    controller = moduleRef.get(EnquiriesController);
  });

  it("accepts a valid enquiry", async () => {
    await expect(controller.submit(VALID, IP)).resolves.toEqual({ id: "e1", notified: true });
  });

  /**
   * The DTO is only there for Swagger; `enquirySchema` is what actually
   * enforces the contract, and it is the same schema the public site validates
   * against. This is the test that the controller really runs it.
   */
  it("rejects a body the shared schema refuses", async () => {
    await expect(controller.submit({ ...VALID, email: "not-an-email" }, IP)).rejects.toThrow(
      BadRequestException,
    );
    expect(enquiries.submit).not.toHaveBeenCalled();
  });

  it("names the field that was wrong, so the form can point at it", async () => {
    // Keyed by field rather than a flat list of sentences: the form needs to
    // put each message under the right input, not in one banner.
    const thrown = await controller
      .submit({ ...VALID, email: "nope" }, IP)
      .then(() => undefined)
      .catch((error: unknown) => error as BadRequestException);

    const response = thrown?.getResponse() as { errors: Record<string, string[]> };
    expect(Object.keys(response.errors)).toContain("email");
  });

  it("refuses a field the contract does not declare", async () => {
    // `strictObject`, so a child's date of birth cannot arrive through here
    // even if something tries to send one.
    await expect(controller.submit({ ...VALID, childDateOfBirth: "2021-04-02" }, IP)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("verifies the visitor is human before saving anything", async () => {
    turnstile.verify.mockResolvedValue(false);

    await expect(controller.submit(VALID, IP)).rejects.toThrow(BadRequestException);
    expect(enquiries.submit).not.toHaveBeenCalled();
  });

  it("passes the caller's IP to the Turnstile check", async () => {
    await controller.submit(VALID, IP);
    expect(turnstile.verify).toHaveBeenCalledWith(undefined, IP);
  });

  it("hands the token on when the form sent one", async () => {
    await controller.submit({ ...VALID, turnstileToken: "tok" }, IP);
    expect(turnstile.verify).toHaveBeenCalledWith("tok", IP);
  });
});

describe("AdminEnquiriesController", () => {
  let controller: AdminEnquiriesController;
  let enquiries: {
    list: jest.Mock;
    findOne: jest.Mock;
    setStatus: jest.Mock;
    remove: jest.Mock;
    counts: jest.Mock;
  };

  beforeEach(async () => {
    enquiries = {
      list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 0 }),
      findOne: jest.fn().mockResolvedValue({ id: "e1" }),
      setStatus: jest.fn().mockResolvedValue({ id: "e1", status: "read" }),
      remove: jest.fn().mockResolvedValue(undefined),
      counts: jest.fn().mockResolvedValue({ unread: 2, undelivered: 0 }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminEnquiriesController],
      providers: [{ provide: EnquiriesService, useValue: enquiries }],
    }).compile();

    controller = moduleRef.get(AdminEnquiriesController);
  });

  it("lists everything when no status is asked for", async () => {
    await controller.list();
    expect(enquiries.list).toHaveBeenCalledWith(undefined, 1);
  });

  it("filters when one is", async () => {
    await controller.list("replied");
    expect(enquiries.list).toHaveBeenCalledWith("replied", 1);
  });

  it("passes a requested page through", async () => {
    await controller.list(undefined, "4");
    expect(enquiries.list).toHaveBeenCalledWith(undefined, 4);
  });

  it.each(["0", "-2", "not-a-number", ""])("treats a page of %s as the first page", async (page) => {
    // All of these mean the same thing to somebody editing a URL by hand.
    await controller.list(undefined, page);
    expect(enquiries.list).toHaveBeenCalledWith(undefined, 1);
  });

  it("rejects a status outside the vocabulary rather than returning nothing", async () => {
    // Returning an empty list for a typo would read as "no enquiries", which
    // is a much worse answer than an error.
    await expect(controller.list("nonsense")).rejects.toThrow(BadRequestException);
  });

  it("returns the counts the dashboard badges with", async () => {
    await expect(controller.counts()).resolves.toEqual({ unread: 2, undelivered: 0 });
  });

  it("fetches one", async () => {
    await controller.findOne("e1");
    expect(enquiries.findOne).toHaveBeenCalledWith("e1");
  });

  it("records who moved an enquiry through triage", async () => {
    await controller.setStatus("e1", { status: "read" }, USER);
    expect(enquiries.setStatus).toHaveBeenCalledWith("e1", "read", USER.id);
  });

  /**
   * The route carries `@RequirePermission("enquiries", "delete")`, and that is
   * the only place the decision is made. The service used to re-check a role,
   * which was a second source of truth for the same question.
   */
  it("records who erased an enquiry, and leaves authorisation to the guard", async () => {
    await controller.remove("e1", USER);
    expect(enquiries.remove).toHaveBeenCalledWith("e1", USER.id);
  });
});
