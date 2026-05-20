# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solo Leveling Fitness System — a React Native (Expo) fitness gamification app themed after the anime Solo Leveling. Users ("builders") complete daily bodyweight missions (push-ups, pull-ups, sit-ups, side plank), earn XP, level up, and allocate Status Points to Strength, Endurance, Recovery, or Flexibility.

The full technical design document is in `roadmap_sistemleveling_gofur.txt` (written in Indonesian).

## Current Status

**Phase 1 (MVP Core) is implemented.** Zustand stores, MMKV persistence, manual +1 counters, plank timer, XP/level logic, cooldown system, streak tracking, reward modal, and status point allocation are all working. Phase 2+ (backend, animations, polish) is not yet started.

## Commands

```bash
# Development (requires dev client, not Expo Go — MMKV needs native modules)
npx expo start
npx expo run:android
npx expo run:ios

# Production builds
eas build -p android --profile production
eas build -p ios --profile production
```

## Tech Stack

- **Runtime:** React Native 0.81+ (New Architecture enabled) + Expo SDK 55, TypeScript strict
- **Styling:** NativeWind v4 (TailwindCSS for RN), dark-only theme
- **State:** Zustand v5 + MMKV v4 (no AsyncStorage in production; AsyncStorage is a fallback for Expo Go only)
- **Animation:** React Native Reanimated v4 + react-native-gesture-handler
- **Navigation:** Expo Router v6 (file-based routing)
- **Camera/Pose:** react-native-vision-camera + react-native-esanusi-sensor-pose (ML Kit on Android via custom config plugin)
- **Haptics/Sound:** expo-haptics + expo-av
- **Notifications:** expo-notifications (local only, no backend)
- **Sensors:** expo-sensors (gyroscope for hologram effect), expo-location
- **Font:** Rajdhani (loaded via @expo-google-fonts/rajdhani)

## Architecture

### Navigation (Expo Router, file-based)

```
app/
├── _layout.tsx          # Root layout: font loading, store hydration, MMKV init
├── (tabs)/
│   ├── _layout.tsx      # Tab bar config (3 tabs: Status, Missions, Profile)
│   ├── index.tsx        # StatusWindow — level, XP bar, stat allocation
│   ├── mission.tsx      # Mission cards, plank timer, cooldown display
│   └── profile.tsx      # Profile stats overview
```

### State Management (Zustand + MMKV)

All stores follow the same pattern: load initial values from MMKV at module level, persist on every mutation via `storage.set()`, and expose a `rehydrate()` method called on app startup.

| Store | Purpose | Key State |
|-------|---------|-----------|
| `useProfileStore` | Player stats, XP, level | level, currentXP, totalXP, unallocatedPoints, strength/endurance/recovery/flexibility |
| `useMissionStore` | Daily mission progress | pushUpDone, pullUpDone, sitUpDone, plankSecondsDone, isMissionComplete, streakDays |
| `useCooldownStore` | 48h muscle group cooldowns | chestLastTrained, backLastTrained, coreLastTrained |
| `useNotificationStore` | Notification preferences | enabled, time |

**Store hydration order** (in `app/_layout.tsx`): `storage.hydrate()` → profile → cooldown → mission (with `resetDailyIfNeeded`) → notifications.

### Storage Layer (`src/lib/mmkv.ts`)

A unified `storage` object that tries MMKV first (native, fast) and falls back to AsyncStorage + in-memory cache for Expo Go. All stores use this abstraction — never import MMKV or AsyncStorage directly.

### Key Domain Logic

**XP Formula** (in `src/utils/xpCalculator.ts`):
- Push-up: 2 XP/rep, Pull-up: 4 XP/rep, Sit-up: 1 XP/rep, Plank: 1 XP per 10 seconds (floored)

**Level Up** (in `useProfileStore.addXP`): Every 100 XP → +1 level → +1 Status Point

**Mission Targets** (hardcoded in `useMissionStore.MISSION_TARGETS`): pushUp=15, pullUp=5, sitUp=10, plank=60s

**Cooldown** (in `src/utils/cooldownLogic.ts`): 48h per muscle group. After completing all missions, all 3 groups (chest, back, core) go on cooldown simultaneously.

**Streak** (in `src/utils/streakLogic.ts`): Consecutive daily mission completions. Milestones at 3/7/14/30 days award bonus XP.

**Rewards** (in `src/utils/rewards.ts`): Physical reward suggestions based on streak day (honor system).

### Pose Detection (Camera-based rep counting)

`src/hooks/usePoseDetection.ts` uses react-native-vision-camera frame processor + ML Kit pose detection to count push-up and sit-up reps by tracking joint angles. The custom config plugin `plugins/withMLKitPose.js` injects ML Kit dependencies into the Android build.gradle.

### Native Module

`modules/solo-leveling-ir/` — IR blaster module for Android (transmit IR signals). This is a local Expo module, not an npm package.

### Theme (`src/constants/theme.ts`)

Dark-only. All colors, shadows, borders, fonts, and spacing are exported as constants. Use these — don't hardcode values:
- Background: `#0a0a0a`, Neon cyan: `#00f3ff`, Neon pink: `#ff00cc`, Text: `#e0e0e0`
- Font family: Rajdhani (bold/medium/light/regular/semiBold variants)

## Key Constraints

- **MMKV requires native modules** — the app must run via dev client (`expo-dev-client`), not Expo Go. The storage layer has an AsyncStorage fallback for Expo Go but it's lossy.
- **Side plank timer** must pause on app backgrounding (AppState). If interrupted, timer resets. The plank uses `setPlankSecondsDone` which caps at the 60s target.
- **Cooldown timestamps** are stored as raw `Date.now()` milliseconds in MMKV. The 48h window is `48 * 60 * 60 * 1000` ms.
- **No backend yet** — all state is local. Phase 2 will add Supabase + Cloudflare Workers.
- **All fetch calls to future Worker API** must have timeout + retry (3x, exponential backoff 1s/2s/4s/8s).
