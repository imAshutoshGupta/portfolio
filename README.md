# Ashutosh Gupta — Portfolio

Portfolio v4, built with Next.js and TypeScript, plus the interactive **ashOS**
desktop. The design spec and current status are in `CLAUDE.md`.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4**, with exact values from the source as arbitrary values
- **Lenis** for smooth scroll · **GSAP ScrollTrigger** for scroll-linked motion
- Fonts via `next/font`: Inter Tight, Newsreader italic, Sacramento, JetBrains Mono

## Where things live

| Path                         | What it is                                                         |
| ---------------------------- | ------------------------------------------------------------------ |
| `content.ts`                 | **All site copy and links.** `[bracketed]` text is placeholder.    |
| `app/(site)/page.tsx`        | The home page sections                                             |
| `app/(site)/site.css`        | Design tokens (light/dark), keyframes and classes from the source  |
| `components/site/`           | Interactive pieces: nav, hero + Semi, project cards, footer CTA, copy-email button, footer stats (views + Semi pokes), back to top, Lenis, thread, ashOS takeover |
| `components/HobbyIcon.tsx`   | Line icons for the hobby chips, shared by the site and ashOS        |
| `app/desktop/`               | ashOS, a macOS-inspired desktop (opened in a full-screen iframe). `_os/data` = content adapter + virtual file system, `_os/state` = window manager, `_os/ui` + `_os/apps` = UI. Styles in `os.css`, all scoped under `.ashos` |
| `public/ashos/wallpapers/`   | Original ashOS wallpapers (light + dark SVGs) |
| `app/api/now-playing`        | Spotify now / last played, edge-cached ~30s                        |
| `app/api/contact`            | Contact form (Resend), used by ashOS Mail                          |
| `app/api/views`, `app/api/pokes` | Footer counters, stored in Cloudflare KV (`app/api/_lib/counter.ts`) |
| `public/projects/`           | Project demo videos (`.mp4`) and their first frames (`.webp`)      |
| `public/about/`              | The About photo (behind `features.aboutPhoto`)                     |
| `public/` brand assets | Favicons, app icons, manifest, `og.png`, `brand/` logos |

## Notes

- **Theme:** `data-theme` on `<html>`. A first visit follows the OS setting;
  the toggle saves the choice to `localStorage`. ashOS gets the theme via `?theme=`.
- **The thread** (the scroll-drawn line in the left gutter) is on.
  Set `features.thread` in `content.ts` to `false` to remove it, along with
  the "That thin line…" sentence in About.
- **Desktop vs mobile:** at desktop widths the page matches the source
  values exactly. The `max-*:` Tailwind variants add the responsive layout
  the source didn't have (menu button below 860px, stacked grids, smaller type).
- **Reduced motion:** all animations and transitions are off and Lenis is disabled.
- **About photo:** set `features.aboutPhoto` in `content.ts` to `false`
  to remove it from the site and ashOS.
- **ashOS** reads everything from `content.ts`, so content changes show up in
  both places.

## Email

The site's address is `hello@iamashutosh.com` (`links.email` in `content.ts`).
Cloudflare Email Routing forwards it to a personal inbox, which is never shown
on the site.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start
npm run typecheck
```

## Environment

All optional. See `.env.example`.

- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REFRESH_TOKEN`: without
  them, "Now playing" shows the placeholder from `content.ts`
- `LASTFM_API_KEY` / `LASTFM_USERNAME`: free alternative to Spotify's API
  (Last.fm scrobbles Spotify plays). Used instead of the Spotify vars when set.
- `RESEND_API_KEY` / `CONTACT_TO_EMAIL`: the ashOS Mail contact form. Setting
  `CONTACT_TO_EMAIL` to the personal inbox (as a Cloudflare secret) delivers
  messages directly, without going through the `hello@` forwarding.

## Footer counters (Cloudflare KV)

The footer shows page views (`app/api/views`) and a global count of Semi pokes
(`app/api/pokes`). Both live in one KV namespace bound as `COUNTERS`
(`app/api/_lib/counter.ts`). Without it the counters hide themselves;
`next dev` counts in memory instead.

The namespace is `portfolio-counters`, already bound in `wrangler.jsonc`.
To move to a new one, create it (`npx wrangler kv namespace create COUNTERS`)
and swap its id into the `kv_namespaces` entry there.
