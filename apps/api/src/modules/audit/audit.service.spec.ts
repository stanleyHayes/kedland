import { Logger } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { AuditService, redact } from "./audit.service";
import { AuditLog } from "./schemas/audit-log.schema";

describe("redact", () => {
  it("masks a password anywhere in the payload", () => {
    expect(redact({ email: "a@b.c", password: "hunter2" })).toEqual({
      email: "a@b.c",
      password: "[redacted]",
    });
  });

  it("masks regardless of key casing", () => {
    const result = redact({ Password: "x", PASSWORDHASH: "y", newPassword: "z" }) as Record<string, unknown>;

    expect(result["Password"]).toBe("[redacted]");
    expect(result["PASSWORDHASH"]).toBe("[redacted]");
    expect(result["newPassword"]).toBe("[redacted]");
  });

  it("masks tokens and secrets, not only passwords", () => {
    const result = redact({ token: "t", refreshToken: "r", apiKey: "k", secret: "s" }) as Record<
      string,
      unknown
    >;

    expect(Object.values(result)).toEqual(["[redacted]", "[redacted]", "[redacted]", "[redacted]"]);
  });

  it("reaches into nested objects", () => {
    const result = redact({ user: { profile: { password: "hunter2" } } }) as {
      user: { profile: { password: string } };
    };
    expect(result.user.profile.password).toBe("[redacted]");
  });

  it("reaches into arrays", () => {
    const result = redact({ users: [{ password: "a" }, { password: "b" }] }) as {
      users: { password: string }[];
    };
    expect(result.users.map((u) => u.password)).toEqual(["[redacted]", "[redacted]"]);
  });

  it("leaves ordinary values alone", () => {
    const input = { title: "Sports day", count: 3, published: true, cover: null };
    expect(redact(input)).toEqual(input);
  });

  it("passes primitives through untouched", () => {
    expect(redact("plain")).toBe("plain");
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });

  it("stops descending rather than looping forever on a cycle", () => {
    const cyclic: Record<string, unknown> = { name: "top" };
    cyclic["self"] = cyclic;

    // A depth cap is what keeps a self-referencing payload from hanging the
    // request it was meant to record.
    expect(() => redact(cyclic)).not.toThrow();
  });
});

describe("AuditService", () => {
  let service: AuditService;
  let model: { create: jest.Mock; find: jest.Mock; countDocuments: jest.Mock };

  beforeEach(async () => {
    model = {
      create: jest.fn().mockResolvedValue({}),
      find: jest.fn(),
      countDocuments: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AuditService, { provide: getModelToken(AuditLog.name), useValue: model }],
    }).compile();

    service = moduleRef.get(AuditService);
  });

  it("writes an entry", async () => {
    await service.record({ action: "publish", entityType: "post", entityId: "abc" });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "publish", entityType: "post", entityId: "abc" }),
    );
  });

  it("redacts secrets on the way in", async () => {
    await service.record({
      action: "update",
      entityType: "user",
      changes: { displayName: "Mary", password: "hunter2" },
    });

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ changes: { displayName: "Mary", password: "[redacted]" } }),
    );
  });

  it("hashes the caller's IP rather than storing it", async () => {
    await service.record({ action: "login", entityType: "auth", ip: "203.0.113.9" });

    const written = model.create.mock.calls[0]?.[0] as { ipHash: string };
    expect(written.ipHash).not.toContain("203.0.113.9");
    expect(written.ipHash).toHaveLength(32);
  });

  it("stores no IP hash when there is no IP", async () => {
    await service.record({ action: "login", entityType: "auth" });

    expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ ipHash: null }));
  });

  it("swallows a write failure rather than failing the operation it describes", async () => {
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    model.create.mockRejectedValueOnce(new Error("mongo is down"));

    // Losing the record of a published post is bad; refusing to publish
    // because the record could not be written is worse.
    await expect(service.record({ action: "publish", entityType: "post" })).resolves.toBeUndefined();
  });

  it("logs when it cannot write", async () => {
    const spy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    model.create.mockRejectedValueOnce(new Error("mongo is down"));

    await service.record({ action: "publish", entityType: "post" });
    expect(spy).toHaveBeenCalled();
  });

  it("records a mutating request from the interceptor", async () => {
    await service.recordRequest("507f1f77bcf86cd799439011", "POST /api/v1/posts", "203.0.113.9");

    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "request", entityId: "POST /api/v1/posts" }),
    );
  });

  it("returns a paginated envelope", async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ action: "login" }]),
    };
    model.find.mockReturnValue(chain);
    model.countDocuments.mockReturnValue({ exec: jest.fn().mockResolvedValue(25) });

    const result = await service.list(2, 10);

    expect(result).toMatchObject({ total: 25, page: 2, pageSize: 10, totalPages: 3 });
    expect(chain.skip).toHaveBeenCalledWith(10);
  });

  it("lists everything that happened to one document, newest first", async () => {
    const chain = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) };
    model.find.mockReturnValue(chain);

    await service.forEntity("post", "abc");

    expect(model.find).toHaveBeenCalledWith({ entityType: "post", entityId: "abc" });
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});
