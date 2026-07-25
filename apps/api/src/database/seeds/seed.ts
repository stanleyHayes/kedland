import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "../../app.module";

import { SeedService } from "./seed.service";

/**
 * `pnpm --filter @kedland/api seed [--force]`
 *
 * Idempotent: every seeder upserts, so running it twice changes nothing.
 * `--force` overwrites existing content with the values from the build package,
 * which is how you get back to a known state after experimenting — and which is
 * destructive to any edits made in the dashboard, hence the explicit flag.
 */
async function run(): Promise<void> {
  const logger = new Logger("Seed");
  const force = process.argv.includes("--force");

  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: false });

  try {
    const summary = await app.get(SeedService).run({ force });

    for (const [name, result] of Object.entries(summary)) {
      logger.log(`${name}: ${result}`);
    }
    logger.log(force ? "Seed complete (forced overwrite)" : "Seed complete");
  } catch (error) {
    logger.error("Seed failed", error instanceof Error ? error.stack : String(error));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void run();
