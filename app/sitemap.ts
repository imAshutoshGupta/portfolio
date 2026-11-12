import type { MetadataRoute } from "next";
import { meta } from "@/content";

// Served as /sitemap.xml (static, built once): the home page and ashOS, which
// has its own canonical (app/desktop/layout.tsx). <lastmod> is meta.updated,
// bumped by hand in content.ts when the content changes.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: meta.url, lastModified: meta.updated },
    { url: `${meta.url}/desktop`, lastModified: meta.updated },
  ];
}
