import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { UsersService } from "../../modules/users/users.service";

export interface SeedOptions {
  /** Overwrites existing records with the packaged values. Destructive. */
  force: boolean;
}

export type SeedSummary = Record<string, string>;

/**
 * Populates a fresh database.
 *
 * Phase 2 seeds the first administrator. Phase 3 adds the page content, FAQs,
 * settings and Instagram tiles from build package §4 — each as its own seeder
 * called from here, so `run()` stays a table of contents rather than a
 * thousand-line function.
 */
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async run(options: SeedOptions): Promise<SeedSummary> {
    return {
      users: await this.seedFirstAdmin(options),
    };
  }

  /**
   * Creates the first administrator from the environment.
   *
   * Only ever when there are no accounts at all. Re-running the seed against a
   * live database must not resurrect a deleted account or reset a password
   * someone has since changed — even with `--force`, which is for content, not
   * credentials.
   */
  private async seedFirstAdmin(_options: SeedOptions): Promise<string> {
    const existing = await this.users.count();
    if (existing > 0) {
      return `skipped — ${String(existing)} account(s) already exist`;
    }

    const email = this.config.get<string>("SEED_ADMIN_EMAIL");
    const password = this.config.get<string>("SEED_ADMIN_PASSWORD");

    if (email === undefined || password === undefined || password.length === 0) {
      this.logger.warn(
        "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are not set — no administrator was created. " +
          "Set both and run the seed again, or the dashboard cannot be signed into.",
      );
      return "skipped — SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set";
    }

    await this.users.create({
      email,
      password,
      displayName: "Kedland Administrator",
      role: "admin",
    });

    this.logger.log(`Created the first administrator: ${email}`);
    return `created ${email}`;
  }
}
