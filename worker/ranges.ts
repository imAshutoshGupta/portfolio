// Byte ranges for the project demo videos (public/projects/*.mp4).
//
// Workers static assets answer every request for a file with a full 200 and no
// Accept-Ranges, even when asked for `Range: bytes=0-1`. iOS Safari plays a
// <video> only from a server that answers ranges with 206, so the videos go
// through the worker (wrangler.jsonc `assets.run_worker_first`), which takes
// the file from the ASSETS binding and cuts the range out itself. The files
// are small (150–350KB), so reading one whole into memory is fine.
//
// Everything else the asset server does stays as it was: its headers
// (Cache-Control, ETag, Content-Type…), If-None-Match → 304, and the 404 for a
// missing file, which goes on to the app so Next renders its not-found page.

/** The ASSETS binding: only `fetch` is used. */
export type AssetFetcher = { fetch(input: Request): Promise<Response> };

/** Paths the worker answers itself. Matches `run_worker_first` in wrangler.jsonc. */
export const isVideoPath = (pathname: string) => /^\/projects\/.+\.mp4$/.test(pathname);

type Range = { start: number; end: number } | "unsatisfiable" | null;

/**
 * Parses a single `bytes=` range against a file of `size` bytes (RFC 9110
 * §14.1.2). Returns null when the header should be ignored (missing,
 * malformed, another unit, several ranges), which means "send the whole file".
 */
export function parseRange(header: string | null, size: number): Range {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  if (m[1] === "") {
    // Suffix range: the last n bytes.
    const n = Number(m[2]);
    if (n === 0 || size === 0) return "unsatisfiable";
    return { start: Math.max(0, size - n), end: size - 1 };
  }
  const start = Number(m[1]);
  if (m[2] !== "" && Number(m[2]) < start) return null; // invalid: ignored, per the RFC
  if (start >= size) return "unsatisfiable";
  const last = m[2] === "" ? size - 1 : Number(m[2]);
  return { start, end: Math.min(last, size - 1) };
}

/** If-Range: honour the Range only when the validator is our exact (strong) ETag. */
function ifRangeAllows(ifRange: string | null, etag: string | null) {
  if (!ifRange) return true;
  const value = ifRange.trim();
  return !!etag && !value.startsWith("W/") && value === etag;
}

/**
 * Answers a request for a video from the static assets, with byte ranges.
 * Returns null when there is no such file, so the caller hands the request on.
 */
export async function serveVideo(request: Request, assets: AssetFetcher): Promise<Response | null> {
  // The asset server only serves GET and HEAD; let it answer anything else
  // exactly as it did before (405).
  if (request.method !== "GET" && request.method !== "HEAD") return assets.fetch(request);

  // Ask for the whole file, with the visitor's other headers so the asset
  // server still answers If-None-Match / If-Modified-Since with 304 itself.
  const headers = new Headers(request.headers);
  headers.delete("range");
  headers.delete("if-range");
  headers.delete("accept-encoding"); // the bytes are cut from the file as stored
  const res = await assets.fetch(new Request(request.url, { method: "GET", headers, redirect: "manual" }));

  if (res.status === 404) {
    await res.body?.cancel();
    return null;
  }
  const out = new Headers(res.headers);
  out.set("Accept-Ranges", "bytes");
  if (!out.has("X-Content-Type-Options")) out.set("X-Content-Type-Options", "nosniff");
  if (res.status !== 200) {
    // 304s and anything unexpected pass through untouched (plus Accept-Ranges).
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  }
  if (!out.has("Content-Type")) out.set("Content-Type", "video/mp4");
  out.delete("Content-Encoding");

  const file = await res.arrayBuffer();
  const size = file.byteLength;
  const head = request.method === "HEAD";

  const range = ifRangeAllows(request.headers.get("if-range"), res.headers.get("etag"))
    ? parseRange(request.headers.get("range"), size)
    : null;

  if (range === "unsatisfiable") {
    out.set("Content-Range", `bytes */${size}`);
    out.set("Content-Length", "0");
    return new Response(null, { status: 416, headers: out });
  }
  if (range) {
    const length = range.end - range.start + 1;
    out.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    out.set("Content-Length", String(length));
    return new Response(head ? null : file.slice(range.start, range.end + 1), { status: 206, headers: out });
  }
  out.set("Content-Length", String(size));
  return new Response(head ? null : file, { status: 200, headers: out });
}
