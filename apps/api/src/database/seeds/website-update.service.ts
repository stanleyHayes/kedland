import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

import { normalizeSchoolContent, RETIRED_MEDIA_IDS, RETIRED_POST_SLUGS } from "@kedland/types";

import { RevalidateService } from "../../modules/revalidate/revalidate.service";

/** Removes only the retired launch fixtures, never school uploads or authored posts. */
@Injectable()
export class WebsiteUpdateService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly revalidate: RevalidateService,
  ) {}

  /** Change only requested wording; compare the old data to avoid racing editor saves. */
  async updateSchoolCopy(): Promise<string> {
    const sections = this.connection.collection("page_sections");
    let updated = 0;
    const pages = new Set<string>();
    for (const section of await sections.find({}).toArray()) {
      const data = normalizeSchoolContent(section["data"]);
      if (JSON.stringify(data) === JSON.stringify(section["data"])) continue;
      const result = await sections.updateOne(
        { _id: section._id, data: section["data"] },
        { $set: { data, updatedAt: new Date() } },
      );
      updated += result.modifiedCount;
      if (result.modifiedCount) pages.add(String(section["page"]));
    }
    await Promise.all([...pages].map((page) => this.revalidate.page(page)));
    updated += await this.updateEditorialCopy("posts", [
      "title",
      "excerpt",
      "body",
      "seoTitle",
      "seoDescription",
    ]);
    updated += await this.updateEditorialCopy("faqs", ["question", "answer"]);
    return `${String(updated)} content record(s) updated with approved school wording`;
  }

  private async updateEditorialCopy(name: "posts" | "faqs", fields: string[]): Promise<number> {
    const collection = this.connection.collection(name);
    let updated = 0;
    for (const record of await collection.find({}).toArray()) {
      const before: Record<string, unknown> = {};
      const changes: Record<string, unknown> = {};
      for (const field of fields) {
        const value: unknown = record[field];
        const replacement = normalizeSchoolContent(value);
        if (replacement === value) continue;
        before[field] = value;
        changes[field] = replacement;
      }
      if (Object.keys(changes).length === 0) continue;
      const result = await collection.updateOne(
        { _id: record._id, ...before },
        { $set: { ...changes, updatedAt: new Date() } },
      );
      updated += result.modifiedCount;
      if (result.modifiedCount) {
        if (name === "posts") await this.revalidate.post(String(record["slug"]));
        else await this.revalidate.faqs();
      }
    }
    return updated;
  }

  async removeRetiredContent(): Promise<string> {
    const media = this.connection.collection("media");
    const filter = { publicId: { $in: [...RETIRED_MEDIA_IDS] }, uploadedById: null };
    const retired = await media.find(filter).toArray();
    const references = [...RETIRED_MEDIA_IDS, ...retired.map((item) => String(item._id))];
    // Remove dependencies first so a partial failure can safely be retried.
    const tiles = await this.connection.collection("instagram_tiles").deleteMany({
      mediaId: { $in: references },
    });
    const posts = await this.connection.collection("posts").deleteMany({
      slug: { $in: [...RETIRED_POST_SLUGS] },
      authorId: null,
    });
    const images = await media.deleteMany(filter);
    if (tiles.deletedCount || images.deletedCount) await this.revalidate.gallery();
    if (posts.deletedCount) {
      await Promise.all(RETIRED_POST_SLUGS.map((slug) => this.revalidate.post(slug)));
    }
    return `${String(images.deletedCount)} retired images, ${String(tiles.deletedCount)} tiles and ${String(posts.deletedCount)} posts removed`;
  }
}
