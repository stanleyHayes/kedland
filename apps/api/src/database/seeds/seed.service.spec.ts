import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";

import { UsersService } from "../../modules/users/users.service";

import { SeedService } from "./seed.service";

describe("SeedService", () => {
  let service: SeedService;
  let users: { count: jest.Mock; create: jest.Mock };
  let env: Record<string, string | undefined>;

  beforeEach(async () => {
    users = { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({}) };
    env = {
      SEED_ADMIN_EMAIL: "admin@kedland.edu.gh",
      SEED_ADMIN_PASSWORD: "a-long-enough-seed-password",
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: UsersService, useValue: users },
        { provide: ConfigService, useValue: { get: (key: string) => env[key] } },
      ],
    }).compile();

    service = moduleRef.get(SeedService);
    jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates the first administrator on an empty database", async () => {
    const summary = await service.run({ force: false });

    expect(users.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: "admin@kedland.edu.gh", role: "admin" }),
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
    env["SEED_ADMIN_EMAIL"] = undefined;

    const summary = await service.run({ force: false });

    expect(users.create).not.toHaveBeenCalled();
    expect(summary["users"]).toContain("SEED_ADMIN_EMAIL");
    // Silence here would leave someone with a database and no way in.
    expect(warn).toHaveBeenCalled();
  });

  it("treats an empty password as absent", async () => {
    env["SEED_ADMIN_PASSWORD"] = "";

    await service.run({ force: false });
    expect(users.create).not.toHaveBeenCalled();
  });

  it("returns a summary keyed by what it seeded", async () => {
    const summary = await service.run({ force: false });
    expect(Object.keys(summary)).toContain("users");
  });
});
