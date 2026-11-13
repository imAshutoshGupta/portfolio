# Portfolio v4 — project notes for Claude

Personal portfolio for Ashutosh Gupta: a Next.js rebuild of a "v4" design, plus
the interactive **ashOS** desktop at `/desktop`. This file holds every technical
and project note. `README.md` is for visitors (what the site is, how to look
around, links) and should stay free of history and internals.

## Ground rules

- **Never push to `main` on your own.** Cloudflare Workers Builds deploys
  `main` to the live site; other branches get preview builds. Work on a feature
  branch off `main` and let the user merge. Only merge + push `main` when the
  user explicitly asks in that conversation; that permission doesn't carry over
  to later requests or sessions. Delete merged branches afterwards. The user
  sometimes works from cloud sessions, which only see what's on GitHub.
- **Don't commit unless asked.** The user reviews first.
- Run `npm run typecheck` before calling anything done.
- **Next.js 16 has breaking changes** from what you may know. Before writing
  Next-specific code, read the relevant guide in `node_modules/next/dist/docs/`
  and heed deprecation notices. (`agentRules: false` in `next.config.mjs` stops
  `next dev` writing this rule to an AGENTS.md.)
- All copy lives in `content.ts`. `[bracketed]` text and `"#"` hrefs are
  placeholders the user will fill in. Don't invent real content for them.
- **Every site change also goes into ashOS**, without being asked: wire new
  content through `app/desktop/_os/data/portfolio.ts` and the places that show
  it (`apps/About.tsx`, `apps/Projects.tsx`, `apps/shell.ts`, `data/fs.ts` docs,
  `ui/Panels.tsx`), never hardcoded, and say what changed there.
- New features borrowed from elsewhere get re-themed to this site (Semi, the
  semicolon, the thread, the violet accent, Newsreader italic accents, a calm
  and slightly wry voice), not copied as-is. Examples the user approved: the
  view counter uses Semi's blinking eyes, the poke counter a tiny Semi.
- `features.thread` in `content.ts` turns the left-gutter scroll line on and off.
  It's `true`, and on 2026-11-12 the user settled it: they like it and are
  keeping it. Don't suggest replacing it.
- **Git identity:** the user works from an office laptop whose global git
  identity is their office account. This repo has a repo-local
  `user.name`/`user.email` (imAshutoshGupta, personal) and an `origin` URL with
  the personal username; the push token lives in Git Credential Manager. Check
  `git config --local user.email` before committing; never change the global
  config, never write a token into files or the remote URL. If a push asks for
  credentials, stop and ask the user.

## How the user likes work run

Fix work goes in **batches**. Per batch: a branch off `main`
(`fix/<area>-batch-<x>`), fixes, `npm run typecheck`, a production build,
Playwright tests that **fail on the old code and pass on the new** (run the
earlier suites too), review the diff, commit (personal identity, detailed
message), push the branch, then — only when the user has said so in that
conversation — merge `--no-ff` into `main`, push, delete the branch, wait for
the deploy and rerun the batch's tests against https://iamashutosh.com.

The user wants Claude to **orchestrate**: spawn Opus agents for the fixing,
testing and reviewing, run independent work **in parallel** (separate git
worktrees, separate ports), and keep the main thread for briefing, reviewing
diffs, re-running tests and merging. Give each agent a full brief (items with
file:line, CLAUDE.md rules, how to test, "don't commit"). Merge batches one at
a time; rebase/retest a later batch on the new `main` before merging it.
Agents' claims get checked: rerun their tests yourself before committing.

What worked in the 2026-11-13 run (F–I, four agents at once):
- Worktrees in `C:/Users/admin/portfolio-wt/<batch>` (`git worktree add -b
  fix/<area>-batch-<x> …`), each agent runs `npm ci` and its own port
  (3101, 3102, …). One baseline build of `main` on :3100 serves as the "old
  code" for every agent's fail-before/pass-after proof.
- Split a big batch across agents by file ownership (e.g. ashOS UI vs ashOS
  apps), name each agent's files in its brief, then commit both parts and
  merge them into one batch branch before review.
- Start a dependent batch early from the branch it builds on, and rebase it
  onto `main` once that branch is merged.
- Before risky or visible changes, add an independent Opus reviewer that
  gets only the code and the goal, not your conclusions. It caught a
  VoiceOver issue that every test missed.
- The user may hit usage limits. Push `wip/<batch>` snapshot branches of
  uncommitted agent work (`commit-tree` from a temp index, which doesn't touch
  the agent's branch or index) and keep CLAUDE.md's Open section current on
  GitHub, so a new session can resume. Delete the wip branches after merging.
  A rate-limited agent resumes with SendMessage once the limit resets.
- Wait for a deploy by polling with curl for something the batch changes
  (a header, a string in the HTML), not with a browser.

## Codebase

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript ·
Tailwind CSS v4 (exact source values as arbitrary values, no preflight) ·
Lenis + GSAP ScrollTrigger · fonts via `next/font` · deployed on Cloudflare
Workers (OpenNext, `wrangler.jsonc`).

| Path | What it is |
| --- | --- |
| `content.ts` | All site copy, links and feature flags |
| `app/(site)/page.tsx` | The home page sections |
| `app/(site)/site.css` | Design tokens (light/dark), keyframes, component classes |
| `components/site/` | Nav, `Bulb.tsx` (theme switch), hero + Semi, project cards, footer CTA, copy-email, footer stats, back to top, `Motion.tsx` → `motionEngine.ts` (Lenis + GSAP), `scroll.ts`, `Thread.tsx`, ashOS takeover |
| `components/HobbyIcon.tsx` | Hobby chip icons, shared by the site and ashOS |
| `app/desktop/` | ashOS (see its section below) |
| `app/api/now-playing` | Now / last played (Last.fm, or Spotify's API), edge-cached 10s |
| `app/api/views`, `app/api/pokes` | Footer counters in Cloudflare KV (`app/api/_lib/counter.ts`) |
| `public/projects/` | Project demo videos (`.mp4`) + first frames (`.webp`) |
| `public/wins/`, `public/about/` | Hackathon screenshot, About photo |
| `public/brand/` | The user's brand kit (logos, favicons, OG images). Not referenced by the site code, but `README.md` uses the logo and OG images. Keep it. |
| `public/Ashutosh_Gupta_Resume.pdf` | The résumé (see Closed) |

**Commands:** `npm install` · `npm run dev` (:3000) · `npm run build && npm run start` ·
`npm run typecheck`.

**Environment** (all optional, see `.env.example`):
- `LASTFM_API_KEY` / `LASTFM_USERNAME`: what the live site uses. Spotify's
  Last.fm connection scrobbles every play (free, no Premium). Win over the
  Spotify vars when set.
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REFRESH_TOKEN`:
  real-time, but needs Premium on the app owner's account (the user has none).
- With neither set, Now playing shows `hero.nowPlaying.fallback`.

**Footer counters:** one KV namespace bound as `COUNTERS` (namespace
`portfolio-counters`, in `wrangler.jsonc`). Without it the counters hide
themselves; `next dev` counts in memory. To move namespaces:
`npx wrangler kv namespace create COUNTERS` and swap the id in `wrangler.jsonc`.
Writes (POST) only count from same-origin browser requests, and a Workers
rate limiter bound as `COUNTER_LIMIT` (20 writes a minute per IP, per counter)
keeps scripts from burning KV's write limits. Refused or failed writes answer
the current count instead of an error, so the pill never breaks.

**Behaviour notes:**
- Theme: `data-theme` on `<html>`; first visit follows the OS, the bulb saves
  the choice to `localStorage`; ashOS gets it via `?theme=`.
- Feature flags in `content.ts`: `features.thread` (also hides the "That thin
  line…" About note), `features.aboutPhoto` (site and ashOS).
- At desktop widths the page matches the source values exactly; `max-*:`
  Tailwind variants add the responsive layout the source didn't have.
- Reduced motion: all animations and transitions off, Lenis disabled.

## The design spec

The design came from `portfolio-v4-source.html`, a design-canvas export kept
**only on the user's Mac** (excluded via `.git/info/exclude`, not
`.gitignore`). The handoff brief that came with it has been retired; everything
that matters from it is below. If you ever read the source: `<x-dc>` is the
page JSX, `<helmet>` the global CSS, `{{name}}` a value from `renderVals()`,
`<sc-for>` / `<sc-if>` are `map` / conditionals, and inline styles are the exact
design values.

**Fonts:** Inter Tight (400/500/600) · Newsreader italic · Sacramento · JetBrains Mono

**Colours**

| Token       | Light   | Dark    |
| ----------- | ------- | ------- |
| bg          | #FFFFFF | #0B0A12 |
| text        | #120F1F | #EEEDF5 |
| muted       | #5B5770 | #9F9BB3 |
| accent      | #5B3FD6 | #A78BFA |
| accent-soft | #A78BFA | —       |
| line        | #E7E4EF | #23212F |
| soft        | #F3F1F8 | #16141F |
| card        | #FFFFFF | #110F1A |

Status green #10B981 · Spotify green #1DB954. Container max-width 1180px with
40px side padding. Radii: buttons 12, cards 16, images 10. These are the
source's exact values, so don't round them to a scale. They're defined in
`app/(site)/site.css`.

**Sections, top to bottom:** Nav · Hero · 01 Selected work · 02 Experience ·
03 Hackathons & wins · 04 Kind words · 05 Toolkit · 06 How I work · 07 Writing ·
08 Beyond work · Footer

This order is a deliberate change from the source, which had 04 Writing and
07 Kind words. The user chose it on 2026-11-11 (after briefly trying Kind words
before Hackathons & wins) so the page reads: work → experience → achievements →
social proof → skills → personality → contact. Keep it.

**The 10 interactions from the spec**

1. Hero name letters rise in with a 0.045s stagger, then Semi (the semicolon
   mascot) drops in at 1.1s with a bounce.
2. Clicking Semi makes it hop and say the next line: "hi, I'm Semi." → "a full
   stop? never." → "still here;" → "okay, back to work." Its eyes blink every 5s.
3. Magnetic hero buttons (max ~7px x, 6px y), spring back on leave.
4. Project cards: 3D tilt toward the cursor (max 3deg), lift 4px, image zoom 1.04.
5. The thread: SVG line in the left gutter, x = 58 + 22·sin(y/280), from y 140
   to the footer. An accent copy draws with scroll (ScrollTrigger scrub), led by
   a glowing dot, ending in a semicolon. Hidden under 1100px.
6. Now playing: three equalizer bars + track/artist from Spotify (server route,
   cached ~30s; "last played" when nothing is playing). As built (closed
   2026-11-12): data via Last.fm, 10s edge cache, 15s poll, skipped in
   background tabs, refetched on tab focus, links to the Spotify profile.
7. Local time (Asia/Kolkata) with a mood: <6 "probably shipping", <12 "coffee,
   then code", <18 "deep in the work", else "extra-hours mode".
8. Footer CTA hover: text turns accent, small Semi looks up (eyes open, -8deg).
9. Dark mode toggle: saved in localStorage, follows prefers-color-scheme on the
   first visit. Since 2026-11-11 the toggle is a hanging light bulb
   (`components/site/Bulb.tsx`, user's request): Verlet rope from the nav's top
   edge, click = impulse + theme switch, lights on = light theme. The light
   spreads out of the bulb (View Transition clip-path) and draws back in when
   turned off; the bulb has its own `view-transition-name` so it keeps swinging
   on top. The rAF loop stops once the bulb is at rest.
10. prefers-reduced-motion turns all animation off.

Keep ashOS linked from the nav, the hero ("prefer a terminal? launch ashOS →")
and the footer.

**Done means:** at 1440px and 390px wide, layout, spacing, type and colour match
the source, and all 10 interactions behave the same. The additions under
"Added 2026-11-12" below are deliberate departures from the source.

## Contact email

`hello@iamashutosh.com` (`links.email` / `links.emailLabel` in `content.ts`).
Cloudflare Email Routing forwards it to the user's personal Gmail. It stays the
address the site shows. Since 2026-11-12 the user is fine with their personal
Gmail and phone number appearing publicly (the résumé PDF has both; "hello@
might not always work, so my personal one should work"). Don't flag them as a
leak; don't add the personal address to the site unless the user asks.

There is no server-side email. The user declined Resend (2026-11-12) and doesn't
want visitors sending mail through the site, so `/api/contact` was removed. Don't
add a sending service back, and don't remove ashOS Mail either: its Send opens
the visitor's own email app via `mailto:`.

## ashOS (`/desktop`)

A macOS-inspired desktop, rebuilt 2026-11-11, opened from the site in a
full-screen iframe. It is fully separate from the site:

- **Content:** everything comes from `content.ts` through
  `app/desktop/_os/data/portfolio.ts`. Never hardcode personal facts in ashOS.
  Placeholders show as-is; `"#"` links show as "not linked yet".
- **Styles:** `app/desktop/os.css` is plain CSS, every selector under `.ashos`,
  keyframes prefixed `ashos-`, no Tailwind, no `:root`/`html`/`body` rules.
  Write `-webkit-backdrop-filter` *before* `backdrop-filter`: the minifier keeps
  only the last of the pair, and Chromium needs the unprefixed one. ashOS uses
  system fonts, not the site's.
- **Settings** live in `localStorage` under `ashos:*` keys and never touch the
  site's `theme`. "Auto" appearance starts from the `?theme=` the site passes in.
- **Structure:** `_os/data` (apps, virtual file system, docs, wallpapers),
  `_os/state` (prefs, window-manager reducer, OS context), `_os/ui` (window,
  menu bar, dock, Spotlight, panels, desktop icons), `_os/apps` (Finder, About
  Me, Projects, Terminal + `shell.ts`, Safari, Mail, Résumé/Preview/Photos,
  System Settings). Wallpapers in `public/ashos/wallpapers/`.
- Browsers keep ⌘W/⌘Q/⌘Tab, so ashOS shortcuts also work with ⌥ (menus show ⌥).
- Mail's Send opens the visitor's email app (`mailto:` to `hello@`), then files
  the message under Sent as "Opened in your email app" with Copy Message /
  Copy Address in case no mail app opened. It never claims the mail was sent.
- Shared with the site: `components/HobbyIcon.tsx` (hobby chip icons) and the
  About photo (`person.photo`, shown while `features.aboutPhoto` is on).
- The Résumé app checks for the résumé PDF (`links.resume`) at build time
  (`page.tsx`), so no 404 probe runs in the browser.

## Status (as of 2026-11-13)

### Done

- Full v4 rebuild: every section, the 10 interactions, dark mode, responsive
  layout below 860px, ashOS opening in a full-screen iframe.
- Motion upgrade with Lenis + GSAP ScrollTrigger: page-load sequence, masked
  section-label reveals, content fade-ups, card stagger, magnetic footer email
  link, row hover shift with arrow and draw-in underline, word-by-word footer
  headline, circular dark-mode reveal (View Transitions API, fade fallback),
  nav that hides on scroll down and shows on scroll up.
- Lighthouse performance: 100 desktop, 0ms blocking time, 0 layout shift.
  Mobile scored 89–91 in the cloud sandbox and 88 on the user's Mac (Lighthouse
  12.8, after the font trim below); scores vary by machine, so only compare
  runs made on the same machine.

Decisions made along the way (keep unless the user says otherwise):

- The page-load intro is CSS, not GSAP, so it starts on first paint. This is
  what keeps mobile above 90.
- GSAP, ScrollTrigger and Lenis load as one deferred bundle about 1.2s after
  load (`components/site/Motion.tsx` → `motionEngine.ts`).
- Scroll-reveal content is hidden before first paint only when motion is
  allowed. If JS never loads, everything still shows.
- Underlines show on hover only. The nav is sticky.
- In-page jumps clear the nav: sections (and `#main`, `#contact`) carry
  `scroll-margin-top` equal to the nav's height (97px, 81px under 640px, in
  `site.css`; update it if the nav's padding changes). `scroll.ts` applies it
  only when the nav will be showing (upward jumps, reduced motion, keyboard
  focus in the nav); downward jumps land at the top as the nav slides away.
- `/robots.txt` and `/sitemap.xml` are Next metadata routes (`app/robots.ts`,
  `app/sitemap.ts`) built from `meta.url`. `/desktop` has its own canonical and
  is in the sitemap. Every sitemap `<lastmod>` is `meta.updated` in
  `content.ts`: bump it by hand (YYYY-MM-DD) whenever the content changes.
- The nav's frosted glass (`.site-nav::before`, 72% bg + 14px blur) only works
  because its fade-in uses `animation-fill-mode: backwards`. A held opacity
  animation (`both`/`forwards`) on the nav makes it a backdrop root and kills
  the blur, which is how it shipped until 2026-11-12. Playwright's headless
  WebKit never renders backdrop-filter, so check Safari on a real device.
- The magnetic return settles with one soft overshoot (it used to wobble twice).
- Effects that animate something other than transform/opacity, on purpose:
  hero letter blur, the thread drawing in, the dark-mode clip-path reveal, its
  fade fallback, and the footer CTA colour change.

### History

**Verified 2026-11-11** (Playwright, 1440px + iPhone 13 at 390px, production
build): all 10 interactions, Semi sway (inner layer rocks -3°↔3° while idle),
dark mode (toggle, reload, OS-dark first visit, ashOS iframe gets `?theme=`),
mobile menu, no sideways scroll, reduced motion, and every motion item.
Lighthouse (sandbox): desktop 100, mobile 89–91, CLS 0.

Fixed in that pass:
- In-page links (logo, nav, mobile menu, hero CTA) go through
  `components/site/scroll.ts`, which resyncs Lenis before `lenis.scrollTo`
  (Lenis ignores native scrolls mid-glide and no-ops when the target equals
  a stale targetScroll). Lenis `anchors` is off. Keyboard scroll keys and
  scrollbar presses stop a running glide. The logo always lands on 0.
- Nav auto-hide: only *keyboard* focus (`:focus-visible`) keeps it shown; a
  mouse click on a nav link used to pin it open for good.
- Résumé links all spread `resumeLink` from `content.ts`. In Chrome the click
  downloads (download beats target for same-origin).
- Favicons (`public/favicon.svg` / `.ico`, wired in `app/layout.tsx`). Row titles get the draw-in underline (`.ul`).
  Letter stagger 0.045s, Semi drop at 1.1s. Thread lead dot fades out as the
  semicolon lights. Reduced motion also drops the card zoom and row shift.

**Added 2026-11-12** (merged; inspired by a teardown of manishluci.com; each
item was approved by the user):

- Hero badge: "Open to full-stack & AI engineering roles · Mumbai or Bangalore ·
  remote or relocation" (`hero.status` + `hero.statusDetail`), faint green wash
  (`.open-badge`).
- Skip-to-content link and a `<main id="main">` landmark.
- Section headlines (`sections.*.line` + `accent`, plain + italic-serif accent)
  on **Writing and Beyond work only**. The user had the other six removed;
  don't add them back.
- Footer contact block: intro paragraph + "I can help with" numbered list
  (`footer.intro`, `footer.help`, approved for now). The intro is Inter Tight 18px
  muted: the user rejected Newsreader italic there ("extremely terrible").
- Footer email with a ↗ arrow, small "Copy" button under it
  (`CopyEmail.tsx`, announces to screen readers). Layout since reworked: see
  "Footer rework" below.
- Footer stats pill (`FooterStats.tsx`): page views (Semi's blinking eyes) │
  Semi pokes (Semi's 12px head, click to poke; hero pokes count too, 20 per
  visitor). Plus "Back to top ↑" (`BackToTop.tsx`). Data: `/api/views`,
  `/api/pokes`, `app/api/_lib/counter.ts` (KV, in-memory under `next dev`).
- Writing rows show where each post lives (`posts[].where`, "LinkedIn" now,
  "Blog" later); external links open in a new tab; "More on LinkedIn ↗" goes to
  the LinkedIn activity page. The user wants to keep "mostly on LinkedIn".
- Beyond work: label column 180px; headline + text on the left, the photo on
  the right level with the headline (`sm:mt-[28px] sm:mr-5`, tuned by the user
  so the caption lines up with the last chip row). Phones: headline → photo →
  text. Hobbies are chips with line icons (`components/HobbyIcon.tsx`, shared
  with ashOS): Music, Netflix, Gym.
- About photo (kept): `public/about/ashutosh.webp`, 480×600, **not mirrored**
  (the user wants it as shot), tilted +2.5deg, straightens on hover, caption
  "me, mid-hackathon".
- Accessibility: job/win/toolkit/principle/post titles are `h3`; every section
  has `aria-labelledby`; project demos have alt text (`projects[].alt`).
- JSON-LD `Person` (name, url, jobTitle, email, LinkedIn, GitHub, X) in `page.tsx`.
- ashOS mirrors all of it: status + location pills, photo avatar, hobby icons,
  "Work With Me.md", `Me.webp` in Finder, `contact`/`writing` terminal output.
- "All projects →" stays (points to `#` until there's more work to list).

**Shipped 2026-11-12** (merged to `main` at the user's request):

- Phones: the Hackathons screenshot shows below the story under 900px (it used
  to be hidden); the About photo and hobby chips are centred under 640px.
- Nav glass: the frosted blur never rendered before (see the nav note under
  "Decisions"). Now it does, at the original 72% tint + 14px blur. The user
  confirmed it in Safari on their iPhone (2026-11-12).
- Now playing (hero + ashOS Control Centre) always links to the user's Spotify
  profile (`links.spotify`), not a Last.fm track page; the API no longer returns
  a track URL. With no track it shows paused bars and "Silence, for now;"
  (`hero.nowPlaying.fallback`).
- Now-playing data comes from Last.fm (`LASTFM_*` env vars win over the Spotify
  ones). The user has no Spotify Premium, so Spotify's Web API (real-time) is
  out. The user's Last.fm keeps up with Spotify fine (checked 2026-11-12). The lag
  they saw was the page: a 30s poll + 30s edge cache, and background tabs
  (Safari throttles timers) showing the song from when they left. Fixed the
  same day: 10s edge cache, 15s poll, refetch on `visibilitychange` (hero +
  ashOS), so a change shows within ~25s, instantly on returning to the tab.
  If it ever lags again, compare Last.fm's `user.getrecenttracks` with
  `/api/now-playing` first. Faster scrobblers (Pano Scrobbler on Android, Web
  Scrobbler for the web player) only matter if Last.fm itself falls behind.
- Nav links: Work · Experience · Writing · About · Contact (`#contact` = the
  footer), same list on desktop and the mobile menu. ashOS: Contact tile on
  Safari's Start Page opens Mail.

**Footer rework, 2026-11-12** (merged to `main` at the user's request; approved
after a second look at manishluci.com's footer):

- Two columns. Left: the CTA headline (64px, Semi inline after the last word
  at every size), intro, then the email (28px, ↗ right after it) + Copy; the
  user asked for the email on the left to fill that side. Right: "I can help
  with" list, then social rows "LinkedIn · imashutoshgupta ↗"
  (`footer.socials`). One column under 768px.
- Bottom bar behind a full-width line: wordmark "Ashutosh Gupta" in Newsreader
  italic with a violet semicolon (`footer.wordmark`; the user asked for the
  full name) and the sign-off "Designed and built, mostly after hours" under
  it (no name: the wordmark says who; the user didn't want "Ashutosh" twice).
  Right side: ashOS · Résumé, stats pill, Back to top. The bar has **no social
  links**: the user called them repeats of the rows above. Don't add them back.
- Social rows underline label + handle together on hover (`.mail` + `.ul`).
  JSON-LD `sameAs` has X.
- ashOS: X in the contact card, Contact folder, Portfolio Overview.pdf links, Mail
  (`xLogo` glyph; `x` is the close icon), Terminal `contact`, Safari start page.

**Docs cleanup, 2026-11-12:** `README.md` rewritten for visitors (logo, preview,
links, ashOS tips, selected work, résumé, GitHub stats, contact; local setup
folded away). Its technical content moved here. AGENTS.md and HANDOFF.md
retired; Claude's memory notes folded into this file.

**Review fixes, 2026-11-12** (each batch merged to `main` at the user's
request, tested before/after and against the live site; suites in
`C:\Users\admin\portfolio-qa`, see Testing notes):
- Batch 1: counters only take same-origin writes, rate-limited per IP
  (`COUNTER_LIMIT`), errors answer the current count; preview builds get the
  counter bindings; ashOS nested-folder duplication, AltGr/⌥ typing vs
  shortcuts, Terminal in a deleted folder.
- A (ashOS): boot splash, focus follows the active window, Photos keys, Finder
  Back, menu Esc, Dock auto-hide, ⌥M in full screen, icon keys.
- B (touch): touch drag/resize on tablets, pointerType from pointerdown
  (Safari), long-press context menus (`ui/longPress.ts`).
- C (content): project demos in ashOS (`ui/Demo.tsx`, Demo.mp4 nodes), login
  from content, alt text from content, full Overview, `approach` in help.
- D (rough edges + a11y): `open` typos, Safari self-framing and `//host`,
  `theme` validation, Screenshot.webp, platform key labels, rename guards,
  menu/submenu/context-menu focus, toast buttons, Finder activedescendant,
  Mail list, `words`, Safari reload, reduced motion from frame one, Safari
  address field select race.
- E (site): nav-clear in-page jumps (scroll-margin + `scroll.ts`), bulb double
  switch, project links in new tabs (`components/site/external.ts`),
  robots.txt + sitemap.xml, /desktop canonical, site's ashOS link inside
  ashOS's Safari.
- F (site, 2026-11-13): Now playing never browser-cached (`no-store` to
  browsers; only the `caches.default` copy has max-age=10, since Cloudflare
  rewrote a cached max-age to the zone's 4h Browser Cache TTL) + `cache:
  "no-store"` fetches (Hero, ashOS Panels); `public/_headers` gives
  `/_next/static/*` a year, immutable; `@media print` in site.css (reveals
  visible, nav static, thread hidden, dark prints light); keyboard focus is
  nudged out from under the shown nav (`Nav.tsx` focusin + `nudgeScroll` in
  `scroll.ts`, no scroll-padding); Semi's speech goes to one persistent
  sr-only `role="status"` region (the bubble is aria-hidden); security
  headers from `next.config.mjs` `headers()` on everything but `*.pdf`
  (nosniff, Referrer-Policy, CSP `frame-ancestors 'self'; object-src 'none';
  base-uri 'self'`, HSTS 1 year without includeSubDomains/preload, since
  http:// already 301s), `poweredByHeader: false`; a `<noscript>` link row in
  the nav for phones without JS (CSS hides the dead menu button only then);
  the footer marks a view counted only after the POST succeeds (a KV write
  that fails still answers 200 with the old count and gets marked: known,
  left alone).
- G (ashOS, 2026-11-13): AltGr only with Ctrl (Firefox on a Mac reports
  AltGraph for ⌥); focus goes back to the active window when Spotlight, a
  panel, a menu or Quick Look closes (`returnFocus` in `ui/Window.tsx`);
  shortcuts follow the keyboard layout (`shortcutCode` in `Desktop.tsx`:
  e.key letter → `getLayoutMap()` → e.code); drags end cleanly when a window
  closes mid-drag (listeners on window); the auto-hide Dock stays up under
  its own menu; Spotlight closes open menus; long-press no longer eats
  keyboard Enter; Space works on Quick Look's controls. Terminal: on a Mac
  ⌥W/⌥Q close/quit even though they'd type ∑/œ (all other ⌥ keys type; in
  `help`). About's toolbar fits by window width (title + tabs → tabs only →
  dropdown); Finder and Mail fit at their min sizes (container queries);
  Spotlight hides only /Trash itself and inside it; Safari follows in-frame
  navigation; Recents drop missing files; `open ../x` errors show the
  resolved path. Wiring: Writing/Beyond work headlines, `person.signoff`,
  the RootCause screenshot (Achievements + Photos), tab/label titles from
  content.
- H (SEO, 2026-11-13): JSON-LD is one `@graph` in `app/(site)/page.tsx`
  (WebSite, ProfilePage, Person with `@id`, `meta.jobTitle`, worksFor from
  the current job, knowsAbout from the toolkit, award from wins; nothing
  with "[" or "#" goes in); /desktop has its own share preview, with the
  shared openGraph/twitter base in `app/shared-metadata.ts` (a child
  openGraph replaces the parent's whole object); twitter:creator from
  `links.x`, og:locale en_IN; sitemap lastmod = `meta.updated`; /desktop's
  server HTML has a visually hidden h1 + sentence + link to / for crawlers
  (ashOS strings `ashos.pageTitle` / `pageDescription` in content.ts).
- I (SEO, the user's decisions, 2026-11-13): title "Ashutosh Gupta —
  Full-stack & AI Engineer", description "Ashutosh Gupta, full-stack & AI
  engineer. I build products end to end, and the AI inside them." (the user
  wants it timeless: no job-hunt line, no wins); `meta.jobTitle` the same
  role; web manifest name follows. The hero `<h1>` is a visually hidden
  heading with just the name, before the name row (now a `div` with the
  exact old classes): pixel-identical in Chromium + WebKit at 320–1600px,
  light/dark, pokes, intro frames, fallback fonts, focus, print. Don't put
  `display: contents` on the heading (VoiceOver drops such headings from its
  heading list, WebKit bug 261978). Share image `public/og-2026-11.png`
  (regenerate with `portfolio-qa/og-shot-i.mjs`; new look = new file name;
  the old `og.png` stays). JSON-LD `homeLocation` Mumbai (`meta.home`);
  the user declined college/alumniOf and the photo as `image`, and declined
  a visible "based in Mumbai". Placeholders stay as they are (user's call).
  Axiomic is the missing "[Project one]": add nothing until the user says.

### Open

**Review round 3 backlog** (found 2026-11-13 by five read-only Opus reviewers
against a `main` build on :3100; every item reproduced, repro scripts are the
`review3-*.mjs` files in `portfolio-qa`, run as `node --no-warnings <script>
http://localhost:3100`; FAIL = bug present). Severity: H/M/L.

K — site (`components/site/*`, `site.css`, `app/layout.tsx`), branch `fix/site-batch-k`:
- K1 M. The ashOS takeover doesn't make the page behind it inert: Shift+Tab
  from "Exit to site" lands on footer links under the dialog and scrolls the
  hidden page to the footer; screen readers can browse it. `AshOS.tsx:57-77`
  (only `aria-modal`). Fix: `inert` on the page container (and the thread)
  while open. Repro `review3-site-takeover.mjs`, `review3-a11y-takeover.mjs`.
- K2 M. Mobile menu can't be scrolled on landscape phones: nav + menu is
  472–488px in a 320–342px viewport, sticky at top 0, so Contact / ashOS /
  Résumé are unreachable. `Nav.tsx` `#mobile-menu`. Fix: max-height
  `calc(100dvh - nav)`, `overflow-y: auto`, `overscroll-behavior: contain`,
  `data-lenis-prevent`. Repro `review3-site-menu.mjs`.
- K3 L. Esc in the mobile menu with focus on a link drops focus to `<body>`.
  `Nav.tsx:97`. Fix: focus the menu button. Repro `review3-site-menu.mjs`.
- K4 L. `theme-color` follows the OS, not the bulb (white browser bar over the
  dark page). `app/layout.tsx` `viewport.themeColor`. Fix: one meta updated by
  `THEME_SCRIPT` and `Bulb.tsx` `apply()`. Repro `review3-site-bulb.mjs`.
- K5 L. Deep links at phone width (`/#experience` etc.) hide the nav on the
  browser's hash scroll but keep the 81px scroll-margin, so a slice of the
  previous section shows. `Nav.tsx` `useAutoHide`. Repro `review3-site-deeplink.mjs`.
- K6 L. Semi vanishes in forced-colours mode (spans drawn with background).
  `Hero.tsx:51-73`. Fix: `@media (forced-colors: active)` → `CanvasText`.
  Repro `review3-a11y-site.mjs`.
- K7 L. One hero poke is announced twice (Semi's line + the off-screen
  footer pill's "N pokes"). `FooterStats.tsx:106`. Repro `review3-a11y-site.mjs`.

L — ashOS UI (`_os/ui/*`, `os.css`), branch `fix/ashos-batch-l`:
- L1 M. Renaming a desktop icon: Space presses the icon button (opens the
  folder, name ends at "my"); clicking the empty desktop discards the typed
  name; blur-commit doesn't carry the icon position. `DesktopIcons.tsx:251,
  267, 278, 104, 290, 296`. Repro `review3-ashos-rename.mjs`.
- L2 M. The Dock runs off screen with several minimised windows (iPad mini
  6 minimised: -86→854; 1366×768 Dock left: -32→800; Finder/Trash
  unreachable). `os.css` `.ashos-dock` (~2944). Fix: shrink to fit.
  Repro `review3-ashos-dock.mjs`.
- L3 L–M. On phones the green light still enters full screen: menu bar hides
  (no hover on touch), 28px gap, Minimise disabled. `Window.tsx:107`,
  `MenuBar.tsx:214`. Repro `review3-ashos-phonefs.mjs`.
- L4 L. iPad: long-press on Dock items opens no menu (batch B covered icons
  and Finder only). `Dock.tsx:126, 164, 179`. Repro `review3-ashos-docktouch.mjs`.
- L5 L–M. Menu bar ARIA malformed (menubar children are nav/generic/status
  buttons; role on `<header>`), Left/Right do nothing on titles.
  `MenuBar.tsx:222-223, 249`. Repro `review3-a11y-ashos.mjs`.
- L6 M. Focus ring 2.1–2.2:1 on window surfaces (accent at 55%).
  `os.css:152-154`. Fix: opaque accent. Repro `review3-a11y-ashos.mjs`.

M — ashOS state + Terminal (`Desktop.tsx`, `Root.tsx`, `state/*`, `data/fs.ts`,
`apps/Terminal.tsx`), branch `fix/ashos-batch-m`:
- M1 H. ashOS crashes ("This page couldn't load") when site data is blocked:
  `sessionStorage` read without try/catch (`Desktop.tsx:216-217`,
  `Root.tsx:17`); also a wrong-shaped `ashos:fs` / `ashos:recents` crashes it
  for good (`prefs.ts:76` `load()` doesn't check shape; `fs.ts:511`,
  `os.tsx:199`). Prefs aren't validated either. Repro
  `review3-ashos-blocked.mjs`, `review3-ashos-storage.mjs`,
  `review3-code-sessionstorage.mjs`.
- M2 M. Terminal swallows Tab and Shift+Tab (keyboard trap, worst inside the
  site takeover); ⌥Tab also runs completion. `Terminal.tsx:225`. Repro
  `review3-a11y-ashos.mjs`, `review3-ashos-term.mjs`.
- M3 M. Terminal output isn't announced (no live region). `Terminal.tsx:178-205`.
  Fix: `role="log"` on the output lines. Repro `review3-a11y-ashos.mjs`.

N — server, caching, SEO (`app/api/*`, `open-next.config.ts`, `wrangler.jsonc`,
`content.ts`), branch `fix/server-batch-n`:
- N1 H. Live demo videos ignore Range requests: `Range: bytes=0-1` →
  200 full file, no `Accept-Ranges` (Workers static assets). iOS Safari needs
  206 to play `<video>`. Local `next start` is fine (206). Fix: worker in
  front of `/projects/*.mp4` answering 206 (`assets.run_worker_first`).
  Repro `sh review3-perf-range.sh https://iamashutosh.com`.
- N2 L–M. Every page request re-renders on the worker (`x-nextjs-cache: MISS`,
  ~45ms extra): `open-next.config.ts` uses the "dummy" incremental cache.
  Fix: `staticAssetsIncrementalCache` + `enableCacheInterception`.
  Repro `curl -sD - -o /dev/null https://iamashutosh.com/`, `review3-perf-ttfb.sh`.
- N3 L. `/api/now-playing` upstream fetches have no timeout (a stalled
  Last.fm hangs every poll). `route.ts:44, 73, 95, 103`. Fix:
  `AbortSignal.timeout(4000)`; also return `live:false` if a track has no
  name. Repro `review3-code-np-timeout.mjs`.
- N4 L. `meta.updated` not bumped after batch I (sitemap lastmod 2026-11-12).
  `content.ts:26`.

Waiting on the user's decision (asked 2026-11-13; batch O once answered):
- Thread crosses the hero text at 1101–~1344px (`site.css` hide breakpoint
  1100 is the spec's; `review3-site-thread-overlap.mjs`). Recommended: hide
  below ~1345px.
- ashOS `--text-3` informational text 2.1–2.5:1 (`os.css:17, 59, 2487`).
  Recommended: those uses → `--text-2`.
- White on accent fills 1.6–4.0:1 (`.ashos-btn--primary`, menu highlight,
  selected labels). Recommended: darker per-accent fill in `ACCENTS`.
- White desktop icon labels on the light wallpaper 1.5–1.9:1 (`os.css:275`).
  Recommended: stronger halo.
- Traffic lights 20px apart, menu rows 22px (WCAG 2.5.8). Recommended: 24px.
- 10 idle animations loop forever (WCAG 2.2.2; reduced motion stops them).
- New-tab links don't say so to screen readers (wording).
- The 404 page is Next's unstyled default with two `<title>`s and the home
  canonical (`app/not-found.tsx` missing; wording + look).
- N1: does a demo actually play on the user's iPhone today?

**Review round 2 backlog:** F, G, H and I are done and live (2026-11-13, see
the review-fixes history); J was dropped.

J — DROPPED by the user on 2026-11-13: no case-study pages, no
`/writing/[slug]` copies. Don't propose them again. (`/llms.txt` was part of
J; also dropped.)

**Owner to-do outside the code** (Claude can't log in to these; give steps):
- Cloudflare: DONE and checked with curl 2026-11-13: http:// → https 301,
  http://www → https://www 301 → apex 301. Still to do: Security → Bots → Block AI bots = allow, AI
  Crawl Control: allow search/answer bots, managed robots.txt off; Crawler
  Hints on; HSTS is sent by the app since batch F (no need in Cloudflare); optional Web Analytics.
- Google Search Console (domain property, submit sitemap, request indexing),
  Bing Webmaster Tools (import from GSC), LinkedIn (website + Featured +
  headline, Post Inspector), GitHub (profile website/location/README, pins,
  repo website fields), GlyphX `package.json` homepage/author.url, X bio,
  Naukri/Wellfound/Peerlist, Reddit only via genuine participation (r/webdev
  Showoff Saturday).

Small follow-ups to offer the user (not decided):
- The share image shows the hero badge ("Open to … roles"); it goes stale
  when the job hunt ends. A badge-free render is one command.
- Since batch G, ashOS's About toolbar shows the full "Hackathons & wins"
  tab label, so at the default window size it hides the "About Me" title.

Waiting on the user's content (don't invent it; the user is keeping these open):
- **Projects one and four** are placeholders (`[Project one]`, `[Project four]`),
  and "All projects →" plus the case-study links point to `#`.
- **Writing** rows are placeholders until the user sends LinkedIn post links.
  LinkedIn blocks automated reading, so don't try to scrape them.
- **Kind words**: both quotes are placeholders.

When real projects land, add them to the README's "Selected work" table too.

### Closed (don't reopen unless the user does)

- Fonts: the user tried the reference site's fonts on 2026-11-12 (DM Sans body,
  Josefin Sans headings, Fraunces italic accents), disliked them and had them
  reverted. Inter Tight / Newsreader italic / Sacramento / JetBrains Mono stay:
  in the user's words, "absolutely the best". Don't suggest a font change again.
- Newsreader's optical-size axis: dropped 2026-11-12 (user compared it on a dev
  server and approved). The italic file went 147KB → 64.5KB (preloaded fonts
  246KB → 164KB). Large italics look a touch sturdier; the user is fine with it.
  Mobile Lighthouse on the user's Mac: 85–87 → 88, LCP ~4.2s → 3.9s.
- Mobile LCP is the hero heading, and ~89% of it is render delay from the
  letter rise-in intro, not fonts or network. Any further mobile gain would
  mean changing that intro, a design call: don't do it unasked. Headless
  Lighthouse often fails with NO_LCP on this page; rerun and count only the
  runs that complete.
- Floating glass-pill nav: built and tried on 2026-11-12 (the frosted layer
  gathered into a pill on scroll); the user preferred the existing full-width
  bar and had it reverted. Don't offer it again.
- Nav frosted glass in Safari on the user's iPhone and the reworked footer on
  a real phone: both checked by the user and working (2026-11-12).
- Hackathons & wins: RootCause (Paytm Build for India) is the only win.
- About photo: kept; the user likes it. Don't put it anywhere else (hero,
  favicon, OG) unless asked: "no need to bombard the website with our photo."
- Footer: reworked and merged 2026-11-12 (details under "Footer rework"),
  including the cramped phone spacing. Footer copy, the two section headlines
  and the hobby lines are approved.
- Now playing / Spotify: Last.fm feed, Spotify-profile link, idle line and
  refresh timing are done (details under "Shipped 2026-11-12"). Reopen only if
  the user reports a problem.
- Writing source labels ("LinkedIn" / "Blog"): closed 2026-11-12. The user
  will set the labels themselves when they add their real writing. Don't list
  it as an open or later item.
- The thread stays (see Ground rules).
- Nav links: the user declined a Wins link (2026-11-12).
- `public/Ashutosh_Gupta_Resume.pdf` is the user's final résumé. Replace it only
  with a file they send; never edit or regenerate it. Its personal Gmail and
  phone number are there on purpose (see Contact email).
- LinkedIn is `linkedin.com/in/imashutoshgupta` (changed 2026-11-12 at the user's request; the user also pushed an updated résumé PDF that day). Toolkit
  and Experience match the résumé too. X is `x.com/im_AshutoshG` (`links.x`).
- Footer counters: `/api/views` and `/api/pokes` read the `COUNTERS` KV
  binding (namespace `portfolio-counters`, in `wrangler.jsonc`).
- Experience rows have no arrow (they aren't links); writing rows do.
- Preview builds have no Last.fm key, so Now playing shows the idle line
  there. The user is fine with that (2026-11-12): production has the key.
  Preview secrets would need `npx wrangler preview base-config secret put`.

## Testing notes

- `npm run dev` serves on :3000. For Lighthouse, use a production build
  (`npx next build && npx next start -p 3100`) and stop it afterwards.
- Install Playwright and Lighthouse in a scratch folder, not in this project,
  so `package.json` stays untouched. On the user's Mac, launch Chromium with
  `channel: "chrome"` (the cached Playwright browsers don't match). In a cloud
  sandbox, use Playwright's own Chromium (`npx playwright install chromium`).
- When hovering rounded elements in tests, aim inside the corners. The corner
  pixel misses the hit area.
- **Test suites live in `C:\Users\admin\portfolio-qa`** (outside the repo, with
  Playwright in its own node_modules; browsers in the user's ms-playwright
  cache). Each takes the base URL as its first argument and prints one
  PASS/FAIL line per check: `smoke.mjs`, `ashos-test.mjs` (batch 1),
  `batch-a.mjs` … `batch-e.mjs`, `batch-f.mjs`, `batch-g-ui.mjs`,
  `batch-g-apps.mjs`, `batch-h.mjs`, `batch-i.mjs` (always run with
  `node --no-warnings`). Extras: `batch-i-visual.mjs <before> <after>`
  (hero pixel diff, Chromium + WebKit; its "LCP element" line is info only and
  flaky), `heading-check.mjs` (the h1 by role at five widths), `og-shot-i.mjs`
  (renders the share image). `review2-*.mjs` are old repro scripts (some still
  use the pre-I `h1 button` selector). `site-counters.mjs` is
  hardcoded to `wrangler dev` on :8787. Run them all after every batch.
- Playwright's bundled Chromium can't play the H.264 demos: tests that need
  video launch installed Chrome (`channel: "chrome"`).
- Running browser tests against the live site adds real page views (each fresh
  session counts one). Prefer the local build; on live, run only the batch's
  own suite and `smoke.mjs`. `curl` GETs don't count.
- On Windows, stopping a background `npx next start` can leave its node child
  listening: free the port with PowerShell
  `Get-NetTCPConnection -LocalPort 3100 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`.
  Parallel agents need their own worktree and port (3101, 3102, …) — two
  `next build`s in one working tree clobber each other's `.next`.
- To see when a push to `main` is live, compare the `/_next/static/…js` list
  in the page's HTML before and after (the first-party robots.txt can't be
  used: Cloudflare serves a managed one when the app has none).
