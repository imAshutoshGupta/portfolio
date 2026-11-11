# Portfolio v4 — project notes for Claude

Personal portfolio for Ashutosh Gupta: a Next.js rebuild of a "v4" design, plus
the older interactive **ashOS** terminal desktop at `/desktop`. See `README.md`
for the stack, file map and env vars.

## Ground rules

- **Never push to `main`.** Cloudflare Workers Builds deploys `main` to the live
  site; other branches get preview builds. Work on `redesign-v4` (or a branch
  off it) and let the user merge.
- **Don't commit unless asked.** The user reviews first.
- Run `npm run typecheck` before calling anything done.
- All copy lives in `content.ts`. `[bracketed]` text and `"#"` hrefs are
  placeholders the user will fill in. Don't invent real content for them.
- `features.thread` in `content.ts` turns the left-gutter scroll line on and off.
  The user has gone back and forth on it (switched off once for looking
  "cringe", then asked for it back). It's currently `true`. Leave it as set
  unless they ask.

## The design spec

The design came from `portfolio-v4-source.html` (a design-canvas export) and
`HANDOFF.md`. Both are research files kept **only on the user's Mac**, not in
the repo. The parts that matter are copied here.

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
   cached ~30s; "last played" when nothing is playing).
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
the source, and all 10 interactions behave the same.

## Status (as of 2026-11-11)

**Done**

- Full v4 rebuild: every section, the 10 interactions, dark mode, responsive
  layout below 860px, ashOS opening in a full-screen iframe.
- Motion upgrade with Lenis + GSAP ScrollTrigger: page-load sequence, masked
  section-label reveals, content fade-ups, card stagger, magnetic footer email
  link, row hover shift with arrow and draw-in underline, word-by-word footer
  headline, circular dark-mode reveal (View Transitions API, fade fallback),
  nav that hides on scroll down and shows on scroll up.
- Lighthouse performance: 100 desktop, 91 mobile, 0ms blocking time, 0 layout
  shift.

Decisions made along the way (keep unless the user says otherwise):

- The page-load intro is CSS, not GSAP, so it starts on first paint. This is
  what keeps mobile above 90.
- GSAP, ScrollTrigger and Lenis load as one deferred bundle about 1.2s after
  load (`components/site/Motion.tsx` → `motionEngine.ts`).
- Scroll-reveal content is hidden before first paint only when motion is
  allowed. If JS never loads, everything still shows.
- Underlines show on hover only. The nav is sticky.
- The magnetic return settles with one soft overshoot (it used to wobble twice).
- Effects that animate something other than transform/opacity, on purpose:
  hero letter blur, the thread drawing in, the dark-mode clip-path reveal, its
  fade fallback, and the footer CTA colour change.

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
- `app/icon.svg` favicon. Row titles get the draw-in underline (`.ul`).
  Letter stagger 0.045s, Semi drop at 1.1s. Thread lead dot fades out as the
  semicolon lights. Reduced motion also drops the card zoom and row shift.

Still open:
- **`public/resume.pdf` doesn't exist**, so résumé links 404. Don't create a
  fake one; the user adds it.
- Experience rows have no arrow (they aren't links); writing rows do.

**Later / optional**

- Mobile Lighthouse headroom: the largest remaining cost is a ~147KB font,
  probably Newsreader italic with its optical-size axis. It affects how the
  font looks, so ask before changing it.
- Fill in the `[placeholder]` content in `content.ts`.

## ashOS (`/desktop`)

A macOS-inspired desktop, rebuilt 2026-11-11. It is fully separate from the site:

- **Content:** everything comes from `content.ts` through
  `app/desktop/_os/data/portfolio.ts`. Never hardcode personal facts in ashOS.
  Placeholders show as-is; `"#"` links show as "not linked yet".
- **Styles:** `app/desktop/os.css` is plain CSS, every selector under `.ashos`,
  keyframes prefixed `ashos-`, no Tailwind, no `:root`/`html`/`body` rules.
  Write `-webkit-backdrop-filter` *before* `backdrop-filter`: the minifier keeps
  only the last of the pair, and Chromium needs the unprefixed one.
- **Settings** live in `localStorage` under `ashos:*` keys and never touch the
  site's `theme`. "Auto" appearance starts from the `?theme=` the site passes in.
- **Structure:** `_os/data` (apps, virtual file system, docs, wallpapers),
  `_os/state` (prefs, window-manager reducer, OS context), `_os/ui` (window,
  menu bar, dock, Spotlight, panels, desktop icons), `_os/apps` (Finder, About
  Me, Projects, Terminal + `shell.ts`, Safari, Mail, Résumé/Preview/Photos,
  System Settings).
- Browsers keep ⌘W/⌘Q/⌘Tab, so ashOS shortcuts also work with ⌥ (menus show ⌥).
- Mail sends through `/api/contact` and only reports "sent" when the API says
  `delivered: true`.
- The Résumé app checks for `public/resume.pdf` at build time (`page.tsx`), so
  no 404 probe runs in the browser.
- `lib/repl.ts` (the old terminal engine with outdated copy) is no longer used.

## Testing notes

- `npm run dev` serves on :3000. For Lighthouse, use a production build
  (`npx next build && npx next start -p 3100`) and stop it afterwards.
- Install Playwright and Lighthouse in a scratch folder, not in this project,
  so `package.json` stays untouched. On the user's Mac, launch Chromium with
  `channel: "chrome"` (the cached Playwright browsers don't match). In a cloud
  sandbox, use Playwright's own Chromium (`npx playwright install chromium`).
- When hovering rounded elements in tests, aim inside the corners. The corner
  pixel misses the hit area.
