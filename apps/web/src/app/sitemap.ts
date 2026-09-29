// apps/web/src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { findPublishedSlugs } from "@/server/dal/listing";

// Bij elke aanvraag opnieuw: anders zoekt `next build` in CI een database die er niet is.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const koten = await findPublishedSlugs();

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...koten.map((kot) => ({
      url: `${base}/koten/${kot.slug}`,
      lastModified: kot.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
