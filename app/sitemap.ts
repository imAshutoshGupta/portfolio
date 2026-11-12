import type { MetadataRoute } from "next";
import { meta } from "@/content";

// Served as /sitemap.xml (static, built once): the home page and ashOS, which
// has its own canonical (app/desktop/layout.tsx).
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: meta.url }, { url: `${meta.url}/desktop` }];
}
