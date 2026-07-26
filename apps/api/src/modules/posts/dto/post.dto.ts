import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsObject, IsOptional, IsString } from "class-validator";

import { postCategorySchema } from "@kedland/types";

/**
 * Post bodies, for Swagger and the global validation pipe.
 *
 * As with the enquiry DTOs, the real contract is the Zod schema in
 * `@kedland/types` — the same one the dashboard validates against before it
 * submits. These classes exist so the API documentation lists the right
 * fields; duplicating every rule in class-validator would just be a second
 * definition to drift.
 */
export class CreatePostDto {
  @ApiProperty({ example: "Our first sports day" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: "Derived from the title when omitted" })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ enum: postCategorySchema.options })
  @IsIn(postCategorySchema.options)
  category!: string;

  @ApiProperty({ example: "A morning of races, laughter and a great many medals." })
  @IsString()
  excerpt!: string;

  @ApiProperty({ description: "Markdown, as the editor serialised it" })
  @IsString()
  body!: string;

  @ApiPropertyOptional({ type: Object, description: "{ mediaId, alt }" })
  @IsOptional()
  @IsObject()
  coverImage?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;
}

/** Every field optional. Same rules, applied to whatever is present. */
export class UpdatePostDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: postCategorySchema.options })
  @IsOptional()
  @IsIn(postCategorySchema.options)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  coverImage?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;
}
