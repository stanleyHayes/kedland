import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AuditService } from "../audit/audit.service";
import { RevalidateService } from "../revalidate/revalidate.service";

import { SiteSettings, type SiteSettingsDocument } from "./schemas/site-settings.schema";

import type { SiteSettings as SiteSettingsDto, SiteSettingsInput } from "@kedland/types";

const DEFAULTS: SiteSettingsInput = {
  contact: {
    phones: [],
    email: "",
    address: "Community 19 Annex, Lashibi-Tema",
    gpsCode: "",
    mapEmbed: "",
  },
  hours: "",
  socials: { instagram: "https://www.instagram.com/kedlandintlschool" },
  seoDefaults: {
    titleTemplate: "%s | Kedland International School",
    description: "Kedland International School in Lashibi-Tema.",
    ogImageId: "",
  },
  admissionFormUrl: "",
  footerNote: "The future begins here.",
  announcementBanner: { enabled: false, message: "", href: "" },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(SiteSettings.name) private readonly settings: Model<SiteSettingsDocument>,
    private readonly audit: AuditService,
    private readonly revalidate: RevalidateService,
  ) {}

  async get(): Promise<SiteSettingsDto> {
    const settings = await this.settings
      .findOneAndUpdate(
        { key: "site" },
        { $setOnInsert: { key: "site", ...DEFAULTS } },
        { upsert: true, returnDocument: "after" },
      )
      .exec();

    return toDto(settings);
  }

  async update(input: SiteSettingsInput, actorId: string): Promise<SiteSettingsDto> {
    const settings = await this.settings
      .findOneAndUpdate(
        { key: "site" },
        { $set: { ...input, updatedById: new Types.ObjectId(actorId) } },
        { upsert: true, returnDocument: "after" },
      )
      .exec();

    await this.audit.record({
      actorId,
      action: "update",
      entityType: "settings",
      entityId: "site",
      changes: { scopes: ["contact", "hours", "socials", "seo", "admissions", "announcement"] },
    });
    await Promise.all([
      this.revalidate.page("home"),
      this.revalidate.page("contact"),
      this.revalidate.page("admissions"),
    ]);

    return toDto(settings);
  }
}

function toDto(settings: SiteSettingsDocument): SiteSettingsDto {
  return {
    contact: settings.contact,
    hours: settings.hours,
    socials: settings.socials,
    seoDefaults: settings.seoDefaults,
    admissionFormUrl: settings.admissionFormUrl,
    footerNote: settings.footerNote,
    announcementBanner: settings.announcementBanner,
    updatedAt: settings.updatedAt.toISOString(),
  };
}
