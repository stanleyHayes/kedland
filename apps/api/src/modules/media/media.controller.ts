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
  mediaUpdateSchema,
  uploadRequestSchema,
  type MediaItem,
  type PublicMedia,
  type UploadSignature,
} from "@kedland/types";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { RequirePermission } from "../../common/decorators/require-permission.decorator";

import { MediaService } from "./media.service";

@ApiTags("media")
@Public()
@Controller("media")
export class PublicMediaController {
  constructor(private readonly media: MediaService) {}

  @Get(":reference")
  @ApiOperation({ summary: "Resolve one public-safe CMS image" })
  async resolve(@Param("reference") reference: string): Promise<PublicMedia> {
    return this.media.publicByReference(reference);
  }
}

/** The authenticated image library and its safeguarding metadata. */
@ApiTags("media")
@Controller("admin/media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  @RequirePermission("media", "read")
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
  @RequirePermission("media", "create")
  @ApiOperation({ summary: "Sign a direct-to-Cloudinary upload" })
  signature(@Body() raw: unknown): UploadSignature {
    const parsed = uploadRequestSchema.safeParse(raw ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }

    return this.media.signUpload(parsed.data);
  }

  @Post()
  @RequirePermission("media", "create")
  @ApiOperation({ summary: "Record an upload Cloudinary has accepted" })
  async register(@Body() raw: unknown, @CurrentUser() user: AuthenticatedUser): Promise<MediaItem> {
    const parsed = mediaRegisterSchema.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    }

    return this.media.register(parsed.data, user.id);
  }

  @Patch(":id")
  @RequirePermission("media", "update")
  @ApiOperation({ summary: "Update accessibility and pupil-consent metadata" })
  async update(
    @Param("id") id: string,
    @Body() raw: unknown,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MediaItem> {
    const parsed = mediaUpdateSchema.safeParse(raw);
    if (!parsed.success) throw new BadRequestException(parsed.error.issues.map((issue) => issue.message));
    return this.media.update(id, parsed.data, user.id);
  }

  /** Removes the record, not the file. See the service for why. */
  @Delete(":id")
  @RequirePermission("media", "delete")
  @HttpCode(204)
  @ApiOperation({ summary: "Forget an image" })
  async remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.media.remove(id, user.id);
  }
}
