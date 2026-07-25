import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";
import { Types } from "mongoose";

import { AuditService } from "../audit/audit.service";

import { EnquiriesService } from "./enquiries.service";
import { MailService } from "./mail.service";
import { Enquiry } from "./schemas/enquiry.schema";

import type { EnquiryInput } from "@kedland/types";

interface QueryChain {
  exec: jest.Mock;
  sort: jest.Mock;
}

function query<T>(result: T): QueryChain {
  const chain = {
    exec: jest.fn().mockResolvedValue(result),
    sort: jest.fn(),
  };
  chain.sort.mockReturnValue(chain);
  return chain;
}

const INPUT: EnquiryInput = {
  parentName: "Ama Mensah",
  email: "ama@example.com",
  phone: "+233 24 123 4567",
  topic: "book-a-tour",
  level: "nursery-2",
  message: "I would like to book a tour.",
};

const ACTOR = new Types.ObjectId().toHexString();

/** A stored enquiry document, with the methods the service calls on it. */
function storedEnquiry(overrides: Record<string, unknown> = {}) {
  return {
    id: "enquiry-1",
    parentName: INPUT.parentName,
    email: INPUT.email,
    phone: INPUT.phone,
    topic: INPUT.topic,
    level: INPUT.level,
    message: INPUT.message,
    status: "new",
    notified: true,
    createdAt: new Date("2026-02-01T09:00:00Z"),
    handledAt: null as Date | null,
    handledById: null as Types.ObjectId | null,
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("EnquiriesService", () => {
  let service: EnquiriesService;
  let model: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    updateOne: jest.Mock;
    countDocuments: jest.Mock;
  };
  let mail: { sendEnquiry: jest.Mock };
  let audit: { record: jest.Mock };

  beforeEach(async () => {
    model = {
      create: jest.fn().mockResolvedValue({ _id: "oid", id: "enquiry-1" }),
      find: jest.fn().mockReturnValue(query([])),
      findById: jest.fn().mockReturnValue(query(null)),
      updateOne: jest.fn().mockReturnValue(query({})),
      countDocuments: jest.fn().mockReturnValue(query(0)),
    };
    mail = { sendEnquiry: jest.fn().mockResolvedValue(true) };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EnquiriesService,
        { provide: getModelToken(Enquiry.name), useValue: model },
        { provide: MailService, useValue: mail },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = moduleRef.get(EnquiriesService);
  });

  describe("submit", () => {
    it("saves the enquiry and reports it delivered", async () => {
      const result = await service.submit(INPUT);

      expect(result).toEqual({ id: "enquiry-1", notified: true });
      expect(model.updateOne).toHaveBeenCalledWith({ _id: "oid" }, { $set: { notified: true } });
    });

    /**
     * The reason the order is persist-then-send. If this ever inverts, a
     * Resend outage silently loses a family's message and nobody finds out.
     */
    it("keeps the enquiry when the school cannot be emailed", async () => {
      mail.sendEnquiry.mockResolvedValue(false);

      const result = await service.submit(INPUT);

      expect(model.create).toHaveBeenCalled();
      expect(result.notified).toBe(false);
      // Left as `notified: false` so the dashboard can surface it.
      expect(model.updateOne).not.toHaveBeenCalled();
    });

    it("saves before it sends, not after", async () => {
      const order: string[] = [];
      model.create.mockImplementation(() => {
        order.push("create");
        return Promise.resolve({ _id: "oid", id: "enquiry-1" });
      });
      mail.sendEnquiry.mockImplementation(() => {
        order.push("send");
        return Promise.resolve(true);
      });

      await service.submit(INPUT);

      expect(order).toEqual(["create", "send"]);
    });

    it("never stores the Turnstile token", async () => {
      await service.submit({ ...INPUT, turnstileToken: "a-single-use-token" });

      const [written] = model.create.mock.calls[0] as [Record<string, unknown>];
      expect(written).not.toHaveProperty("turnstileToken");
    });
  });

  describe("list", () => {
    it("returns everything when no status is given", async () => {
      model.find.mockReturnValue(query([storedEnquiry()]));

      const found = await service.list();

      expect(model.find).toHaveBeenCalledWith({});
      expect(found[0]).toMatchObject({ parentName: "Ama Mensah", status: "new" });
    });

    it("filters by status when one is", async () => {
      await service.list("archived");
      expect(model.find).toHaveBeenCalledWith({ status: "archived" });
    });

    it("serialises dates as ISO strings", async () => {
      model.find.mockReturnValue(query([storedEnquiry()]));

      const [first] = await service.list();

      expect(first?.createdAt).toBe("2026-02-01T09:00:00.000Z");
    });
  });

  describe("findOne", () => {
    it("rejects an id that is not an ObjectId without querying", async () => {
      await expect(service.findOne("not-an-id")).rejects.toThrow(NotFoundException);
      expect(model.findById).not.toHaveBeenCalled();
    });

    it("reports a missing enquiry as not found", async () => {
      await expect(service.findOne(new Types.ObjectId().toHexString())).rejects.toThrow(NotFoundException);
    });
  });

  describe("setStatus", () => {
    it("records who dealt with it and when", async () => {
      const document = storedEnquiry();
      model.findById.mockReturnValue(query(document));

      await service.setStatus(new Types.ObjectId().toHexString(), "replied", ACTOR);

      expect(document.status).toBe("replied");
      expect(document.handledAt).toBeInstanceOf(Date);
      expect(document.handledById?.toHexString()).toBe(ACTOR);
    });

    /**
     * Returning to `new` must clear the handler too — otherwise the record
     * claims somebody replied when the office has just reopened it.
     */
    it("clears the handler when an enquiry goes back to new", async () => {
      const document = storedEnquiry({
        status: "replied",
        handledAt: new Date(),
        handledById: new Types.ObjectId(),
      });
      model.findById.mockReturnValue(query(document));

      await service.setStatus(new Types.ObjectId().toHexString(), "new", ACTOR);

      expect(document.handledAt).toBeNull();
      expect(document.handledById).toBeNull();
    });

    it("writes an audit entry", async () => {
      model.findById.mockReturnValue(query(storedEnquiry()));

      await service.setStatus(new Types.ObjectId().toHexString(), "read", ACTOR);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "update", entityType: "enquiry" }),
      );
    });
  });

  describe("remove", () => {
    it("refuses an editor", async () => {
      await expect(service.remove(new Types.ObjectId().toHexString(), ACTOR, "editor")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("does not even look the enquiry up before refusing", async () => {
      await service.remove(new Types.ObjectId().toHexString(), ACTOR, "editor").catch(() => undefined);

      expect(model.findById).not.toHaveBeenCalled();
    });

    it("lets an administrator erase one, and records that it happened", async () => {
      const document = storedEnquiry();
      model.findById.mockReturnValue(query(document));

      await service.remove(new Types.ObjectId().toHexString(), ACTOR, "admin");

      expect(document.deleteOne).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "delete", entityType: "enquiry" }),
      );
    });

    it("keeps the parent's message out of the audit trail", async () => {
      model.findById.mockReturnValue(query(storedEnquiry()));

      await service.remove(new Types.ObjectId().toHexString(), ACTOR, "admin");

      // Erasing a message and then keeping a copy of it in the audit log would
      // defeat the point of the erasure.
      const [entry] = audit.record.mock.calls[0] as [Record<string, unknown>];
      expect(JSON.stringify(entry)).not.toContain(INPUT.message);
    });
  });

  describe("counts", () => {
    it("counts the unread and the undelivered separately", async () => {
      model.countDocuments.mockReturnValueOnce(query(3)).mockReturnValueOnce(query(1));

      expect(await service.counts()).toEqual({ unread: 3, undelivered: 1 });
      expect(model.countDocuments).toHaveBeenCalledWith({ status: "new" });
      expect(model.countDocuments).toHaveBeenCalledWith({ notified: false });
    });
  });
});
