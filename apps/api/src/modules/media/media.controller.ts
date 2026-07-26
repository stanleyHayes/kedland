import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import {
  mediaRegisterSchema,
  uploadRequestSchema,
  type MediaItem,
  type UploadSignature,
} from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

import { MediaService } from "./media.service";

/**
 * The image library. Staff only — there is no public media endpoint, because
 * the public site reads images straight from Cloudinary's CDN.
 */
@ApiTags("media")
@Controller("admin/media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @ApiOperation({ summary: "The image library, newest first" })
  async list(): Promise<MediaItem[]> {
    return this.media.list();
  }

  /**
   * A signature for one upload.
   *
   * The browser then posts the file to Cloudinary directly — see the service
   * for why the file does not come through here.
   */
  @Post("signature")
  @ApiOperation({ summary: "Sign a direct-to-Cloudinary upload" })
  signature(@Body() raw: unknown): UploadSignature {
    const parsed = uploadRequestSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }

    return this.media.signUpload(parsed.data);
  }

  @Post()
  @ApiOperation({ summary: "Record an upload Cloudinary has accepted" })
  async register(@Body() raw: unknown, @CurrentUser() user: AuthenticatedUser): Promise<MediaItem> {
    const parsed = mediaRegisterSchema.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }

    return this.media.register(parsed.data, user.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Correct an image's alt text" })
  async describe(
    @Param("id") id: string,
    @Body() body: { alt?: unknown },
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MediaItem> {
    const alt = mediaRegisterSchema.shape.alt.safeParse(body.alt);
    if (!alt.success) {
      throw new BadRequestException("Describe what is in the image, in a sentence.");
    }

    return this.media.describe(id, alt.data, user.id);
  }

  /** Removes the record, not the file. See the service for why. */
  @Delete(":id")
  @Roles("admin")
  @HttpCode(204)
  @ApiOperation({ summary: "Forget an image" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.media.remove(id, user.id);
  }
}
