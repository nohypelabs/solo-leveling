import { create } from 'zustand';
import { storage } from '@/lib/mmkv';
import { calcTotalXP } from '@/utils/xpCalculator';
import {
  getTodayString,
  isYesterday,
  isToday,
  getNewMilestones,
  getMilestoneBonus,
} from '@/utils/streakLogic';
import { getRewardForDay, type Reward } from '@/utils/rewards';
import { playQuestCompleteSound } from '@/utils/sound';
import { useProfileStore } from './useProfileStore';
import { useCooldownStore } from './useCooldownStore';

interface MissionState {
  pushUpDone: number;
  pullUpDone: number;
  sitUpDone: number;
  plankSecondsDone: number;
  isMissionComplete: boolean;
  lastMissionDate: string | null;
  streakDays: number;
  lastStreakDate: string | null;
  claimedMilestones: number[];
  lastReward: Reward | null;

  incrementPushUp: () => void;
  incrementPullUp: () => void;
  incrementSitUp: () => void;
  setPlankSecondsDone: (seconds: number) => void;
  checkAndCompleteMission: () => boolean;
  resetDailyIfNeeded: () => void;
  rehydrate: () => void;
}

function loadNum(key: string, fallback: number): number {
  return storage.getNumber(key) ?? fallback;
}
function loadStr(key: string, fallback: string | null): string | null {
  return storage.getString(key) ?? fallback;
}
function loadClaimed(): number[] {
  const raw = storage.getString('mission_claimedMilestones');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const MISSION_TARGETS = {
  pushUp: 15,
  pullUp: 5,
  sitUp: 10,
  plank: 60,
} as const;

export const useMissionStore = create<MissionState>((set, get) => ({
  pushUpDone: loadNum('mission_pushUpDone', 0),
  pullUpDone: loadNum('mission_pullUpDone', 0),
  sitUpDone: loadNum('mission_sitUpDone', 0),
  plankSecondsDone: loadNum('mission_plankDone', 0),
  isMissionComplete: storage.getBoolean('mission_isComplete') === true,
  lastMissionDate: loadStr('mission_lastDate', null),
  streakDays: loadNum('mission_streakDays', 0),
  lastStreakDate: loadStr('mission_lastStreakDate', null),
  claimedMilestones: loadClaimed(),
  lastReward: null,

  incrementPushUp: () => {
    const s = get();
    if (s.isMissionComplete) return;
    if (useCooldownStore.getState().isGroupOnCooldown('chest')) return;
    const newVal = Math.min(s.pushUpDone + 1, MISSION_TARGETS.pushUp);
    storage.set('mission_pushUpDone', newVal);
    set({ pushUpDone: newVal });
    get().checkAndCompleteMission();
  },

  incrementPullUp: () => {
    const s = get();
    if (s.isMissionComplete) return;
    if (useCooldownStore.getState().isGroupOnCooldown('back')) return;
    const newVal = Math.min(s.pullUpDone + 1, MISSION_TARGETS.pullUp);
    storage.set('mission_pullUpDone', newVal);
    set({ pullUpDone: newVal });
    get().checkAndCompleteMission();
  },

  incrementSitUp: () => {
    const s = get();
    if (s.isMissionComplete) return;
    if (useCooldownStore.getState().isGroupOnCooldown('core')) return;
    const newVal = Math.min(s.sitUpDone + 1, MISSION_TARGETS.sitUp);
    storage.set('mission_sitUpDone', newVal);
    set({ sitUpDone: newVal });
    get().checkAndCompleteMission();
  },

  setPlankSecondsDone: (seconds: number) => {
    const val = Math.min(seconds, MISSION_TARGETS.plank);
    storage.set('mission_plankDone', val);
    set({ plankSecondsDone: val });
  },

  checkAndCompleteMission: () => {
    const s = get();
    if (s.isMissionComplete) return false;

    const allDone =
      s.pushUpDone >= MISSION_TARGETS.pushUp &&
      s.pullUpDone >= MISSION_TARGETS.pullUp &&
      s.sitUpDone >= MISSION_TARGETS.sitUp &&
      s.plankSecondsDone >= MISSION_TARGETS.plank;

    if (!allDone) return false;

    const today = getTodayString();

    // Calculate streak
    let newStreak = s.streakDays;
    let newLastStreak = s.lastStreakDate;
    if (isToday(s.lastStreakDate)) {
      // Already completed today, shouldn't happen but guard
    } else if (isYesterday(s.lastStreakDate)) {
      newStreak = s.streakDays + 1;
      newLastStreak = today;
    } else {
      newStreak = 1;
      newLastStreak = today;
    }

    // Calculate milestone bonuses
    const newMilestones = getNewMilestones(newStreak, s.claimedMilestones);
    const bonusXP = getMilestoneBonus(newMilestones);
    const updatedClaimed = [...s.claimedMilestones, ...newMilestones];

    // Calculate total XP
    const missionXP = calcTotalXP(
      s.pushUpDone,
      s.pullUpDone,
      s.sitUpDone,
      s.plankSecondsDone,
    );
    const totalXP = missionXP + bonusXP;

    // Award XP
    useProfileStore.getState().addXP(totalXP);

    // Start cooldowns
    useCooldownStore.getState().startAllCooldowns();

    // Get reward
    const reward = getRewardForDay(newStreak);

    // Play sound
    playQuestCompleteSound();

    // Persist
    storage.set('mission_isComplete', true);
    storage.set('mission_lastDate', today);
    storage.set('mission_streakDays', newStreak);
    storage.set('mission_lastStreakDate', newLastStreak);
    storage.set(
      'mission_claimedMilestones',
      JSON.stringify(updatedClaimed),
    );

    set({
      isMissionComplete: true,
      lastMissionDate: today,
      streakDays: newStreak,
      lastStreakDate: newLastStreak,
      claimedMilestones: updatedClaimed,
      lastReward: reward,
    });

    return true;
  },

  resetDailyIfNeeded: () => {
    const s = get();
    const today = getTodayString();

    if (s.lastMissionDate === today) return;
    // If last mission was completed on a previous day, reset progress
    if (s.lastMissionDate && s.lastMissionDate !== today) {
      storage.set('mission_pushUpDone', 0);
      storage.set('mission_pullUpDone', 0);
      storage.set('mission_sitUpDone', 0);
      storage.set('mission_plankDone', 0);
      storage.set('mission_isComplete', false);
      set({
        pushUpDone: 0,
        pullUpDone: 0,
        sitUpDone: 0,
        plankSecondsDone: 0,
        isMissionComplete: false,
      });
    }

    // If no mission has ever been done, check if streak is broken
    if (s.lastStreakDate && !isToday(s.lastStreakDate) && !isYesterday(s.lastStreakDate)) {
      // Streak broken, but don't reset streakDays yet — it resets on next mission
    }

    useCooldownStore.getState().checkAndResetExpired();
  },

  rehydrate: () => {
    set({
      pushUpDone: loadNum('mission_pushUpDone', 0),
      pullUpDone: loadNum('mission_pullUpDone', 0),
      sitUpDone: loadNum('mission_sitUpDone', 0),
      plankSecondsDone: loadNum('mission_plankDone', 0),
      isMissionComplete: storage.getBoolean('mission_isComplete') === true,
      lastMissionDate: loadStr('mission_lastDate', null),
      streakDays: loadNum('mission_streakDays', 0),
      lastStreakDate: loadStr('mission_lastStreakDate', null),
      claimedMilestones: loadClaimed(),
    });
  },
}));
