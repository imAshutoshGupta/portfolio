import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Simple counters (page views, Semi pokes) kept in Workers KV, one key each.
//
// Needs a KV binding named COUNTERS in wrangler.jsonc (see CLAUDE.md). Without
// it, reads answer { count: null } and the footer hides that counter.
// `next dev` has no Cloudflare bindings, so it counts in memory instead.
//
// KV has no atomic increment: two hits landing in the same instant can count
// once. Fine for for-fun counters.
//
// Writes are guarded, because KV writes are limited (one per second per key,
// and a daily quota on the free plan) and the per-visitor poke cap lives in
// the browser, where anyone can skip it:
// - only same-origin browser requests may write (stops other sites and naive
//   scripts; a determined script can fake the headers, hence the next point)
// - the COUNTER_LIMIT rate limiter (wrangler.jsonc) caps writes per IP
// - a failed or refused write never errors: it answers the current count.

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

type RateLimiter = {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
};

type Env = { COUNTERS?: KV; COUNTER_LIMIT?: RateLimiter };

const dev = new Map<string, string>();
const devKV: KV = {
  get: async (k) => dev.get(k) ?? null,
  put: async (k, v) => {
    dev.set(k, v);
  },
};

function env(): Env {
  try {
    return getCloudflareContext().env as unknown as Env;
  } catch {
    return {}; // not running on Cloudflare
  }
}

function store(): KV | null {
  return env().COUNTERS ?? (process.env.NODE_ENV === "development" ? devKV : null);
}

export const counterJson = (count: number | null, status = 200) =>
  NextResponse.json({ count }, { status, headers: { "Cache-Control": "no-store" } });

async function read(kv: KV, key: string) {
  return Number(await kv.get(key)) || 0;
}

export async function readCounter(key: string) {
  const kv = store();
  if (!kv) return null;
  try {
    return await read(kv, key);
  } catch {
    return null;
  }
}

/** Is this POST from our own pages? Browsers always send one of these headers. */
function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** One rate-limit check per IP and counter. No limiter bound (e.g. `next dev`): allowed. */
async function allowed(req: Request, key: string) {
  const limiter = env().COUNTER_LIMIT;
  if (!limiter) return true;
  const ip = req.headers.get("cf-connecting-ip") ?? "unknown";
  try {
    return (await limiter.limit({ key: `${key}:${ip}` })).success;
  } catch {
    return true; // the limiter itself failing shouldn't hide the counter
  }
}

/**
 * Adds `n` and answers the new count. A refused request (cross-site, or over
 * the rate limit) answers 403/429 with the current count, unchanged; a failed
 * KV write answers the count from before it.
 */
export async function addToCounter(req: Request, key: string, n: number) {
  const kv = store();
  if (!kv) return counterJson(null);

  const ok = sameOrigin(req);
  if (!ok || !(await allowed(req, key))) {
    return counterJson(await readCounter(key), ok ? 429 : 403);
  }

  let before: number;
  try {
    before = await read(kv, key);
  } catch {
    return counterJson(null);
  }
  try {
    await kv.put(key, String(before + n));
    return counterJson(before + n);
  } catch {
    // e.g. KV's one-write-per-second-per-key limit, or the daily write quota
    return counterJson(before);
  }
}
