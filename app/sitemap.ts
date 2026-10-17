import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = (process.env.APP_ORIGIN || "https://onday-site-production-47b3.up.railway.app").replace(/\/$/, "");
  return [{ url: origin, changeFrequency: "weekly", priority: 0.3 }];
}
