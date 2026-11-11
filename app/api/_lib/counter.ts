import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Simple counters (page views, Semi pokes) kept in Workers KV, one key each.
//
// Needs a KV binding named COUNTERS in wrangler.jsonc (see README). Without
// it, reads answer { count: null } and the footer hides that counter.
// `next dev` has no Cloudflare bindings, so it counts in memory instead.
//
// KV has no atomic increment: two hits landing in the same instant can count
// once. Fine for for-fun counters.

type KV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

const dev = new Map<string, string>();
const devKV: KV = {
  get: async (k) => dev.get(k) ?? null,
  put: async (k, v) => {
    dev.set(k, v);
  },
};

function store(): KV | null {
  try {
    const env = getCloudflareContext().env as unknown as { COUNTERS?: KV };
    if (env.COUNTERS) return env.COUNTERS;
  } catch {
    // not running on Cloudflare
  }
  return process.env.NODE_ENV === "development" ? devKV : null;
}

export const counterJson = (count: number | null) =>
  NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });

export async function readCounter(key: string) {
  const kv = store();
  return kv ? Number(await kv.get(key)) || 0 : null;
}

export async function addToCounter(key: string, n: number) {
  const kv = store();
  if (!kv) return null;
  const count = (Number(await kv.get(key)) || 0) + n;
  await kv.put(key, String(count));
  return count;
}
