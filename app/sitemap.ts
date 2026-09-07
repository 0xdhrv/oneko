import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl().replace(/\/$/, "");
  return [
    {
      url: `${base}/studio`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/docs`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
