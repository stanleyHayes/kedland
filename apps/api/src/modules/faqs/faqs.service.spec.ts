import { NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { FaqsService } from "./faqs.service";
import { Faq } from "./schemas/faq.schema";

interface Chain {
  exec: jest.Mock;
}

function query<T>(result: T): Chain {
  return { exec: jest.fn().mockResolvedValue(result) };
}

function storedFaq(overrides: Record<string, unknown> = {}) {
  return {
    id: "faq-1",
    group: "Admissions",
    question: "When do applications open?",
    answer: "Every January.",
    order: 1,
    published: true,
    createdAt: new Date("2026-03-01T09:00:00Z"),
    updatedAt: new Date("2026-03-02T09:00:00Z"),
    ...overrides,
  };
}

describe("FaqsService", () => {
  let service: FaqsService;
  let model: { findById: jest.Mock };

  beforeEach(async () => {
    model = { findById: jest.fn().mockReturnValue(query(null)) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        FaqsService,
        { provide: getModelToken(Faq.name), useValue: model },
        { provide: AuditService, useValue: { record: jest.fn() } },
        { provide: RevalidateService, useValue: { page: jest.fn(), faqs: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(FaqsService);
  });

  describe("findOne", () => {
    it("returns the dashboard shape for a known id", async () => {
      model.findById.mockReturnValue(query(storedFaq()));

      const item = await service.findOne("507f1f77bcf86cd799439011");

      expect(item).toMatchObject({
        id: "faq-1",
        question: "When do applications open?",
        updatedAt: "2026-03-02T09:00:00.000Z",
      });
    });

    it("reports an unknown id as not found", async () => {
      await expect(service.findOne("507f1f77bcf86cd799439011")).rejects.toThrow(NotFoundException);
    });

    it("rejects a malformed id without asking the database", async () => {
      await expect(service.findOne("not-an-id")).rejects.toThrow(NotFoundException);
      expect(model.findById).not.toHaveBeenCalled();
    });
  });
});
