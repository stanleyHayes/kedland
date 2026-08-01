import { ServiceUnavailableException } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { Test, type TestingModule } from "@nestjs/testing";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

/**
 * Stands in for a Mongoose connection.
 *
 * `ping` is separate from `readyState` on purpose: the two disagree in the case
 * this module exists to catch — the driver believing it is connected while the
 * socket goes nowhere.
 */
function connectionAt(
  readyState: number,
  ping: () => Promise<unknown> = () => Promise.resolve({ ok: 1 }),
): unknown {
  return { readyState, db: { admin: () => ({ ping }) } };
}

/**
 * Runs `fn` and hands back whatever it threw, so the assertions can live
 * outside the catch block. `expect` inside a `catch` silently passes when the
 * call unexpectedly succeeds — the failure mode `jest/no-conditional-expect`
 * exists to prevent.
 */
async function captureError(fn: () => Promise<unknown>): Promise<unknown> {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to throw, but it returned normally");
}

async function buildModule(readyState: number, ping?: () => Promise<unknown>): Promise<TestingModule> {
  return Test.createTestingModule({
    controllers: [HealthController],
    providers: [HealthService, { provide: getConnectionToken(), useValue: connectionAt(readyState, ping) }],
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
      const result = await module.get(HealthController).ready();

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

      await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it("names the failing check in the 503 body", async () => {
      const module = await buildModule(0);
      const controller = module.get(HealthController);

      const error = await captureError(async () => controller.ready());

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        checks: { database: "down" },
      });
    });
  });

  /**
   * The failure this endpoint exists for, and the reason it pings rather than
   * reading `readyState`.
   *
   * When the Docker daemon died locally, the port stayed open through Docker's
   * own proxy, Mongoose went on reporting `connected`, and every query hung
   * until it timed out. A probe that trusted the flag would have called that
   * instance healthy while it served nothing.
   */
  describe("a connection that only looks alive", () => {
    it("reports the database down when the ping is refused", async () => {
      const module = await buildModule(1, () => Promise.reject(new Error("connection reset")));
      const status = await module.get(HealthService).ready();

      expect(status).toMatchObject({ status: "error", checks: { database: "down" } });
    });

    it("reports the database down when the ping never answers", async () => {
      // Longer than the service's own 2s bound, so the timeout is what resolves
      // this and not the promise.
      const module = await buildModule(1, () => new Promise(() => undefined));
      const status = await module.get(HealthService).ready();

      expect(status).toMatchObject({ status: "error", checks: { database: "down" } });
    }, 10_000);

    it("does not hang: a stuck database still answers the probe", async () => {
      const module = await buildModule(1, () => new Promise(() => undefined));
      const started = Date.now();

      await module.get(HealthService).ready();

      // A health check that hangs is indistinguishable from a service that hangs.
      expect(Date.now() - started).toBeLessThan(5000);
    }, 10_000);

    it("skips the round trip when the driver already knows it is disconnected", async () => {
      let pinged = false;
      const module = await buildModule(0, () => {
        pinged = true;
        return Promise.resolve({});
      });

      await module.get(HealthService).ready();
      expect(pinged).toBe(false);
    });
  });
});
