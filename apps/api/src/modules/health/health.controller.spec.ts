import { ServiceUnavailableException } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

/** Stands in for a Mongoose connection at a chosen readyState. */
function connectionAt(readyState: number): { readyState: number } {
  return { readyState };
}

/**
 * Runs `fn` and hands back whatever it threw, so the assertions can live
 * outside the catch block. `expect` inside a `catch` silently passes when the
 * call unexpectedly succeeds — the failure mode `jest/no-conditional-expect`
 * exists to prevent.
 */
function captureError(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to throw, but it returned normally");
}

async function buildModule(readyState: number): Promise<TestingModule> {
  return Test.createTestingModule({
    controllers: [HealthController],
    providers: [HealthService, { provide: getConnectionToken(), useValue: connectionAt(readyState) }],
  }).compile();
}

describe("HealthController", () => {
  describe("liveness", () => {
    it("reports ok even when the database is unreachable", async () => {
      const module = await buildModule(0);
      const result = module.get(HealthController).live();

      expect(result.status).toBe("ok");
      // Liveness must not consult the database: a Mongo outage should not make
      // the platform kill and restart an otherwise healthy process.
      expect(result.checks).toEqual({});
    });

    it("reports uptime as whole seconds", async () => {
      const module = await buildModule(1);
      const result = module.get(HealthController).live();

      expect(Number.isInteger(result.uptimeSeconds)).toBe(true);
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });

  describe("version reporting", () => {
    const original = process.env["npm_package_version"];

    afterEach(() => {
      if (original === undefined) {
        delete process.env["npm_package_version"];
      } else {
        process.env["npm_package_version"] = original;
      }
    });

    it("reports the package version when the runtime provides one", async () => {
      process.env["npm_package_version"] = "1.2.3";
      const module = await buildModule(1);

      expect(module.get(HealthController).live().version).toBe("1.2.3");
    });

    it("falls back rather than reporting undefined", async () => {
      // npm/pnpm set this only when the process starts via a package script.
      // Under Docker the entrypoint is `node dist/main.js`, so it is absent —
      // and a health payload saying `"version": undefined` helps nobody.
      delete process.env["npm_package_version"];
      const module = await buildModule(1);

      expect(module.get(HealthController).live().version).toBe("0.0.0");
    });
  });

  describe("readiness", () => {
    it("reports ok with the database up", async () => {
      const module = await buildModule(1);
      const result = module.get(HealthController).ready();

      expect(result.status).toBe("ok");
      expect(result.checks).toEqual({ database: "up" });
    });

    it.each([
      ["disconnected", 0],
      ["connecting", 2],
      ["disconnecting", 3],
    ])("returns 503 when the connection is %s", async (_state, readyState) => {
      const module = await buildModule(readyState);
      const controller = module.get(HealthController);

      expect(() => controller.ready()).toThrow(ServiceUnavailableException);
    });

    it("names the failing check in the 503 body", async () => {
      const module = await buildModule(0);
      const controller = module.get(HealthController);

      const error = captureError(() => controller.ready());

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        checks: { database: "down" },
      });
    });
  });
});
