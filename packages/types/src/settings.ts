import { z } from "zod";

const optionalUrl = z.union([z.url(), z.literal("")]);

export const siteSettingsSchema = z.strictObject({
  contact: z.strictObject({
    phones: z.array(z.string().trim().min(1).max(40)).max(5),
    email: z.union([z.email(), z.literal("")]),
    address: z.string().trim().max(300),
    gpsCode: z.string().trim().max(40),
    mapEmbed: optionalUrl,
  }),
  hours: z.string().trim().max(500),
  socials: z.strictObject({
    instagram: optionalUrl,
    facebook: optionalUrl,
    tiktok: optionalUrl,
  }),
  seoDefaults: z.strictObject({
    titleTemplate: z.string().trim().max(120),
    description: z.string().trim().max(300),
    ogImageId: z.string().trim().max(100),
  }),
  admissionFormUrl: optionalUrl,
  footerNote: z.string().trim().max(300),
  announcementBanner: z.strictObject({
    enabled: z.boolean(),
    message: z.string().trim().max(240),
    href: optionalUrl,
  }),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export interface SiteSettings extends SiteSettingsInput {
  updatedAt: string | null;
}
