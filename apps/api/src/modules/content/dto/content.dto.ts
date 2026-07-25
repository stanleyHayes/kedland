import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsObject, Min } from "class-validator";

export class UpdateSectionDto {
  /**
   * The section's new values.
   *
   * Deliberately untyped here: the shape depends on which section is being
   * edited, and the registry's Zod schema validates it in the service. A
   * class-validator DTO cannot express "whatever this particular section's
   * schema says", and pretending otherwise would mean two definitions to keep
   * in step.
   */
  @ApiProperty({ type: Object })
  @IsObject()
  data!: Record<string, unknown>;
}

export class RestoreSectionDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  version!: number;
}
