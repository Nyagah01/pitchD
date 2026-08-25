# Pitchd — Change Log

A running record of what's been done, for counterchecking against the live site. Newest work first. Each item notes whether it was verified locally (build/lint/DOM checks in a dev browser) or needs a live pass by you, since I can't log in myself to test authenticated flows end-to-end.

---

## ⚠️ Important: two separate deploys, and the worker one was never happening

This repo has **two separate Cloudflare Workers**, deployed two separate ways:

1. **Frontend** (root `wrangler.toml`, the React app, serves pitchd-ke.com) — auto-deploys from a `git push` to `main` via Cloudflare's GitHub integration. Every "push" in this log up to now correctly went live this way.
2. **Backend API worker** (`worker/wrangler.toml`, name `pitchd-worker`, handles every AI call and the daily reminder cron) — does **not** auto-deploy from git. It only goes live via `wrangler deploy` run from the `worker/` directory.

Every "push"/"deploy" instruction earlier in this engagement only ever did #1. **The worker had not been deployed at all until just now** (2026-08-25) — meaning every backend fix described below (the CV-generation redesign, the usage-limit race fix, all three reminder email types, the low-credit alert, everything in `worker/index.js` across every round) only just went live in one shot, not incrementally as each round implied.

I discovered this because `wrangler` happens to be authenticated in this environment with deploy permission, so I ran `wrangler deploy` from `worker/` directly — it succeeded (`https://pitchd-worker.bnyagah.workers.dev`, cron confirmed at `0 7 * * *`, all three secrets already in place). Going forward, when I say "pushed," I'll also run `wrangler deploy` for the worker in the same step so this doesn't happen again — but you may want to double check nothing behaved oddly in the gap where the frontend expected new backend behavior that wasn't actually live yet.

---

## Round 4 — friendly error + founder alert when Anthropic credit runs low

**Trigger:** you flagged the Anthropic console showing $0.50 left — this directly powers every AI feature (generation, Jobo, portfolio text, everything through `callClaude`), so it was worth checking how that failure surfaces.

**What was there before:** a low/zero-credit response from Anthropic fell into the generic catch-all and showed the same "Something went wrong on our end. Try again..." as any other unexpected error — not wrong, but not informative, and "try again" is actively misleading for something that won't resolve until funds are added.

**Change:**
- `callClaude` now specifically detects Anthropic's low-credit response (matches `"credit balance"` in the error body) and gives the end user a clear, honest message: *"We're temporarily unable to generate right now — our team's already been notified and is on it. Please try again in a little while."*
- At the same time, it emails **you** (`ADMIN_ALERT_EMAIL`, set to briannyagah194@gmail.com in `worker/wrangler.toml`) with a direct link to the billing page — so you find out immediately instead of from a user complaint. Rate-limited to once an hour (via a new `system_alerts` table) so a burst of failed requests during an outage doesn't flood your inbox.
- Also fixed a real bug this surfaced: the client-side error handling (`src/lib/claudeApi.js`, `src/lib/jobo.js`) was matching specific error-message substrings to decide what to show the user, so this new message (and technically also the existing "response got cut off" one) would've been silently swapped for the generic fallback instead of actually reaching the user. Now anything the worker marks as a deliberately user-safe message (`PublicError`, HTTP 422) is shown as-is, generically — no more pattern-matching allowlist to maintain.

**⚠️ Action required:** new migration, same as last time — `supabase/migrations/004_system_alerts.sql` needs to be run in the Supabase SQL editor before the alert email will work. Until then it fails safe (logs an error, skips sending) rather than breaking anything.

**Files:** `worker/index.js`, `worker/wrangler.toml`, `supabase/migrations/004_system_alerts.sql`, `src/lib/claudeApi.js`, `src/lib/jobo.js`.

**Verified:** Build/lint/syntax-check clean. **Not verified against a real low-credit response** — would need your Anthropic account actually at $0 to trigger it for real, which I obviously won't force. The error-text match (`"credit balance"`) is based on Anthropic's documented error format, not something I could reproduce and confirm byte-for-byte here.

---

## Round 3 — third email reminder type (stale not-applied applications)

**Ask:** email reminders covering interview dates, applications not yet applied to after a week, and approaching deadlines.

**Status check:** interview-date and deadline reminders already existed (built earlier, part of the daily cron in `worker/index.js` → `runReminderSweep`, 07:00 UTC). The missing piece was the "not applied for a week" nudge — added now.

**Change:** a third sweep in the same daily cron finds applications still sitting in `not_applied` status 7+ days after creation, emails a nudge ("Still sitting in your pipeline — {company}"), and marks a new `not_applied_reminder_sent` flag so it only ever fires once per application (same one-shot pattern as the other two reminder types — this doesn't nag weekly, just once).

**⚠️ Action required before this works:** I added a new column (`not_applied_reminder_sent`) that the existing applications table doesn't have — `supabase/migrations/003_stale_application_reminders.sql`. **You need to run this in the Supabase SQL editor** (Project → SQL Editor → paste the file's contents → Run). I don't have your database credentials, so I can't run it myself. Until it's applied, this specific reminder type just silently no-ops (logs an error, sends nothing) — it won't break the existing interview/deadline reminders, which are unaffected.

**Files:** `supabase/migrations/003_stale_application_reminders.sql` (new — needs to be run manually), `worker/index.js`.

**Verified:** Build/lint/syntax-check clean. **Not verified against a real send** — needs the migration applied, a real Resend key, and an application that's actually 7+ days old and still `not_applied`, none of which I can produce myself.

---

## Round 2 — CV flow, portfolio templates, autosave, dates, founder message

### 1. CV generation is now fast and reliable
**Problem:** generation chained up to 6 sequential Claude calls (draft → critique → up to 2× revise+critique), which could take minutes and was timing out.

**Change:**
- `/generate-application` now does exactly **one** draft + one critique pass (2 calls). Returns immediately with ATS score, hireability score, CV, cover letter.
- A new, separate **"Want to sharpen it further?"** section appears after a result: optional feedback textarea + "Optimize this CV" button. Clicking it does one more revise+critique pass, informed by your feedback text plus the original critique. This is opt-in, not automatic.
- The Optimize step counts against your daily generation quota (shown in the button: "Uses 1 of your N generations left today") — so it's naturally capped at however many generations you have left that day, per your suggestion.
- Client-side timeout dropped from 120s to 75s (safe now that it's at most 2 chained calls instead of 6).

**Files:** `worker/index.js` (`handleGenerateApplication`, new `handleOptimizeApplication`), `src/lib/claudeApi.js` (new `optimizeApplication`), `src/pages/Apply.jsx`.

**Verified:** Build/lint clean, traced the full request/response contract between worker and client by hand (field names match on both ends). **Not verified against the real Anthropic API** — I don't have your API key locally (no `worker/.dev.vars` on this machine) and can't log in to test the authenticated flow myself. Please run a real generation once this is deployed and let me know if anything's off.

### 2. Portfolio: 5 templates + accent colors, replacing the one basic layout
Researched current portfolio-site design trends (glassmorphism, bento grids, split-screen, editorial typography — see sources below) and built five genuinely different layouts, not just palette swaps:

- **Aurora** — gradient hero header, glass card overlap (refined version of the old design)
- **Terminal** — dark, monospace, matches Pitchd's own terminal-window UI
- **Timeline** — big editorial type, vertical rail through your work history
- **Grid** — bento-style cards, projects front and center
- **Split** — sticky sidebar + scrolling content, two-column split-screen

Plus 6 accent colors (crimson, indigo, emerald, amber, violet, slate) that recolor whichever template you pick — so effectively 30 look combinations from one picker in Profile → Portfolio site. Your choice is saved and reused on "Update look & refresh"; regenerating doesn't reset it.

**Files:** `src/lib/portfolioThemes.js`, `src/lib/color.js`, `src/components/portfolio/` (shared helpers + 5 template components), `src/pages/PortfolioView.jsx` (now a thin dispatcher), `src/components/profile/PortfolioGenerator.jsx` (template/accent picker UI), `src/lib/portfolio.js`.

**Verified:** Rendered all 5 templates with realistic mock data in a local browser — confirmed no console errors, all sections (experience/projects/education/skills/certifications) render, dates display as "Mar 2022" not raw ISO strings, accent-color switching actually recolors the DOM, no horizontal overflow at 375px mobile width. Verified the picker UI (template buttons + color swatches) renders and responds to clicks. **Not verified:** actual visual polish/taste is my judgment call, not user-tested — take a look once deployed and tell me if any template needs adjustment.

Sources used for design research: [Portfolio design trends for 2026 (Envato)](https://elements.envato.com/learn/portfolio-trends), [19 Best Portfolio Design Trends 2026 (Colorlib)](https://colorlib.com/wp/portfolio-design-trends/), [21 Best Developer Portfolio Websites 2026 (Colorlib)](https://colorlib.com/wp/developer-portfolios/).

### 3. Autosave — no more explicit Save buttons for routine edits
Per your instruction ("autosave everywhere unless it's a popup requiring save"):
- **Profile → Basics** (name, headline, email, phone, location, links, summary): autosaves ~900ms after you stop typing. "Save basics" button removed.
- **Application detail → Notes**: autosaves the same way. "Save" button removed (previously saved on blur only).
- **Application detail → Interview date**: autosaves on change. "Save" button removed.
- **Applications table (inline row expand) → Interview date**: same — autosaves, and the "discard unsaved edit?" confirmation prompt is gone since there's nothing to discard anymore.

All four show a small inline "Saving… / Saved" indicator instead. Things left as explicit-save **on purpose**, matching your "unless it's a popup" exception: onboarding's review-and-save step, the Experience/Education/Projects/Certifications/Skills inline editors (they're a discrete edit-with-Cancel session, functionally a popup), and the rejection-feedback modal.

**Files:** new `src/lib/useAutosave.js` (shared debounce hook), new `src/components/common/AutosaveStatus.jsx`, `src/pages/Profile.jsx`, `src/pages/ApplicationDetail.jsx`, `src/components/applications/ApplicationsTable.jsx`.

**Verified:** Build/lint clean; logic reviewed by hand for the "don't autosave on mount / on an external reload resetting the field" edge case.

### 4. Onboarding & profile dates: month + year only, not day
Checked — this had **not** been done yet. Changed:
- Experience/Education start & end dates, and Certification issue dates, now use a native month picker (`type="month"`) instead of a full day-precision date picker, both during onboarding and when editing your profile afterward.
- Storage still needs a real SQL date (day is always recorded as `01`) — display always truncates back to month/year, so this is invisible to you.
- The AI extraction prompt (`structure-profile`) now asks for `"YYYY-MM"` instead of a specific day, so extracted dates line up with the new picker instead of silently losing precision.
- **Bug caught along the way:** `UpdateFromMasterFile` (the "update from master file" flow in Profile) wasn't sanitizing dates at all before saving — any AI-extracted date you left untouched would have failed to save with a raw Postgres error. Fixed by sharing the same sanitizer across onboarding, master-file updates, and profile edits (`sanitizeDates` now lives in `src/lib/profile.js`).

**Files:** `src/components/onboarding/ExtractedProfileReview.jsx`, `src/components/profile/EditableList.jsx`, `src/pages/Profile.jsx`, `src/pages/Onboarding.jsx`, `src/components/profile/UpdateFromMasterFile.jsx`, `src/lib/profile.js`, `worker/index.js`.

**Verified:** Ran the date-normalization logic standalone in Node against full-date, month-only, bare-year, and empty inputs — all produced the expected result. Build/lint clean.

### 5. Founder message types out much faster
`TypewriterLines` defaults: character speed 14ms → 4ms, gap between lines 260ms → 90ms (roughly 3x faster overall). Affects both the Landing page founder message and the onboarding "while we structure your profile" modal — both use the same component with no per-instance override, so both got faster automatically.

**File:** `src/components/common/TypewriterLines.jsx`.

**Verified:** Build/lint clean; this is a pure timing constant, low risk.

---

## Round 1 — bug-fix pass (already pushed, commits `05f8d99`–`6d398a0`)

Condensed summary — see git log for full detail:
- Fixed interview-date timezone drift (a real data-corruption bug — dates shifted on every save/reload cycle).
- Fixed onboarding partial-save failures permanently locking a profile as "incomplete" with no way back in.
- Fixed a worker race condition that could let the daily generation cap be bypassed.
- Added daily usage caps to endpoints that had none (`/structure-profile`, `/essay`, `/other-help`, `/jobo`).
- Fixed reminder emails being marked "sent" when they weren't; isolated cron-sweep failures per item instead of one bad row killing the whole run.
- Fixed PDF export silently deleting accented characters from names.
- Fixed mobile game input lag (Dino/Flappy games now respond on touch-start, not touch-release).
- Fixed profile editing being effectively broken on mobile — edit/delete buttons were hidden behind hover-only CSS that never triggers on touch devices; also fixed tiny (14px) tap targets.
- Fixed the portfolio intro card overlapping the header, and the avatar not showing an uploaded profile photo.
- Added Dashboard/Profile/Applications/Apply links to the mobile hamburger menu (previously only had Appearance/Sign out).

---

## What still needs a live check from you

Since I can't log in to the app, none of the authenticated flows below have been tested end-to-end with real data — please verify after this deploys:
1. Run a real "Generate application" and confirm it completes quickly and the Optimize button works.
2. Try each of the 5 portfolio templates with your real profile data and pick one you like.
3. Confirm autosave indicators actually show up and persist across a page reload.
4. Add/edit an Experience or Education entry and confirm the month picker feels right.
