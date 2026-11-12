import type { MetadataRoute } from "next";
import { meta } from "@/content";

// Served as /robots.txt (static, built once). The API routes are for the page
// itself, not for search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${meta.url}/sitemap.xml`,
  };
}
