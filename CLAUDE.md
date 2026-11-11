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
03 Hackathons & wins · 04 Writing · 05 Toolkit · 06 How I work · 07 Kind words ·
08 Beyond work · Footer

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
   first visit.
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

**Next step: verify and fix.** The user had queued this before stopping:

1. Check each item in a real browser (Playwright) at 1440px and at 390px
   (mobile, touch): the 10 interactions, dark mode (toggle, persistence after
   reload, first visit with the OS set to dark, ashOS opening in the same
   theme), the mobile menu, no sideways scroll, and each motion item above.
2. Semi sway: Semi has three nested elements, drop (outer) › hop › sway (inner).
   The inner one should sway forever: 3.4s ease-in-out infinite,
   transform-origin 50% 100%, rotate -3deg → 3deg → -3deg. Watch it for ~10s
   while idle to confirm.
3. Lenis anchors: every in-page link (logo, nav, mobile menu, hero "See
   selected work") should go through `lenis.scrollTo`. Lenis must stay in sync
   after native scrolls (scrollbar drag, keyboard). The logo must always reach
   scrollY 0, even after `document.documentElement.scrollTop = 3000`.
4. Reduced motion: no animation at all, and magnetic buttons and card tilt off.
5. Known gaps:
   - **No favicon.** Add `app/icon.svg`: a violet (#5B3FD6) rounded square
     with a white semicolon.
   - **No `public/resume.pdf`** (there's no `public/` folder), so résumé links
     404. Don't create a fake PDF; tell the user.
   - **Résumé links don't match.** `content.ts` exports `resumeLink` (href,
     download, target, rel), but nothing uses it. `Nav.tsx` uses
     `download=""` and `Hero.tsx` uses neither. They should all point to
     `/resume.pdf` with `target="_blank"` and
     `download="Ashutosh-Gupta-Resume.pdf"`. In Chrome, `download` wins over
     `target` for same-origin files, so report what actually happens.
6. Deliver a table (feature | works / broken / missing | what's wrong | file),
   marking which rows were fixed. Keep fixes small and don't redo work that
   passes.

**Later / optional**

- Mobile Lighthouse headroom: the largest remaining cost is a ~147KB font,
  probably Newsreader italic with its optical-size axis. It affects how the
  font looks, so ask before changing it.
- Fill in the `[placeholder]` content in `content.ts`.

## Testing notes

- `npm run dev` serves on :3000. For Lighthouse, use a production build
  (`npx next build && npx next start -p 3100`) and stop it afterwards.
- Install Playwright and Lighthouse in a scratch folder, not in this project,
  so `package.json` stays untouched. On the user's Mac, launch Chromium with
  `channel: "chrome"` (the cached Playwright browsers don't match). In a cloud
  sandbox, use Playwright's own Chromium (`npx playwright install chromium`).
- When hovering rounded elements in tests, aim inside the corners. The corner
  pixel misses the hit area.
