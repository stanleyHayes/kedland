import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { setValidatedEnv, type Env } from "../../config/env.validation";
import { ContentService } from "../../modules/content/content.service";
import { RolesService } from "../../modules/roles/roles.service";
import { UsersService } from "../../modules/users/users.service";

import { SeedService } from "./seed.service";

/**
 * Roles, as the seed uses them: ensure the system three exist, then read the
 * administrator's permissions back out rather than hardcoding them.
 */
function stubRoles(): { ensureSystemRoles: jest.Mock; permissionsForSlug: jest.Mock } {
  return {
    ensureSystemRoles: jest.fn().mockResolvedValue({ created: ["administrator", "editor", "organisation"] }),
    permissionsForSlug: jest.fn().mockResolvedValue(["users:read", "users:update"]),
  };
}

describe("SeedService", () => {
  let service: SeedService;
  let users: { count: jest.Mock; create: jest.Mock };
  let roles: ReturnType<typeof stubRoles>;
  let content: { exists: jest.Mock; upsert: jest.Mock };
  let env: Partial<Env>;

  beforeEach(async () => {
    users = { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}) };
    roles = stubRoles();
    content = { exists: jest.fn().mockResolvedValue(false), upsert: jest.fn().mockResolvedValue(undefined) };
    env = {
      SEED_ADMIN_EMAIL: "admin@kedland.edu.gh",
      SEED_ADMIN_PASSWORD: "a-long-enough-seed-password",
    };
    setValidatedEnv(env as Env);

    const moduleRef = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: UsersService, useValue: users },
        { provide: RolesService, useValue: roles },
        { provide: ContentService, useValue: content },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    service = moduleRef.get(SeedService);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setValidatedEnv(undefined);
  });

  it("creates the first administrator on an empty database", async () => {
    const summary = await service.run({ force: false });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@kedland.edu.gh",
        roleSlug: "administrator",
        // Read from the role rather than hardcoded, so there is one definition
        // of what an administrator may do.
        permissions: ["users:read", "users:update"],
      }),
    );
    expect(summary["users"]).toContain("created");
  });

  it("does nothing when accounts already exist", async () => {
    users.count.mockResolvedValue(3);

    const summary = await service.run({ force: false });

    expect(users.create).not.toHaveBeenCalled();
    expect(summary["users"]).toContain("skipped");
  });

  it("still does nothing with --force", async () => {
    users.count.mockResolvedValue(1);

    // `--force` is for re-seeding content. Re-running it must never resurrect a
    // deleted account or reset a password someone has since changed.
    await service.run({ force: true });

    expect(users.create).not.toHaveBeenCalled();
  });

  it("skips loudly when the seed credentials are absent", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    setValidatedEnv({ ...env, SEED_ADMIN_EMAIL: undefined } as Env);

    const summary = await service.run({ force: false });

    expect(users.create).not.toHaveBeenCalled();
    expect(summary["users"]).toContain("SEED_ADMIN_EMAIL");
    // Silence here would leave someone with a database and no way in.
    expect(warn).toHaveBeenCalled();
  });

  it("treats an empty password as absent", async () => {
    setValidatedEnv({ ...env, SEED_ADMIN_PASSWORD: "" } as Env);

    await service.run({ force: false });
    expect(users.create).not.toHaveBeenCalled();
  });

  it("returns a summary keyed by what it seeded", async () => {
    const summary = await service.run({ force: false });
    expect(Object.keys(summary)).toEqual(expect.arrayContaining(["users", "content"]));
  });
});

describe("SeedService content seeding", () => {
  let service: SeedService;
  let content: { exists: jest.Mock; upsert: jest.Mock };

  beforeEach(async () => {
    content = { exists: jest.fn().mockResolvedValue(false), upsert: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: UsersService, useValue: { count: jest.fn().mockResolvedValue(1), create: jest.fn() } },
        { provide: RolesService, useValue: stubRoles() },
        { provide: ContentService, useValue: content },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    service = moduleRef.get(SeedService);
    setValidatedEnv({} as Env);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setValidatedEnv(undefined);
  });

  it("writes every section of the packaged copy into an empty database", async () => {
    await service.run({ force: false });

    // Every page in the registry, every section of it.
    expect(content.upsert.mock.calls.length).toBeGreaterThan(30);
  });

  it("writes sections in their registry order", async () => {
    await service.run({ force: false });

    const calls = content.upsert.mock.calls as [string, string, number, unknown][];
    const homeOrders = calls.filter(([page]) => page === "home").map(([, , order]) => order);

    expect(homeOrders).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it("leaves an existing section alone", async () => {
    content.exists.mockResolvedValue(true);

    // Re-running the seed must not silently undo an edit the school made in
    // the dashboard.
    await service.run({ force: false });
    expect(content.upsert).not.toHaveBeenCalled();
  });

  it("overwrites an existing section with --force", async () => {
    content.exists.mockResolvedValue(true);

    await service.run({ force: true });
    expect(content.upsert).toHaveBeenCalled();
  });

  it("reports what it did", async () => {
    const summary = await service.run({ force: false });
    expect(summary["content"]).toMatch(/section\(s\) written/);
  });
});
