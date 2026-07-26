import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import { postCategorySchema, postStatusSchema, type PostCategory, type PostStatus } from "@kedland/types";

/** A cover image, stored inline. One image, so a sub-document earns nothing. */
@Schema({ _id: false })
class CoverImage {
  @Prop({ required: true })
  mediaId!: string;

  /** Required, not optional — an image with no alt text is invisible to some. */
  @Prop({ required: true })
  alt!: string;
}

/**
 * A news or events post.
 *
 * `body` is Markdown as the editor serialised it, never HTML. The public site
 * renders it with raw HTML disabled, so nothing stored here can inject markup
 * into a page.
 */
@Schema({ timestamps: true, collection: "posts" })
export class Post {
  @Prop({ required: true, trim: true })
  title!: string;

  /**
   * The public URL segment. Unique, because two posts sharing a slug means one
   * of them is unreachable.
   */
  @Prop({ required: true, trim: true, lowercase: true })
  slug!: string;

  @Prop({ required: true, enum: postCategorySchema.options, index: true })
  category!: PostCategory;

  @Prop({ required: true, trim: true })
  excerpt!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: CoverImage, default: null })
  coverImage!: CoverImage | null;

  @Prop({ required: true, enum: postStatusSchema.options, default: "draft", index: true })
  status!: PostStatus;

  /**
   * When the school first told the world.
   *
   * Set on the first publish and kept through later edits — a correction to a
   * typo is not a new announcement, and re-dating it would reshuffle the news
   * list for no reason. Unpublishing keeps it too, so republishing does not
   * pretend the post is new.
   */
  @Prop({ type: Date, default: null, index: true })
  publishedAt!: Date | null;

  // `type: String` is required, not decoration: Mongoose cannot infer a schema
  // type from the union `string | null`, and fails at class-decoration time
  // rather than at runtime — which is why this surfaces as "cannot determine a
  // type" the moment anything imports the schema.
  @Prop({ type: String, default: null, trim: true })
  seoTitle!: string | null;

  @Prop({ type: String, default: null, trim: true })
  seoDescription!: string | null;

  @Prop({ type: Types.ObjectId, ref: "User", default: null })
  authorId!: Types.ObjectId | null;

  /**
   * Written by `timestamps: true`, declared here so the type is honest.
   *
   * Without these, every place that reads a timestamp needs a cast asserting
   * a field Mongoose really does set — and a cast that says "trust me" at four
   * call sites is four chances to be wrong.
   */
  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt!: Date;
}

export type PostDocument = HydratedDocument<Post>;
export const PostSchema = SchemaFactory.createForClass(Post);

// A slug is a URL. Two posts cannot share one.
PostSchema.index({ slug: 1 }, { unique: true });

// The public list: published, newest first, optionally by category.
PostSchema.index({ status: 1, publishedAt: -1 });
PostSchema.index({ status: 1, category: 1, publishedAt: -1 });
