# Tickets — Math Clock

Living, ordered backlog. One ticket per session: `/clear` → `/start Tn` → work → `/wrap`. The agent that wraps a
session updates this file and picks the next ticket, so each new session starts with a small, clear context.
Rules: `.claude/skills/wrap/SKILL.md`. Capture ideas any time with `/ticket`.

**Next:** T2 — Alarm options in the editor · Sonnet · medium effort · plan mode off

## In progress

_None._

## Up next

### T2 — Alarm options in the editor

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Expose the rest of the v1 alarm settings in the editor, and make the challenge use them.
- **Done when:**
  - [ ] T1 leftovers verified first: `npm run e2e -- --flow .maestro/smoke.yaml` passes on iOS (never ran in
        T1, see Handoff); screenshots of the editor (native wheel time picker), the list with an alarm, and dark
        mode; Android emulator (`npm run android`) shows the Compose time picker and the challenge.
  - [ ] Editor (`src/features/alarms/alarm-editor-screen.tsx`) has: repeat days (7 day toggles, Mon-first, with
        `describeRepeat` summary), difficulty (`SegmentedControl` Easy/Medium/Hard), problem count (1–10,
        stepper or segmented 1/3/5/10), snooze minutes (Off/5/10/15) and max snoozes (1–3; hidden when snooze off).
  - [ ] Alarm rows show the label and repeat summary (already wired); a practice button per alarm in the editor
        ("Try it") opens `/challenge` with that alarm's difficulty and count.
  - [ ] Tests cover saving each new field (`alarms-screen.test.tsx` pattern: `renderRouter`, real store).
  - [ ] Screenshot of the editor, light and dark.
- **Context:** All fields already exist in `alarmSchema` (`src/features/alarms/model.ts`) with defaults, so no
  storage migration. Sound choice is **not** here (T6, needs bundled audio). `@expo/ui` SwiftUI/Compose views are
  mocked in `jest.setup.ts`; RN `Switch` needs `fireEvent(el, 'valueChange', v)` in tests (userEvent can't flip it).
- **Handoff (from T1):** The iOS dev build is installed on the "iPhone 18 Pro" simulator (iOS 27.2); start with
  `npm start` (rebuild only if native inputs change). Seen working on it: Alarms empty state and the challenge
  screen (light). In T1, Maestro stalled on its first iOS run (no log output after startup for 7+ min,
  probably the XCTest driver install on Xcode 27.2) and was stopped; give it time or restart the simulator, and
  note the fix in the `run-app` skill. After the first `npm run ios` the app opened straight onto `/challenge`
  (likely dev-client state restore; a clean launch opened on Alarms): check that it doesn't happen on a cold start.
  The user is not yet sure they'll continue with this app idea: confirm before investing in T3+.

### T3 — iOS alarm engine (AlarmKit)

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Alarms really ring on iOS 26+ through AlarmKit, and can only be finished by solving the math
  ("re-ring until solved").
- **Done when:**
  - [ ] Library vs local module decided and recorded in `docs/decisions.md`. Candidates (all young, check
        maintenance): `@asleep-ai/react-native-alarm` (Expo Modules, iOS+Android), `react-native-alarm-scheduler`,
        `expo-alarm-kit`, `react-native-ios-alarmkit` / `react-native-nitro-ios-alarm-kit` (Nitro). Default if
        none is clearly solid: a local Expo module `modules/alarm-engine` (Swift now, Kotlin in T4).
  - [ ] A platform-neutral JS interface in `src/features/alarms/engine.ts` (`requestAuthorization`,
        `schedule(alarm)`, `cancel(id)`, `stop(id)`, ring/launch events), with a no-op fallback for tests.
  - [ ] Store → engine sync: every add/update/toggle/remove reschedules; full resync on app launch.
  - [ ] iOS deployment target 26.0 (`expo-build-properties`), `NSAlarmKitUsageDescription` in `app.json`.
  - [ ] Ring UI: title = label or "Math Clock"; stop button labelled **"Solve"** whose intent opens the app at
        `/challenge?alarmId=…&difficulty=…&count=…` **and natively arms a follow-up alarm 1–2 min later**;
        secondary button = snooze (countdown, `snoozeMinutes`, limited by `maxSnoozes`) when enabled.
  - [ ] Solving in `ChallengeScreen` (`alarmId` set) cancels the follow-up alarm; one-time alarms get
        `enabled: false` after ringing; repeating ones stay scheduled.
  - [ ] Verified on a **physical iPhone on iOS 26** (`npm run ios:device`): rings with the app killed and the
        phone locked/silenced; Stop without solving re-rings; solving ends it.
- **Context:** User chose iOS 26+ only and "re-ring until solved" (AlarmKit always shows a system stop button,
  so it can't be hidden). Apple docs: AlarmKit `AlarmPresentation.Alert` (stopButton required, optional
  secondaryButton with `.countdown` / `.custom` behaviour). Use the `add-native-capability` skill and
  `expo:expo-module` for a local module. Needs `npm run native:clean` + rebuild. Removing the "Alarms don't ring
  yet" footer in `alarms-screen.tsx` is part of T4 (when both platforms ring).

### T4 — Android alarm engine

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Alarms really ring on Android, full screen over the lock screen, and stop only by solving.
- **Done when:**
  - [ ] Same `engine.ts` interface as T3, Android side (library from T3's decision or Kotlin in `modules/alarm-engine`).
  - [ ] `AlarmManager.setAlarmClock` scheduling; a foreground service plays the alarm sound (alarm audio stream)
        and posts a full-screen-intent notification that opens the app at `/challenge?alarmId=…` over the lock
        screen (`showWhenLocked` / `turnScreenOn`); sound stops only when the challenge is solved (or snoozed).
  - [ ] Reschedules after reboot (`BOOT_COMPLETED`), time/time-zone change and app update.
  - [ ] Permissions: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`/`USE_EXACT_ALARM`, `USE_FULL_SCREEN_INTENT`
        (Android 14+ requires the alarm-clock use case), with the system settings deep link when denied.
  - [ ] Verified on the `Pixel_API_36` emulator with the app killed and the screen locked; "Alarms don't ring
        yet" footer removed from `alarms-screen.tsx`.
- **Context:** Native config via `app.json` / config plugin only (never edit `android/`). Back button must not
  dismiss the challenge in alarm mode (`gestureEnabled: false` is already set for iOS swipe).

### T5 — First preview build

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** The app's own EAS project, preview builds installed on the user's devices, an OTA update received.
- **Done when:**
  - [ ] `npx eas-cli@latest init` + `update:configure` committed (revert its `eas.json` rewrite).
  - [ ] Android and iOS preview builds installed.
  - [ ] An `update:preview` published after both builds finished shows up after two cold starts
        (Settings → Update shows an update ID).
  - [ ] Surprises added to `docs/releasing.md`.
- **Context:** Follow "First preview build (once per app)" in `docs/releasing.md`. The user must be present for
  the iOS build (Apple login). Devices registered and the distribution certificate created for an earlier app
  are reused; only the App ID and provisioning profile are new. AlarmKit may need an entitlement/capability on
  the App ID: check T3's notes.

### T6 — Alarm sounds

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode on
- **Goal:** Each alarm has a chosen ringtone, used by both alarm engines.
- **Done when:**
  - [ ] 3–6 royalty-free sounds **supplied or approved by the user** (licence noted in `assets/sounds/README.md`),
        in formats both engines accept (iOS: ≤ 30 s `.caf`/`.wav` in the app bundle for AlarmKit; Android: raw resource).
  - [ ] Sounds bundled through `app.json` / a config plugin; a sound picker in the editor with preview
        (`npx expo install expo-audio`); `soundId` passed to `engine.schedule`.
  - [ ] Verified ringing with a non-default sound on both platforms.
- **Context:** `soundId` already exists on `Alarm` (default `'default'` = system/alarm default sound).

### T7 — Permissions onboarding and reliability

- **Status:** ready
- **Session:** Opus · high effort · plan mode on
- **Goal:** Alarms never silently fail.
- **Done when:**
  - [ ] First-run explanation before the system permission prompts (AlarmKit authorization; Android
        notifications / exact alarms / full-screen intent), and a clear banner on the Alarms screen when any is
        denied, linking to system settings.
  - [ ] Edge cases tested and handled: DST and time-zone changes, alarm edited while ringing, two alarms at the
        same time, app updated or force-quit between schedule and ring, snooze limit reached.
  - [ ] Maestro flow for the editor + practice journey; manual checklist for ringing in `docs/`.
- **Context:** Builds on T3/T4's `engine.ts`. `nextOccurrence` in `model.ts` is local-time based and unit-tested.

### T8 — Branding and store prep

- **Status:** ready
- **Session:** Sonnet · medium effort · plan mode off
- **Goal:** Math Clock looks like itself and is ready for store listings.
- **Done when:**
  - [ ] App icon (iOS `assets/app.icon` via Icon Composer, Android adaptive icon foreground/background/monochrome)
        and splash replaced with the user's artwork; `android.adaptiveIcon.backgroundColor` and splash colours
        match the brand orange (`#C2410C` / dark `#FB923C`, `src/theme/tokens.ts`).
  - [ ] Store listing text, screenshots, privacy answers (no data collected; everything stays on device).
- **Context:** See `docs/new-app-checklist.md`. Don't invent artwork; ask the user for it.

## Backlog

Ideas that aren't ready to work on yet. Promote them to "Up next" with full detail when they are.

## Done

- T1 — Shape the app — 2026-11-11 — idea agreed (math-to-stop alarm, iOS 26+ AlarmKit with re-ring until solved, Android full-screen alarm, on-device data); brand orange; Alarms tab with persisted list/editor; practice math challenge; T2–T8 written
