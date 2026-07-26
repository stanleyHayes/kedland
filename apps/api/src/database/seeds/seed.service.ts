import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { getPage, PAGE_REGISTRY, type PageKey } from "@kedland/types";

import { validatedEnv } from "../../config/env.validation";
import { ContentService } from "../../modules/content/content.service";
import { FaqsService } from "../../modules/faqs/faqs.service";
import { InstagramService } from "../../modules/instagram/instagram.service";
import { MediaService } from "../../modules/media/media.service";
import { PostsService } from "../../modules/posts/posts.service";
import { RolesService } from "../../modules/roles/roles.service";
import { UsersService } from "../../modules/users/users.service";

import { CONTENT_SEED } from "./content.seed";
import { FAQ_SEED } from "./faqs.seed";
import { STARTER_MEDIA } from "./media.seed";
import { POST_SEED } from "./posts.seed";

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
    private readonly roles: RolesService,
    private readonly content: ContentService,
    private readonly faqs: FaqsService,
    private readonly media: MediaService,
    private readonly posts: PostsService,
    private readonly instagram: InstagramService,
    private readonly config: ConfigService,
  ) {}

  async run(options: SeedOptions): Promise<SeedSummary> {
    // Roles first: the administrator created below takes its permissions from
    // the `administrator` role, so that role has to exist.
    return {
      roles: await this.seedRoles(),
      users: await this.seedFirstAdmin(options),
      permissions: await this.backfillPermissions(),
      media: await this.seedStarterMedia(),
      content: await this.seedContent(options),
      faqs: await this.seedFaqs(),
      posts: await this.seedPosts(),
    };
  }

  private async seedFaqs(): Promise<string> {
    const results = await Promise.all(FAQ_SEED.map((item) => this.faqs.ensureStarter(item)));
    return `${String(results.filter(Boolean).length)} FAQ(s) written, ${String(results.filter((item) => !item).length)} left as-is`;
  }

  private async seedPosts(): Promise<string> {
    const results = await Promise.all(POST_SEED.map((item) => this.posts.ensureStarter(item)));
    return `${String(results.filter(Boolean).length)} post(s) written, ${String(results.filter((item) => !item).length)} left as-is`;
  }

  private async seedStarterMedia(): Promise<string> {
    const media = await Promise.all(STARTER_MEDIA.map((item) => this.media.ensureStarter(item)));

    await Promise.all(
      media.map((item, order) =>
        this.instagram.ensureStarter({
          mediaId: item.id,
          caption: item.alt,
          href: "https://www.instagram.com/kedlandintlschool",
          order,
          published: true,
        }),
      ),
    );

    return `${String(media.length)} editable starter image(s) and gallery tile(s) ready`;
  }

  /**
   * Creates the three roles the school starts with.
   *
   * Runs on every seed, including one that skips the administrator because an
   * account already exists — a database seeded before roles existed needs them
   * adding, and that is exactly the upgrade path this covers.
   */
  private async seedRoles(): Promise<string> {
    const { created } = await this.roles.ensureSystemRoles();

    if (created.length === 0) return "skipped — all system roles already exist";
    return `created ${created.join(", ")}`;
  }

  /**
   * Gives permissions to accounts that predate them.
   *
   * The upgrade path, and it is not optional: on a database seeded before roles
   * existed, `seedFirstAdmin` skips because an account is already there, and that
   * account holds no permissions — so the school signs in successfully and then
   * cannot do anything. See `UsersService.backfillPermissions`.
   */
  private async backfillPermissions(): Promise<string> {
    const { updated } = await this.users.backfillPermissions(async (slug) =>
      this.roles.permissionsForSlug(slug),
    );

    if (updated.length === 0) return "skipped — every account already has permissions";

    this.logger.log(`Backfilled permissions for ${updated.join(", ")}`);
    return `backfilled ${String(updated.length)} account(s)`;
  }

  /**
   * Writes the school's page copy from build package §4.
   *
   * Idempotent by default: a section that already exists is left alone, because
   * the school may have edited it in the dashboard and re-running the seed must
   * not silently undo their work. `--force` overwrites, which is how you return
   * to the packaged copy deliberately.
   */
  private async seedContent(options: SeedOptions): Promise<string> {
    let written = 0;
    let skipped = 0;

    for (const [page, sections] of Object.entries(CONTENT_SEED) as [
      PageKey,
      Record<string, Record<string, unknown>>,
    ][]) {
      const definition = getPage(page);
      if (!definition) {
        // The contract test makes this unreachable; the guard is here so a
        // future edit fails loudly rather than writing an orphan document.
        this.logger.warn(`Skipping "${page}" — not a registered page`);
        continue;
      }

      for (const [index, section] of definition.sections.entries()) {
        const data = sections[section.key];
        if (!data) continue;

        if (await this.seedSection(page, section.key, index, data, options)) written += 1;
        else skipped += 1;
      }
    }

    const total = PAGE_REGISTRY.size;
    return `${String(written)} section(s) written, ${String(skipped)} left as-is, across ${String(total)} pages`;
  }

  /**
   * Writes one section, or leaves it alone.
   *
   * Split out of `seedContent` so that function stays a readable pair of loops:
   * the decision about a single section — overwrite, backfill an image, or skip —
   * has three branches of its own, and inlining them pushed the whole thing past
   * what anyone can hold in their head at once.
   *
   * @returns whether anything was written.
   */
  private async seedSection(
    page: PageKey,
    key: string,
    index: number,
    data: Record<string, unknown>,
    options: SeedOptions,
  ): Promise<boolean> {
    // An existing section is the school's, not ours — unless --force says
    // otherwise. The one exception is an image the section never had, which is
    // additive and cannot overwrite anybody's words.
    if (!options.force && (await this.content.exists(page, key))) {
      return this.content.backfillMissingImage(page, key, data["image"]);
    }

    await this.content.upsert(page, key, index, data);
    return true;
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

    const env = validatedEnv();
    const email = env.SEED_ADMIN_EMAIL;
    const password = env.SEED_ADMIN_PASSWORD;

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
      roleSlug: "administrator",
      // Read from the role rather than hardcoded, so there is one definition of
      // what an administrator may do. `seedRoles` above guarantees it exists.
      permissions: await this.roles.permissionsForSlug("administrator"),
    });

    this.logger.log(`Created the first administrator: ${email}`);
    return `created ${email}`;
  }
}
