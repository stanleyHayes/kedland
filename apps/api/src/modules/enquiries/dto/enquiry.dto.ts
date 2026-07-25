import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString } from "class-validator";

import { enquiryStatusSchema, type EnquiryStatus } from "@kedland/types";

/** The one list of statuses, taken from the shared enum rather than restated. */
const STATUSES = enquiryStatusSchema.options;

/**
 * The enquiry body, for Swagger and the global validation pipe.
 *
 * Deliberately permissive: the real contract is `enquirySchema` in
 * `@kedland/types`, which the controller runs before anything else. Declaring
 * the rules twice — once in class-validator and once in Zod — would mean two
 * definitions to keep in step, and the Zod one is the one the public site
 * validates against too. This class exists so the API documentation shows the
 * right fields.
 */
export class SubmitEnquiryDto {
  @ApiProperty({ example: "Ama Mensah" })
  @IsString()
  parentName!: string;

  @ApiProperty({ example: "ama@example.com" })
  @IsString()
  email!: string;

  @ApiProperty({ example: "+233 24 123 4567" })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ enum: ["admissions", "book-a-tour", "after-school-care", "general"] })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: "nursery-2" })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiProperty({ example: "I would like to book a tour for my daughter." })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: "Cloudflare Turnstile token, verified server-side" })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class UpdateEnquiryStatusDto {
  @ApiProperty({ enum: STATUSES })
  @IsIn(STATUSES)
  status!: EnquiryStatus;
}
