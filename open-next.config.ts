import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Every page is prerendered at build time and nothing revalidates, so the
// Next server answers pages from their prerendered HTML in the static assets
// (x-nextjs-cache: HIT) instead of rendering each request again. API routes
// are dynamic and never cached.
//
// `opennextjs-cloudflare deploy` (which `wrangler deploy` hands off to),
// `upload`, `preview` and `populateCache` copy the prerendered pages into
// .open-next/assets; `build` alone doesn't. If they're missing, pages render
// on demand as before (and log a harmless "read-only cache" error).
//
// enableCacheInterception is left off on purpose: it answers before Next and
// sends `Cache-Control: s-maxage=…, stale-while-revalidate=2592000`, which
// could let a browser show an old page (and its deleted chunks) after a deploy.
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
