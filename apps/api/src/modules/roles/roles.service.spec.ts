import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test } from "@nestjs/testing";

import { SYSTEM_ROLES } from "@kedland/types";

import { RolesService, slugifyRoleName } from "./roles.service";
import { Role } from "./schemas/role.schema";

interface QueryChain {
  sort: jest.Mock;
  exec: jest.Mock;
}

function query<T>(result: T): QueryChain {
  const chain: QueryChain = {
    sort: jest.fn(() => chain),
    exec: jest.fn().mockResolvedValue(result),
  };
  return chain;
}

function makeModel() {
  return {
    create: jest.fn().mockImplementation((doc: unknown) => Promise.resolve(doc)),
    exists: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockReturnValue(query(null)),
    findById: jest.fn().mockReturnValue(query(null)),
    find: jest.fn().mockReturnValue(query([])),
    deleteOne: jest.fn().mockReturnValue(query({})),
  };
}

/** A stored role, with the `save()` the service calls on update. */
function storedRole(overrides: Record<string, unknown> = {}) {
  const doc = {
    id: "r1",
    slug: "editor",
    name: "Editor",
    description: "Publishes news",
    permissions: ["posts:read", "posts:update"],
    isSystem: false,
    save: jest.fn(),
    ...overrides,
  };
  doc.save = jest.fn().mockResolvedValue(doc);
  return doc;
}

describe("slugifyRoleName", () => {
  it.each([
    ["Editor", "editor"],
    ["Head Teacher", "head-teacher"],
    ["  Front  Office  ", "front-office"],
    ["Parent/Teacher Association", "parent-teacher-association"],
    ["Année 2026", "ann-e-2026"],
  ])("turns %p into %p", (input, expected) => {
    expect(slugifyRoleName(input)).toBe(expected);
  });

  /** A name of nothing but punctuation would otherwise produce an empty slug. */
  it("produces an empty slug for a name with nothing usable in it", () => {
    expect(slugifyRoleName("!!!")).toBe("");
  });
});

describe("RolesService", () => {
  let service: RolesService;
  let model: ReturnType<typeof makeModel>;

  beforeEach(async () => {
    model = makeModel();
    const moduleRef = await Test.createTestingModule({
      providers: [RolesService, { provide: getModelToken(Role.name), useValue: model }],
    }).compile();

    service = moduleRef.get(RolesService);
  });

  describe("ensureSystemRoles", () => {
    it("creates all three on an empty database", async () => {
      const result = await service.ensureSystemRoles();

      expect(result.created).toEqual(SYSTEM_ROLES.map((role) => role.slug));
      expect(model.create).toHaveBeenCalledTimes(SYSTEM_ROLES.length);
    });

    it("marks them as system roles, so they cannot be deleted", async () => {
      await service.ensureSystemRoles();

      for (const call of model.create.mock.calls) {
        expect(call[0]).toMatchObject({ isSystem: true });
      }
    });

    /**
     * The important one. A school that has tightened `editor` must not have the
     * privileges handed back by the next deploy — that is a change nobody
     * notices until it matters.
     */
    it("leaves an existing role's permissions alone", async () => {
      model.exists.mockResolvedValue({ _id: "r1" });

      const result = await service.ensureSystemRoles();

      expect(result.created).toEqual([]);
      expect(model.create).not.toHaveBeenCalled();
    });

    it("stores the administrator role with every permission", async () => {
      await service.ensureSystemRoles();

      const administrator = model.create.mock.calls
        .map(([doc]) => doc as { slug: string; permissions: string[] })
        .find((doc) => doc.slug === "administrator");

      expect(administrator?.permissions).toContain("users:delete");
      expect(administrator?.permissions).toContain("roles:update");
    });

    /** Read-only means read-only: no create, update or delete anywhere in it. */
    it("stores the organisation role with reads only", async () => {
      await service.ensureSystemRoles();

      const organisation = model.create.mock.calls
        .map(([doc]) => doc as { slug: string; permissions: string[] })
        .find((doc) => doc.slug === "organisation");

      expect(organisation?.permissions.every((permission) => permission.endsWith(":read"))).toBe(true);
    });
  });

  describe("create", () => {
    it("derives the slug from the name", async () => {
      await service.create({ name: "Head Teacher", permissions: ["posts:read"] });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ slug: "head-teacher" }));
    });

    it("completes implied reads", async () => {
      await service.create({ name: "Sub", permissions: ["posts:delete"] });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ permissions: ["posts:delete", "posts:read"] }),
      );
    });

    it("refuses a name that produces no slug", async () => {
      await expect(service.create({ name: "!!!", permissions: [] })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("refuses a duplicate name", async () => {
      model.exists.mockResolvedValue({ _id: "r1" });

      await expect(service.create({ name: "Editor", permissions: [] })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it("never creates a role that claims to be a system one", async () => {
      await service.create({ name: "Impostor", permissions: [] });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ isSystem: false }));
    });

    it("stores an absent description as null rather than undefined", async () => {
      await service.create({ name: "Sub", permissions: [] });

      expect(model.create).toHaveBeenCalledWith(expect.objectContaining({ description: null }));
    });
  });

  describe("update", () => {
    it("changes what a role grants", async () => {
      const role = storedRole();
      model.findById.mockReturnValue(query(role));

      await service.update("r1", { permissions: ["media:delete"] });

      expect(role.permissions).toEqual(["media:delete", "media:read"]);
      expect(role.save).toHaveBeenCalled();
    });

    /**
     * A system role's permissions are editable — a school may want its editors
     * to have less — but its slug is not, because user records refer to it.
     */
    it("lets a system role's permissions change", async () => {
      const role = storedRole({ isSystem: true, slug: "editor", name: "Editor" });
      model.findById.mockReturnValue(query(role));

      await service.update("r1", { permissions: ["posts:read"] });

      expect(role.permissions).toEqual(["posts:read"]);
    });

    it("refuses to rename a system role", async () => {
      model.findById.mockReturnValue(query(storedRole({ isSystem: true })));

      await expect(service.update("r1", { name: "Something Else" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    /** Re-submitting the same name must not be mistaken for a rename. */
    it("accepts a system role submitted with its own name unchanged", async () => {
      const role = storedRole({ isSystem: true, slug: "editor", name: "Editor" });
      model.findById.mockReturnValue(query(role));

      await expect(service.update("r1", { name: "Editor" })).resolves.toBeDefined();
    });

    it("renames a custom role and re-slugs it", async () => {
      const role = storedRole();
      model.findById.mockReturnValue(query(role));

      await service.update("r1", { name: "Front Office" });

      expect(role.slug).toBe("front-office");
      expect(role.name).toBe("Front Office");
    });

    it("refuses a rename onto an existing slug", async () => {
      model.findById.mockReturnValue(query(storedRole()));
      model.exists.mockResolvedValue({ _id: "other" });

      await expect(service.update("r1", { name: "Administrator" })).rejects.toBeInstanceOf(ConflictException);
    });

    it("leaves untouched fields alone", async () => {
      const role = storedRole();
      model.findById.mockReturnValue(query(role));

      await service.update("r1", { permissions: ["posts:read"] });

      expect(role.name).toBe("Editor");
      expect(role.description).toBe("Publishes news");
    });

    it("reports a missing role", async () => {
      model.findById.mockReturnValue(query(null));

      await expect(service.update("nope", { name: "X" })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("remove", () => {
    it("deletes a custom role", async () => {
      model.findById.mockReturnValue(query(storedRole()));

      await service.remove("r1");
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: "r1" });
    });

    /**
     * Deleting `administrator` would lock the school out of its own dashboard
     * with no way back short of a database console.
     */
    it("refuses to delete a system role", async () => {
      model.findById.mockReturnValue(query(storedRole({ isSystem: true })));

      await expect(service.remove("r1")).rejects.toBeInstanceOf(ConflictException);
      expect(model.deleteOne).not.toHaveBeenCalled();
    });

    it("reports a missing role", async () => {
      model.findById.mockReturnValue(query(null));
      await expect(service.remove("nope")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("permissionsForSlug", () => {
    it("returns the role's permissions, completed", async () => {
      model.findOne.mockReturnValue(query(storedRole({ permissions: ["posts:update"] })));

      await expect(service.permissionsForSlug("editor")).resolves.toEqual(["posts:read", "posts:update"]);
    });

    it("is case- and whitespace-insensitive about the slug", async () => {
      model.findOne.mockReturnValue(query(storedRole()));

      await service.permissionsForSlug("  Editor  ");
      expect(model.findOne).toHaveBeenCalledWith({ slug: "editor" });
    });

    /**
     * Loudly, not as an empty list. Creating an account with no permissions
     * because a role name was mistyped is the kind of failure somebody discovers
     * a week later when they cannot do their job.
     */
    it("fails when the role does not exist", async () => {
      model.findOne.mockReturnValue(query(null));

      await expect(service.permissionsForSlug("ghost")).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("puts system roles first", async () => {
      const chain = query([]);
      model.find.mockReturnValue(chain);

      await service.findAll();
      expect(chain.sort).toHaveBeenCalledWith({ isSystem: -1, name: 1 });
    });
  });
});
