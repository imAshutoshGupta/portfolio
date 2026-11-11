# Portfolio v4 — project notes for Claude

Personal portfolio for Ashutosh Gupta: a Next.js rebuild of a "v4" design, plus
the older interactive **ashOS** terminal desktop at `/desktop`. See `README.md`
for the stack, file map and env vars.

## Ground rules

- **Never push to `main` on your own.** Cloudflare Workers Builds deploys
  `main` to the live site; other branches get preview builds. Work on a feature
  branch off `main` and let the user merge. Only merge + push `main` when the
  user explicitly asks in that conversation (they did on 2026-11-12); that
  doesn't carry over to later sessions. Delete merged branches afterwards.
- **Don't commit unless asked.** The user reviews first.
- Run `npm run typecheck` before calling anything done.
- All copy lives in `content.ts`. `[bracketed]` text and `"#"` hrefs are
  placeholders the user will fill in. Don't invent real content for them.
- **Every site change also goes into ashOS**, without being asked: wire new
  content through `app/desktop/_os/data/portfolio.ts` and the apps/docs/shell
  that show it, and say what changed there.
- New features borrowed from elsewhere get re-themed to this site (Semi, the
  semicolon, the violet accent, italic-serif accents), not copied as-is.
- `features.thread` in `content.ts` turns the left-gutter scroll line on and off.
  It's `true`, and on 2026-11-12 the user settled it: they like it and are
  keeping it. Don't suggest replacing it.

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
Cloudflare Email Routing forwards it to the user's personal Gmail. Never put
the personal address on the site, in ashOS or in committed files.

There is no server-side email. The user declined Resend (2026-11-12) and doesn't
want visitors sending mail through the site, so `/api/contact` was removed. Don't
add a sending service back, and don't remove ashOS Mail either: its Send opens
the visitor's own email app via `mailto:`.

## Status (as of 2026-11-12)

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
- The nav's frosted glass (`.site-nav::before`, 72% bg + 14px blur) only works
  because its fade-in uses `animation-fill-mode: backwards`. A held opacity
  animation (`both`/`forwards`) on the nav makes it a backdrop root and kills
  the blur, which is how it shipped until 2026-11-12. Playwright's headless
  WebKit never renders backdrop-filter, so check Safari on a real device.
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

### Open (as of 2026-11-12)

Waiting on the user's content (don't invent it):
- **Projects one and four** are placeholders (`[Project one]`, `[Project four]`),
  and "All projects →" plus the case-study links point to `#`.
- **Writing** rows are placeholders until the user sends LinkedIn post links.
  LinkedIn blocks automated reading, so don't try to scrape them.
- **Kind words**: both quotes are placeholders.

Parked; ask before starting (the user said hold, 2026-11-12):
- Mobile Lighthouse headroom: the largest remaining cost is a ~147KB font,
  probably Newsreader italic with its optical-size axis. It changes how the
  font looks, so ask first.

### Closed (don't reopen unless the user does)

- Nav frosted glass in Safari on the user's iPhone and the reworked footer on
  a real phone: both checked by the user and working (2026-11-12).
- Floating glass-pill nav: built and tried on 2026-11-12 (the frosted layer
  gathered into a pill on scroll); the user preferred the existing full-width
  bar and had it reverted. Don't offer it again.
- Fonts: the user tried the reference site's fonts on 2026-11-12 (DM Sans body,
  Josefin Sans headings, Fraunces italic accents), disliked them and had them
  reverted. Inter Tight / Newsreader italic / Sacramento / JetBrains Mono stay:
  in the user's words, "absolutely the best". Don't suggest a font change again.

- Hackathons & wins: RootCause (Paytm Build for India) is the only win.
- About photo: kept. The user likes it. Still don't spread it elsewhere.
- Footer: reworked and merged 2026-11-12 (details under "Footer rework"),
  including the cramped phone spacing. Footer copy, the two section headlines
  and the hobby lines are approved.
- Now playing / Spotify: Last.fm feed, Spotify-profile link, idle line and
  refresh timing are done (details under "Shipped 2026-11-12"). Reopen only if
  the user reports a problem.
- Writing rows keep the "LinkedIn" source label; the user may bring up "Blog"
  later themselves.
- The thread stays (see Ground rules).
- Nav links: Work · Experience · Writing · About · Contact (`#contact` = the
  footer), same list on desktop and the mobile menu. The user declined a Wins
  link (2026-11-12). ashOS: Contact tile on Safari's Start Page opens Mail.
- `public/Ashutosh_Gupta_Resume.pdf` is the user's final résumé. Replace it only
  with a file they send; never edit or regenerate it.
- LinkedIn is `linkedin.com/in/ashutoshgupta08` (matches the résumé). Toolkit
  and Experience match the résumé too. X is `x.com/im_AshutoshG` (`links.x`).
- Footer counters: `/api/views` and `/api/pokes` read the `COUNTERS` KV
  binding (namespace `portfolio-counters`, in `wrangler.jsonc`).
- Experience rows have no arrow (they aren't links); writing rows do.

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
- Brand kit under `public/brand/` (logos, favicon variants, OG variants) isn't
  referenced by code. It's the user's asset library: keep it.

**Footer rework, 2026-11-12** (merged to `main` at the user's request; approved
after a second look at manishluci.com's footer):

- Two columns. Left: the CTA headline (64px, Semi inline after the last word
  at every size), intro, then the email (28px, ↗ right after it) + Copy; the
  user asked for the email on the left to fill that side. Right: "I can help
  with" list, then social rows "LinkedIn · ashutoshgupta08 ↗"
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
- Mail's Send opens the visitor's email app (`mailto:` to `hello@`), then files
  the message under Sent as "Opened in your email app" with Copy Message /
  Copy Address in case no mail app opened. It never claims the mail was sent.
- Shared with the site: `components/HobbyIcon.tsx` (hobby chip icons) and the
  About photo (`person.photo`, shown while `features.aboutPhoto` is on).
- The Résumé app checks for the résumé PDF (`links.resume`) at build time (`page.tsx`), so
  no 404 probe runs in the browser.

## Testing notes

- `npm run dev` serves on :3000. For Lighthouse, use a production build
  (`npx next build && npx next start -p 3100`) and stop it afterwards.
- Install Playwright and Lighthouse in a scratch folder, not in this project,
  so `package.json` stays untouched. On the user's Mac, launch Chromium with
  `channel: "chrome"` (the cached Playwright browsers don't match). In a cloud
  sandbox, use Playwright's own Chromium (`npx playwright install chromium`).
- When hovering rounded elements in tests, aim inside the corners. The corner
  pixel misses the hit area.
