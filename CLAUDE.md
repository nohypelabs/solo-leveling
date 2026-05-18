# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Solo Leveling Fitness System — a React Native (Expo) fitness gamification app themed after the anime Solo Leveling. Users ("builders") complete daily bodyweight missions (push-ups, pull-ups, sit-ups, side plank), earn XP, level up, and allocate Status Points to Strength, Endurance, Recovery, or Flexibility.

The full technical design document is in `roadmap_sistemleveling_gofur.txt` (written in Indonesian).

## Current Status

**Pre-implementation.** The project currently contains only the TDD. Implementation starts from Phase 1 (MVP Core).

## Tech Stack

- **Frontend:** React Native 0.76+ (New Architecture) + Expo SDK 51, TypeScript (strict)
- **Styling:** NativeWind (TailwindCSS for RN), dark-only theme
- **State:** Zustand (global) + MMKV (persist) — no AsyncStorage
- **Animation:** React Native Reanimated v4 + react-native-gesture-handler
- **Visual Effects:** @shopify/react-native-skia (GPU-accelerated neon, glitch, particles)
- **Navigation:** Expo Router (file-based)
- **Backend:** Cloudflare Workers + Hono (TypeScript API framework)
- **Database:** Supabase (PostgreSQL with RLS) + Supabase Realtime
- **Auth:** Supabase Auth (anonymous or email)
- **Offline:** MMKV-based queue with retry on reconnect
- **Build:** EAS Build (Expo Application Services)
- **Error Tracking:** Sentry

## Architecture

### Four-Phase Roadmap

1. **Phase 1 (MVP Core, weeks 1-2):** Local-only. Zustand stores, MMKV persistence, manual +1 counters, plank timer, XP/level logic, reward modal. No backend.
2. **Phase 2 (Cloud & Realtime, weeks 3-4):** Supabase setup, auth, Cloudflare Worker API endpoints, offline queue, realtime streak sync.
3. **Phase 3 (Animations, weeks 5-6):** Glitch text, hologram 3D cards (gyroscope), confetti particles, sound effects (expo-av), Skia neon borders.
4. **Phase 4 (Polish, weeks 7-8):** Daily push notifications, error handling, offline resilience, APK/IPA build.

### Planned Folder Structure

src/
├── components/ # StatusWindow, MissionCard, XPBar, GlitchText
├── stores/ # Zustand stores: useProfileStore, useMissionStore, useCooldownStore
├── services/ # supabaseClient, workerApi, offlineQueue
├── screens/ # HomeScreen, MissionScreen, ProfileScreen
├── utils/ # xpCalculator, cooldownLogic, rewards
└── App.tsx


### Key Domain Rules

#### Phase 1 Mission Defaults (hardcoded until dynamic missions are implemented)
- Push-up target: 15
- Pull-up target: 5
- Sit-up target: 10
- Side plank target: 60 seconds

#### XP Formula
- Push-up × 2 XP per rep
- Pull-up × 4 XP per rep
- Sit-up × 1 XP per rep
- Side plank: seconds ÷ 10 (floored) XP

#### Level Up
- Every 100 XP → +1 level → +1 Status Point

#### Muscle Cooldown Mapping
- Push-up → chest group → cooldown 48 hours
- Pull-up → back group → cooldown 48 hours
- Sit-up + side plank → core group → cooldown 48 hours

After completing all missions, **all three groups go into cooldown** for 48 hours. During cooldown, the system must block starting a new mission and show a countdown timer.

#### Status Points (Phase 1)
- Each level up gives 1 Status Point.
- User can allocate points to Strength, Endurance, Recovery, or Flexibility.
- **In Phase 1, these stats are stored but have NO gameplay effect yet** (future phases will implement fatigue reduction, recovery speed, etc.).
- UI must allow allocation and display current stat values.

#### Physical Rewards (honor system, no verification)
After completing a daily mission, the app displays a reward suggestion. Examples:

| Day | Reward |
|-----|--------|
| 1   | Susu UHT 250ml |
| 3   | Vitamin C / jus jeruk |
| 7   | 2 telur rebus |
| 14  | 1 pisang |
| 30  | Pijat / foam roller |

#### Streak Bonus XP
- Streak 3 days → +10 XP bonus
- Streak 7 days → +25 XP bonus
- Streak 14 days → +50 XP bonus
- Streak 30 days → +100 XP bonus

Bonus XP awarded automatically when streak milestone is reached (on mission completion).

### Database Schema (Supabase)

Tables: `profiles` (extends auth.users), `missions`, `user_progress`, `level_up_logs`, `muscle_cooldown`. All tables have Row Level Security scoped to `auth.uid()`.

## Commands (once implemented)

```bash
# Setup
npx create-expo-app . --template expo-template-typescript
npx expo install react-native-screens react-native-safe-area-context
npm install zustand react-native-mmkv expo-haptics expo-av nativewind tailwindcss-react-native

# Development
npx expo start

# Build
eas build -p android --profile production
eas build -p ios --profile production
```

## Implementation Checklist (from TDD)

- All state uses Zustand + MMKV, never AsyncStorage
- Animations use Reanimated v4, not RN's built-in Animated API
- All fetch calls to Worker have timeout + retry (3x)
- Haptic feedback on every +1 button press (expo-haptics.impactAsync())
- Haptic + sound on quest complete and level up
- Side plank timer MUST pause when app goes to background (use AppState). If interrupted, timer resets and user must restart. Show local notification: "Plank interrupted, please restart."
- Muscle cooldown resets at midnight based on last_trained_at
- Dark mode only. Background: #0a0a0a, neon cyan: #00f3ff, neon pink: #ff00cc, text: #e0e0e0
- Offline mode: missions recordable, queued, synced on reconnect
- Offline queue retry: exponential backoff (1s, 2s, 4s, 8s) max 3 attempts. If still fails, keep in queue and retry on next launch.
- No ads or analytics tracking (except Sentry for errors)


