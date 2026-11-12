// Security headers for every page and API response the app renders. On
// Cloudflare, files served straight from the static assets (public/, Next's
// build output) don't pass through here: public/_headers covers those.
// No script-src: the inline theme script and Next's own inline scripts would
// need nonces, which a prerendered page can't carry.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site frames /desktop (ashOS) and ashOS's Safari frames the site, both
  // same-origin; nobody else may frame either.
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  // HTTPS only from now on (http:// already redirects at Cloudflare). No
  // includeSubDomains or preload: those are hard to take back.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Don't let `next dev` write an AGENTS.md: its one rule (read the bundled
  // Next 16 docs first) lives in CLAUDE.md, the only notes file this repo keeps.
  agentRules: false,
  async headers() {
    // Every path except PDFs: Chrome's PDF viewer can refuse a PDF (the résumé,
    // in ashOS's Preview) whose own response says object-src 'none'. (On
    // Cloudflare the PDF is a static asset and skips this anyway.)
    return [{ source: "/:path((?!.*\\.pdf$).*)", headers: securityHeaders }];
  },
};

export default nextConfig;
