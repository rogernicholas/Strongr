# CLAUDE.md

## Project

Personal Android workout tracker, built with Expo (React Native) and TypeScript. The project is staged: personal use first, then friends, then possibly public with monetization. An optional social scoreboard (time in the gym) is a later module.

Name: Strongr. Android package: `app.strongr.android`.
Owner: Roger. He makes the decisions; Claude writes the code.

## How we work (read this first)

- Roger decides, Claude codes. Before planning any phase or feature, interview Roger: ask every decision you need from him, with a recommended default for each. Do not guess product decisions.
- Always plan first (plan mode), then build in small vertical slices. One feature per session.
- After each slice: run the type checker, linter and tests; commit with a clear message; tell Roger exactly how to test it in Expo Go on his phone.
- After a feature is done, run a review pass on your own work (bugs, edge cases, security, leftovers) before moving on.
- When Roger makes a decision, record it in the Decisions Log at the bottom of this file.
- Roger tests on his phone and reports problems in plain language. Translate that into fixes.
- Explain anything non-obvious briefly. Roger knows JavaScript, React and CSS, so he can read the code, but he wants to review outcomes rather than write code.
- Never ask Roger to paste secrets into chat. Never commit secrets, personal data or API keys.
- Do not build anything listed under "Deferred" until the relevant phase is reached and Roger approves.

## Stack

- Expo SDK 58 (React Native), TypeScript in strict mode
- expo-sqlite for local storage, numbered forward-only migrations
- React Navigation
- i18next for all user-facing strings
- ESLint, Prettier, Jest (or the Expo-recommended test runner)
- GitHub Actions: type check, lint and tests on every push
- EAS Build for APKs (preview profile, `buildType: apk`); expo-updates for OTA JavaScript updates
- Keep dependencies minimal. Justify every new one.

## Architecture rules

```
src/
  app/           app shell: startup, navigation, providers (the only place that composes features)
  core/          db setup, migrations, theme, i18n, settings, service interfaces
  data/          repositories (the ONLY code that talks to SQLite)
  features/
    exercises/
    templates/
    logging/
    history/
    progress/
    backup/
    social/      (later, behind a feature flag, off by default)
    settings/    settings and About screens
  ui/            shared components
  config/        defaults: units, seed exercises, feature flags
```

- Features never import from each other. They may import only from `core`, `data`, `ui` and `config`.
- UI components never touch the database directly. They go through repository functions.
- A user who disables a feature must not break any other feature.
- Small, readable components. No hardcoded personal data, exercises, routines or units.
- These boundaries are enforced by ESLint (`eslint.config.js`): cross-feature imports and `expo-sqlite` outside `src/data` and `src/core/db` fail lint.
- Import with the `@/` alias (`@/core/db`, `@/ui`), which maps to `src/`.

## Repo notes

- `npm run check` = typecheck, lint (zero warnings), Prettier check, Jest. CI runs the same on every push.
- Install native packages with `npx expo install <pkg>` so versions match the Expo SDK.
- The database is reached through the small `Db` interface in `src/core/db/types.ts`. The app uses an expo-sqlite adapter; tests use Node's built-in `node:sqlite` (`test/helpers/nodeDb.ts`), so migrations and repositories are tested against real SQLite. Requires Node 22.13+.
- Timestamps are epoch milliseconds (UTC) in INTEGER columns. Workouts also store the device timezone.
- Adding migration N: add `src/core/db/migrations/00N_name.ts`, append it to the list in `migrations/index.ts`, and add `test/migrations/fixtures/vN.ts` with sample data. The tests fail until the fixture exists.
- Installable APK: `npx eas-cli build -p android --profile preview` (config in `eas.json`; the build runs in Expo's cloud under Roger's Expo account, so it runs on his PC after he has signed in with `npx eas-cli login` himself). Bump `version` and `android.versionCode` in `app.json` for each build that is shared.
- Over-the-air updates (expo-updates, from 0.3.0): after `npm run check`, publish JavaScript changes from Roger's PC with `npx eas-cli update --channel preview --message "<what changed>"`, and only when Roger says so. `runtimeVersion` follows the app `version`, so an update reaches only builds with the same `version`: bump `version` only for a new APK. Native changes (new native package, SDK upgrade, icon, splash, permissions, app.json plugins) need a new APK.
- The first APK (0.1.0, schema version 3) shipped on 2026-10-16, so every existing migration is frozen: schema changes need a new numbered migration. Migration 004 (`sets.rest_s`, schema version 4) ships in 0.2.0.

## Data rules (cheap now, expensive later)

- UUIDs as primary keys on every table. No auto-increment IDs.
- `created_at`, `updated_at` and `deleted_at` (soft delete) on every table.
- Canonical storage units: kg, meters, seconds. Convert only for display. Units (kg/lb) are a user setting.
- Sets must be flexible: weight and reps, plus optional time and distance, plus optional RPE.
- Exercises have a `source` field (`seed` or `custom`) so seed updates never overwrite user edits.
- Numbered, forward-only migrations with a schema version table. Never edit a shipped migration; add a new one.
- Every migration change needs a test that runs all migrations from an empty database and upgrades from each earlier schema version with sample data. A bad migration destroys users' history; treat this as the highest-risk area.
- Export format (JSON) includes a `schemaVersion`. Import must validate and handle older versions. CSV export also supported.
- Templates serialize cleanly to a small JSON file so routines can be shared.

## Service interfaces (stubs until needed)

Create these interfaces in `core/` with no-op implementations, and make all features call them instead of assuming a local-only app:

- `AuthService`: stub returns a single local user
- `SyncService`: stub does nothing
- `EntitlementService`: stub says everything is unlocked (later becomes the paywall switch)
- `Analytics`: single `track(event, props)` function that does nothing for now

## Settings and feature flags

- All user-facing options live in one settings object: units, RPE on/off, rest timer on/off, plate calculator on/off, social on/off.
- All feature flags live in one config object.
- Ship the app with an About screen showing the version number.

## Logging screen requirements

This screen is used mid-workout and must be fast:

- Big tap targets, numeric keypad, "copy previous set" button
- Show the previous session's numbers for the same exercise inline
- Optional rest timer
- Keep the screen awake during a session
- Works fully offline

## Deferred (do NOT build until told)

- Accounts and login
- Cloud backend and sync
- Payments and billing
- Real analytics
- Social features (scoreboard) until Phase 4
- Web dashboard
- iOS (Expo allows it later)

## Social scoreboard spec (Phase 4 only)

- Lives in `src/features/social/`, behind a feature flag, off by default. The rest of the app must work with no account and no network.
- Backend: Supabase (auth, Postgres, row-level security). Roger creates the project and puts the URL and anon key in environment config. The service-role key must never appear in the app, repo or chat.
- Upload session summaries only, never raw sets: session UUID, user id, started_at, ended_at, active_seconds, local date, timezone.
- Active time = first set to last set, with a manual edit option. Caps: 3 hours per session, 4 hours per day (confirm with Roger).
- Daily boards use each user's local date. Weeks start on Monday.
- Uploads are idempotent (session UUID) and queued offline.
- Private groups joined by invite code or link. No public search and no global leaderboard yet.
- Row-level security: users write only their own summaries and read only summaries of members of their groups. Include tests proving a user cannot read another group's data, and a security review of the policies.
- Metric must be swappable: time in gym, sessions per week, active days, total volume.
- Server-side sanity checks: reject overlapping sessions and absurd durations; group owner can remove an entry.
- Privacy: opt-in (nothing uploads until the user joins a group), display name only, totals-only by default with an option to hide session times, "leave group" and "delete my account and data".
- Analytics events (through `track()`): leaderboard_opened, group_joined, session_uploaded.

## Roadmap and timeline

Assumes a start on 15 Oct 2026 and about 5 to 8 hours a week. These are estimates; each phase depends mostly on how quickly Roger decides and tests.

| Phase                | What happens                                           | Dates                | Duration  |
| -------------------- | ------------------------------------------------------ | -------------------- | --------- |
| 0. Setup             | Install tools, create accounts                         | 15-18 Oct 2026       | 1 weekend |
| 1. Foundation        | Scaffold, database, structure, tests                   | 19-25 Oct            | 1 week    |
| 2. Core personal app | Exercises, templates, logging, history, charts, backup | 26 Oct - 22 Nov      | 3-4 weeks |
| 3. Use it yourself   | Real APK, train with it, weekly triage                 | 23 Nov - 20 Dec      | 4 weeks   |
| 4. Social scoreboard | Supabase, groups, uploads, leaderboard                 | 21 Dec - 17 Jan 2027 | 3-4 weeks |
| 5. Friends test      | One friend, then 3-4; OTA updates, analytics           | 18 Jan - 28 Feb      | 6 weeks   |
| 6. Public decision   | Gate review, niche, pricing, legal setup               | March 2027           | 2-4 weeks |

Milestones:

- About 8 Nov: logging screen works in Expo Go; Roger starts using it for real workouts.
- About 22 Nov: first APK installed on Roger's phone.
- About 20 Dec: Gate 1. Does Roger still prefer it to his old method?
- Mid-January: scoreboard works for Roger and one friend.
- End of February: Gate 2. Are friends still using it weekly, without reminders?
- March 2027: decide whether to go public.

Gates: do not start the next stage until the gate before it is passed. If Roger stops using the app in Phase 3, fix that before building anything else.

### Phase 0: Setup (Roger)

Install Node.js LTS, Git, Claude Code and Expo Go; create Expo and GitHub accounts. Do not create Supabase yet.

### Phase 1: Foundation (Claude builds)

Interview Roger, then scaffold: repo, Expo and TypeScript, folder structure, SQLite with migrations, UUID keys, timestamps, canonical units, i18n, theme, stub services, tests and CI.
Roger decides: app name, Android package ID (hard to change after a Play release), languages (English only is fine for now), set types (recommend flexible), default units.

### Phase 2: Core personal app (Claude builds, slice by slice)

Order: exercises, templates, logging screen, previous-session numbers, history, progress charts, JSON and CSV backup.
Roger decides per slice: seed exercise list and muscle groups; RPE, rest timer, copy-previous-set; progress metrics (estimated 1RM, volume, top set); where exports go.

### Phase 3: Use it yourself (Roger)

Build a real APK with EAS (Claude writes config and fixes build errors). Train with it. Roger keeps one list of annoyances; weekly, Claude triages them, proposes fixes and builds the approved ones.

### Phase 4: Social scoreboard

See the spec above. Roger creates the Supabase project and decides: metric, caps, sign-in method (magic link or Google), what friends see.

### Phase 5: Friends test

Claude builds the APK, sets up OTA updates and the About screen, wires the analytics wrapper to simple events. Start with one friend, then three or four.
Gate to go public: a few friends still use it weekly after a month, without reminders.

### Phase 6: Public and monetization (decide later)

Do not plan in detail yet. At the gate, Roger decides the niche and pricing model and handles the legal items himself: privacy policy (Claude may draft; a professional reviews), GDPR advice, Play Console account and its current testing requirements, Data Safety form, tax setup. Claude implements billing (RevenueCat is the usual choice) behind `EntitlementService`. Verify current Google Play fees and developer-account rules at that time.

## Scale-readiness checklist

- Stage 2 (friends): export/import works, About screen with version, crash-free fresh install, upgrade from previous version works.
- Stage 3 (public beta): privacy policy, crash reporting, real analytics behind `track()`, accounts and sync behind the existing interfaces, data deletion flow.
- Stage 4 (monetize): entitlement service connected to billing, paywall tested with beta users, support email and basic FAQ.

## Release checklist (before every shared build)

1. Fresh install works.
2. Upgrade from the previous version keeps all data.
3. Export and import round trip works.
4. Tests, type check and lint pass in CI.
5. Version number updated and visible on the About screen.
6. Repo scanned for secrets and personal data.

## Decisions Log

Record each decision here with the date. Claude updates this whenever Roger decides something.

- 2026-10-15: Stack is Expo (React Native) with TypeScript and local SQLite.
- 2026-10-15: Staged path: personal, then friends, then possibly public and monetized.
- 2026-10-15: Social scoreboard (time in gym, daily/weekly/monthly) is an experiment, built as an isolated optional module in Phase 4.
- 2026-10-15: App name: Strongr. Repo: private `rogernicholas/strongr`.
- 2026-10-15: Android package ID: `app.strongr.android` (Roger chose a brand-style ID over his personal domain; unique on Play, permanent after the first release).
- 2026-10-15: Languages: English only for now; every string still goes through i18next.
- 2026-10-15: Default weight unit: kg, switchable to lb in Settings.
- 2026-10-15: Set types: flexible. Weight and reps, plus optional time, distance and RPE (1-10), plus a warm-up flag so warm-ups can be excluded from stats.
- 2026-10-15: Navigation uses React Navigation (native stack), per the plan, not Expo Router.
- 2026-10-15: Phase 2 UX (Roger's flow): pick the day's exercises from a default list (option to add custom) -> optionally save the selection as a routine (A, B, C...) -> log weight and reps per set -> the day appears on a calendar -> export all workout days to a simple .txt file.
- 2026-10-15: Seed exercises: Roger's 13 plus about 30 common ones, grouped by muscle group (chest, back, shoulders, arms, legs, core). Users can add their own.
- 2026-10-15: Routines are built by Roger in the app; none are hardcoded.
- 2026-10-15: Each set has its own weight. Inputs pre-fill from the previous set; last session's numbers show inline.
- 2026-10-15: Calendar: month view with a dot per workout day; tap a day to see it.
- 2026-10-15: Export: .txt in notepad style, one day per block, via the Android share sheet. JSON and CSV backup come later.
- 2026-10-15: Bodyweight is a weekly input, not per workout.
- 2026-10-15: RPE off by default; rest timer off by default. Both toggle in Settings.
- 2026-10-15: No import of old paper notes; start fresh.
- 2026-10-16: Look: logo "Strongr." in Changa One; all other text Noto Sans (bundled via @expo-google-fonts). Brand colours red #F61C24 (main actions), teal #41D2EF (highlights), black #03020C, navy #1D2180; background a darker navy.
- 2026-10-16: Night theme only for now; the light/system theme setting is removed.
- 2026-10-16: Layout: three swipeable pages, Home -> Calendar -> Stats, with page dots. Home is just New workout (or Resume), with Settings and About as small links at the bottom. A My routines button sits under New workout.
- 2026-10-16: Calendar page: small Export link underneath; each week row has a bodyweight cell (tap to add or edit that week).
- 2026-10-16: Stats page: bodyweight pinned first, then logged exercises. Exercise graph: heaviest working set per session (warm-ups excluded), toggle to estimated 1RM (Epley). Stats: best set, e1RM, sessions, last session, 4-week change. Bodyweight: current, lowest, highest, 4-week change. Ranges 3M / 1Y / All. Charts drawn with react-native-svg.
- 2026-10-16: Colours harmonized around one blue hue: background #0C0C1D, navy surfaces #11135A (raised #1F226B), muted text #ABAED9, red #EB424B, teal #2AB1CF, plus dim red/teal for disabled states. No borders. All dialogs use the themed ModalCard, not native alerts.
- 2026-10-16: A "good job" screen follows every saved workout, rotating through 15 phrases.
- 2026-10-16: New workout shows routines as swipeable cards. With a routine selected there is no Save as / Update routine; a "Save changes" button appears above Start workout only when the exercises differ from the routine.
- 2026-10-16: Logging: weight and reps each get a full-width row with small borderless +/- buttons.
- 2026-10-16: A week's bodyweight is removed by saving it empty or as 0 (button reads Delete).
- 2026-10-16: Popups with a text field open in the upper part of the screen, clear of the keyboard; taps work on the first try while the keyboard is open.
- 2026-10-16: First APK (0.1.0) built with EAS preview profile and installed by direct download; the Expo project is owned by Roger's `rozero_n` account. Workouts logged in Expo Go are not carried over.
- 2026-10-29: Sets read "20 kg × 15 reps" everywhere (weight and reps were easy to mix up).
- 2026-10-29: Cancel sits next to Finish on the workout screen and deletes the whole workout after a confirm.
- 2026-10-29: Exercises can be added and removed during a workout; removing one with sets asks first.
- 2026-10-29: Tapping a workout in the calendar opens it for editing (same screen as logging); long-press still deletes. Date and time are not editable.
- 2026-10-29: Exercise chart plots the "All sets" score (average Epley e1RM over working sets) by default, Volume as the second option. Best set and best e1RM stay as record tiles. Bodyweight exercises keep the reps chart.
- 2026-10-29: Rest timer is on by default (Settings switch). It counts up after each set; rest is saved only when Roger taps Log rest (sets.rest_s, migration 004), not guessed from gaps, because he switches machines quickly.
- 2026-10-29: Overview stats page: workouts, per week, average length (first to last set), average working sets, average logged rest, biggest and smallest progress (change in the chart metric, first two vs last two sessions, at least four sessions). Follows 3M / 1Y / All.
- 2026-10-29: Weight suggestions on the good-job screen, on by default: when every working set at the top weight reaches the rep target (default 14, editable in Settings), suggest one step more (2.5 kg / 5 lb), at most two lines.
- 2026-10-29: Calories are estimated per workout as MET 5 × bodyweight (kg) × workout length (first to last set), using the weekly bodyweight for that week (or the earliest entry). No height. Calculated, not stored. Shown on the good-job screen and as average and total on the Overview. Later, for cardio logging: a MET per exercise (lifts 5, running 8-11, rowing 7), summed per exercise.
- 2026-10-29: The good-job screen lists each exercise's change against its previous session (All sets score, or reps for bodyweight exercises), "first session" when new.
- 2026-10-29: Cardio is in: nine cardio seeds (runs, incline walk, bike, rowing erg, elliptical, stair climber, jump rope, swimming) (muscle group Cardio, time + distance, entered in minutes and km), each with its own MET; running uses 1 kcal/kg/km when a distance is logged; custom cardio uses MET 7. Workout calories = each cardio set at its rate + the remaining length as lifting at MET 5.
- 2026-10-29: My routines has a New routine button: pick exercises, save, back to the list.
- 2026-10-29: Body font is now Instrument Sans (replacing Noto Sans); the logo stays Changa One.
- 2026-10-29: Calendar workout cards lead with the routine name (or "Workout") as a large teal title.
- 2026-10-29: Upgraded to Expo SDK 58 (React Native 0.88) so the Play Store Expo Go opens the project. Check the current Expo SDK before starting any new project.
- 2026-10-29: APK 0.2.0 (versionCode 3, schema 4, SDK 58) is built for 64-bit ARM phones only (expo-build-properties `buildArchs: arm64-v8a`, from PR #7). It installs as an update over 0.1.0: never uninstall first, because that wipes the data.
- 2026-10-29: Calendar workout cards get more spacing between exercises (the Instrument Sans lines looked crowded).
- 2026-10-29: Over-the-air updates (expo-updates) from 0.3.0: the app checks on open, downloads in the background and applies the update on the next open. Claude publishes an update only when Roger says so.
- 2026-10-29: Logo and app icon: a white "S" with a red dot in Changa One on the dark background (#0C0C1D), matching the "Strongr." wordmark. Also used on the launch screen.
- 2026-10-29: APK 0.3.0 (versionCode 4) carries the logo and over-the-air updates.
- 2026-10-30: Biggest and smallest progress keep the four-session threshold (first two vs last two sessions); Roger chose steadier numbers over earlier ones.
- 2026-10-30: UI specialist review applied (Roger chose the recommended options):
  - Colours: "Soft navy" replaces the saturated navy: background #0B0C18, cards #1C1F3B (raised #282C4F), lines #373B62, muted text #B2B5D6. Red and teal unchanged. One red button per screen; teal for state.
  - Rest: saved automatically when the next set is the same exercise within 5 minutes; a different exercise in between is a changeover and never counts. The timer reads CHANGEOVER while another exercise is open. Log rest stays as a manual override. Average rest leaves out gaps over 5 minutes. (Replaces the 29 Oct rule of saving rest only via Log rest.)
  - Navigation: a labelled Home · Calendar · Stats tab bar replaces the page dots; swiping still works. Home shows "Next up" (the routine after the last one trained, in name order), "Last trained" and one Start button.
  - Workout screen: Finish is a secondary button; "Exercise 2 of 5" on each card; last session's sets show faintly beside each set and as targets for sets still to do.
  - Routines: tapping one in My routines opens it to rename, change exercises (tap order is the order), save or start.
  - Settings use on/off switches; the rep target sits under Weight suggestions and greys out when they are off.
  - Overview: workouts, per week and progress first, calories last; empty tiles say why; per week waits for two weeks of data; "Smallest progress" is renamed "Stalled".
  - Stats list: trend line and latest change on every exercise and on bodyweight, plus a "Log this week" bodyweight button.
- 2026-10-30: The dot in the "Strongr." wordmark on Home is red, matching the app icon.
- 2026-10-30: The tab bar has no text labels, only the teal bar on the active page, for a more minimal look (replaces the labelled tabs). Screen readers still hear the names.
- Open: scoreboard metric and caps, sign-in method.
