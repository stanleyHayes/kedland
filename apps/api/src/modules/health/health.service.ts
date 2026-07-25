import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection, ConnectionStates } from "mongoose";

import type { HealthStatus } from "@kedland/types";

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
   */
  ready(): HealthStatus {
    // Compare against Mongoose's own enum rather than the bare literal 1 —
    // `connecting`, `disconnecting` and `uninitialized` are all "not usable".
    const databaseUp = this.connection.readyState === ConnectionStates.connected;

    return {
      status: databaseUp ? "ok" : "error",
      uptimeSeconds: Math.floor(process.uptime()),
      version: version(),
      checks: { database: databaseUp ? "up" : "down" },
    };
  }
}
