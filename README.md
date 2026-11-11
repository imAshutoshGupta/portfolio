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
| `components/site/`           | Interactive pieces: nav, hero + Semi, project cards, footer CTA, Lenis, thread, ashOS takeover |
| `app/desktop/`               | ashOS, a macOS-inspired desktop (opened in a full-screen iframe). `_os/data` = content adapter + virtual file system, `_os/state` = window manager, `_os/ui` + `_os/apps` = UI. Styles in `os.css`, all scoped under `.ashos` |
| `public/ashos/wallpapers/`   | Original ashOS wallpapers (light + dark SVGs) |
| `app/api/now-playing`        | Spotify now / last played, edge-cached ~30s                        |
| `app/api/github`, `app/api/contact`, `app/og` | Unchanged API routes and OG image                   |

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
- `GITHUB_TOKEN` / `GITHUB_USERNAME`
- `RESEND_API_KEY` / `CONTACT_TO_EMAIL`
