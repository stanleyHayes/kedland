import { NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { MAX_REVISIONS_PER_ENTITY, RevisionsService } from "./revisions.service";
import { Revision } from "./schemas/revision.schema";

/**
 * A chainable stub standing in for a Mongoose query.
 *
 * Typed as an interface rather than `Record<string, jest.Mock>`: an index
 * signature would force bracket access under `noPropertyAccessFromIndexSignature`,
 * and the self-reference in `jest.fn(() => chain)` needs a declared type to
 * break the inference cycle.
 */
interface QueryChain {
  sort: jest.Mock;
  limit: jest.Mock;
  select: jest.Mock;
  exec: jest.Mock;
}

function query<T>(result: T): QueryChain {
  const chain: QueryChain = {
    sort: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    select: jest.fn(() => chain),
    exec: jest.fn().mockResolvedValue(result),
  };
  return chain;
}

/** The model methods this service touches. Inferred, so property access on the
 *  mock stays type-safe under `noPropertyAccessFromIndexSignature`. */
function makeModel() {
  return {
    create: jest.fn().mockResolvedValue({ version: 1 }),
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    deleteMany: jest.fn(),
  };
}

describe("RevisionsService", () => {
  let service: RevisionsService;
  let model: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    model = makeModel();

    const moduleRef = await Test.createTestingModule({
      providers: [RevisionsService, { provide: getModelToken(Revision.name), useValue: model }],
    }).compile();

    service = moduleRef.get(RevisionsService);
  });

  describe("snapshot", () => {
    beforeEach(() => {
      model.countDocuments.mockReturnValue(query(1));
    });

    it("starts at version 1 for a document with no history", async () => {
      model.findOne.mockReturnValue(query(null));

      await service.snapshot({ entityType: "post", entityId: "abc", snapshot: { title: "Old" } });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ version: 1 }));
    });

    it("increments from the latest version", async () => {
      model.findOne.mockReturnValue(query({ version: 7 }));

      await service.snapshot({ entityType: "post", entityId: "abc", snapshot: {} });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ version: 8 }));
    });

    it("stores the snapshot it was handed", async () => {
      model.findOne.mockReturnValue(query(null));
      const snapshot = { title: "Sports day", body: "The old text" };

      await service.snapshot({ entityType: "post", entityId: "abc", snapshot });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ snapshot }));
    });

    it("records who made the change", async () => {
      model.findOne.mockReturnValue(query(null));

      await service.snapshot({
        entityType: "post",
        entityId: "abc",
        snapshot: {},
        createdById: "507f1f77bcf86cd799439011",
      });

      const written = model.create.mock.calls[0]?.[0] as { createdById: unknown };
      expect(written.createdById).not.toBeNull();
    });

    it("accepts an anonymous change", async () => {
      model.findOne.mockReturnValue(query(null));

      await service.snapshot({ entityType: "settings", entityId: "site", snapshot: {} });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ createdById: null }));
    });

    it("keeps history bounded", async () => {
      model.findOne.mockReturnValue(query({ version: 25 }));
      model.countDocuments.mockReturnValue(query(MAX_REVISIONS_PER_ENTITY + 3));
      model.find.mockReturnValue(query([{ _id: "a" }, { _id: "b" }, { _id: "c" }]));
      model.deleteMany.mockReturnValue(query({}));

      await service.snapshot({ entityType: "post", entityId: "abc", snapshot: {} });

      // Three over the cap, so the three oldest go.
      expect(model.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["a", "b", "c"] } });
    });

    it("prunes nothing while under the cap", async () => {
      model.findOne.mockReturnValue(query(null));
      model.countDocuments.mockReturnValue(query(3));

      await service.snapshot({ entityType: "post", entityId: "abc", snapshot: {} });

      expect(model.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("reading history", () => {
    it("lists newest first", async () => {
      const chain = query([]);
      model.find.mockReturnValue(chain);

      await service.list("post", "abc");

      expect(chain.sort).toHaveBeenCalledWith({ version: -1 });
    });

    it("finds a specific version", async () => {
      model.findOne.mockReturnValue(query({ version: 3, snapshot: { title: "Then" } }));

      const revision = await service.findVersion("post", "abc", 3);
      expect(revision.version).toBe(3);
    });

    it("reports a version that does not exist rather than returning nothing", async () => {
      model.findOne.mockReturnValue(query(null));

      await expect(service.findVersion("post", "abc", 99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns the stored state for a caller to write back", async () => {
      model.findOne.mockReturnValue(query({ version: 2, snapshot: { title: "Then" } }));

      await expect(service.snapshotFor("post", "abc", 2)).resolves.toEqual({ title: "Then" });
    });

    it("counts the versions of one document", async () => {
      model.countDocuments.mockReturnValue(query(4));

      await expect(service.countFor("post", "abc")).resolves.toBe(4);
    });
  });
});
