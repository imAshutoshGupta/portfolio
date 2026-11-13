import { NextResponse } from "next/server";

// Fetched on demand; real results sit in Cloudflare's edge cache for 10s, so
// Last.fm (or Spotify) is hit at most about six times a minute per location,
// however many visitors are polling. Clients poll every 15s (and on tab focus),
// so a song change shows up within ~25s.
//
// Browsers must never cache it: only the copy put in `caches.default` carries
// max-age. Cloudflare rewrites a cached copy's max-age to the zone's Browser
// Cache TTL (4h), so a hit that went out as-is froze the widget for hours.
export const dynamic = "force-dynamic";

const CACHE_SECONDS = 10;
const BROWSER_CACHE = "no-store";
// A stalled Last.fm or Spotify gives up after this and the widget shows its
// idle line, instead of every poll hanging until the platform kills it.
const UPSTREAM_TIMEOUT_MS = 4000;
const upstream = () => AbortSignal.timeout(UPSTREAM_TIMEOUT_MS);

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";
const RECENT_URL = "https://api.spotify.com/v1/me/player/recently-played?limit=1";

type SpotifyItem = {
  name: string;
  artists: { name: string }[];
};

type Track =
  | { live: false }
  | { live: true; isPlaying: boolean; title: string; artist: string };

type EdgeCache = {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
};

function edgeCache(): EdgeCache | undefined {
  // `caches.default` exists in the Cloudflare Workers runtime only.
  return (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default;
}

async function getAccessToken(id: string, secret: string, refresh: string): Promise<string | null> {
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
    cache: "no-store",
    signal: upstream(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token ?? null;
}

const toTrack = (item: SpotifyItem, isPlaying: boolean): Track => ({
  live: true,
  isPlaying,
  title: item.name,
  artist: item.artists.map((a) => a.name).join(", "),
});

// Free alternative to the Spotify Web API (which now needs Premium on the app
// owner's account): Last.fm scrobbles Spotify plays, and its API is free.
async function loadLastFm(key: string, user: string): Promise<Track> {
  try {
    const url =
      "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&format=json" +
      `&api_key=${encodeURIComponent(key)}&user=${encodeURIComponent(user)}`;
    const res = await fetch(url, { cache: "no-store", signal: upstream() });
    if (!res.ok) return { live: false };
    const data = await res.json();
    const t = data.recenttracks?.track?.[0];
    // No title, no track: ashOS would otherwise show "undefined — Artist".
    if (!t || typeof t.name !== "string" || !t.name) return { live: false };
    return {
      live: true,
      isPlaying: t["@attr"]?.nowplaying === "true",
      title: t.name,
      artist: t.artist?.["#text"] ?? t.artist?.name ?? "",
    };
  } catch {
    return { live: false };
  }
}

async function loadTrack(): Promise<Track> {
  const { LASTFM_API_KEY, LASTFM_USERNAME } = process.env;
  if (LASTFM_API_KEY && LASTFM_USERNAME) return loadLastFm(LASTFM_API_KEY, LASTFM_USERNAME);

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  // No creds → the client shows the placeholder from content.ts.
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return { live: false };
  }

  try {
    const token = await getAccessToken(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN);
    if (!token) return { live: false };
    const headers = { Authorization: `Bearer ${token}` };

    const now = await fetch(NOW_PLAYING_URL, { headers, cache: "no-store", signal: upstream() });
    if (now.status === 200) {
      const data = await now.json();
      const item = data.item as SpotifyItem | null;
      if (item?.name && data.is_playing) return toTrack(item, true);
    }

    // Nothing playing — show the most recent track as "last played".
    const recent = await fetch(RECENT_URL, { headers, cache: "no-store", signal: upstream() });
    if (recent.ok) {
      const data = await recent.json();
      const item = data.items?.[0]?.track as SpotifyItem | undefined;
      if (item?.name) return toTrack(item, false);
    }
    return { live: false };
  } catch {
    return { live: false };
  }
}

export async function GET(req: Request) {
  const cache = edgeCache();
  const key = new Request(new URL(req.url).origin + "/api/now-playing", { method: "GET" });

  if (cache) {
    const hit = await cache.match(key).catch(() => undefined);
    if (hit) {
      const res = new Response(hit.body, hit);
      res.headers.set("Cache-Control", BROWSER_CACHE);
      return res;
    }
  }

  const track = await loadTrack();
  // Only cache real data, so missing creds or a Spotify hiccup isn't sticky.
  if (cache && track.live) {
    const copy = NextResponse.json(track, {
      headers: { "Cache-Control": `public, max-age=${CACHE_SECONDS}` },
    });
    await cache.put(key, copy).catch(() => {});
  }
  return NextResponse.json(track, { headers: { "Cache-Control": BROWSER_CACHE } });
}
