import { NextResponse } from "next/server";
import { PROJECTS } from "@/lib/data";

// Fetched on demand instead of ISR: ISR needs an OpenNext incremental cache
// (R2) on Cloudflare, which this project doesn't configure. The result is
// kept in Cloudflare's edge cache for an hour so GitHub is hit at most
// about once an hour per location.
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 3600;

const FALLBACK = {
  live: false as const,
  totalStars: PROJECTS.reduce((n, p) => n + p.starsCount, 0),
  repos: PROJECTS.map((p) => ({ name: p.name.toLowerCase(), stars: p.starsCount })),
};

type EdgeCache = {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
};

function edgeCache(): EdgeCache | undefined {
  // `caches.default` exists in the Cloudflare Workers runtime only.
  return (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default;
}

async function loadStats() {
  const { GITHUB_TOKEN, GITHUB_USERNAME } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_USERNAME) return FALLBACK;

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "portfolio-terminal",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return FALLBACK;

    const repos = (await res.json()) as { name: string; stargazers_count: number; fork: boolean }[];
    const owned = repos.filter((r) => !r.fork);
    return {
      live: true as const,
      totalStars: owned.reduce((n, r) => n + r.stargazers_count, 0),
      repos: owned
        .map((r) => ({ name: r.name, stars: r.stargazers_count }))
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 12),
    };
  } catch {
    return FALLBACK;
  }
}

export async function GET(req: Request) {
  const cache = edgeCache();
  const key = new Request(new URL(req.url).origin + "/api/github", { method: "GET" });

  if (cache) {
    const hit = await cache.match(key).catch(() => undefined);
    if (hit) return hit;
  }

  const stats = await loadStats();
  const res = NextResponse.json(stats, {
    headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
  });

  // Only cache real data, so a missing token or a GitHub hiccup isn't
  // stuck in the cache for an hour.
  if (cache && stats.live) {
    await cache.put(key, res.clone()).catch(() => {});
  }
  return res;
}
