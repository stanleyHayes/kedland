import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, ConnectionStates } from "mongoose";

import type { HealthStatus } from "@kedland/types";

/** Long enough for a real ping, short enough that the probe never hangs. */
const PING_TIMEOUT_MS = 2000;

/** Set by npm/pnpm when running through a package script; absent under Docker. */
function version(): string {
  return process.env["npm_package_version"] ?? "0.0.0";
}

@Injectable()
export class HealthService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** Liveness: the process is up and answering. Never touches the database. */
  live(): HealthStatus {
    return {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      version: version(),
      checks: {},
    };
  }

  /**
   * Readiness: the process can actually serve requests.
   *
   * Render polls this. It must distinguish "booting" from "broken", so a
   * database that is down reports `error` rather than throwing — a thrown
   * health check tells the platform nothing about *what* is wrong.
   *
   * **It pings, rather than reading `readyState`.** That flag is the driver's
   * cached opinion, and it can be wrong in the way that matters: when the Docker
   * daemon died locally, the port stayed open through Docker's proxy, Mongoose
   * went on reporting `connected`, and every query hung until it timed out. A
   * check that only reads the flag would have called that instance healthy —
   * which is exactly what a readiness probe exists to prevent.
   */
  async ready(): Promise<HealthStatus> {
    const databaseUp = await this.pingDatabase();

    return {
      status: databaseUp ? "ok" : "error",
      uptimeSeconds: Math.floor(process.uptime()),
      version: version(),
      checks: { database: databaseUp ? "up" : "down" },
    };
  }

  /**
   * One round trip to the database, or false.
   *
   * Bounded by its own timeout because an unreachable-but-open socket is the
   * case this exists to catch: without one, the probe hangs for as long as the
   * driver's own timeout, and a health check that hangs is indistinguishable
   * from a service that hangs. Two seconds is far longer than a real ping and
   * far shorter than any sensible probe interval.
   */
  private async pingDatabase(): Promise<boolean> {
    // Cheap and definitive first: a driver that knows it is disconnected needs
    // no round trip to prove it.
    if (this.connection.readyState !== ConnectionStates.connected) return false;

    const admin = this.connection.db?.admin();
    if (!admin) return false;

    try {
      await Promise.race([
        admin.ping(),
        new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("ping timed out"));
          }, PING_TIMEOUT_MS);
        }),
      ]);
      return true;
    } catch {
      return false;
    }
  }
}
