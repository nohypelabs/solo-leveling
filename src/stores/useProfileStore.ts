import { create } from 'zustand';
import { storage } from '@/lib/mmkv';

export type StatName = 'strength' | 'endurance' | 'recovery' | 'flexibility';

interface ProfileState {
  level: number;
  currentXP: number;
  totalXP: number;
  unallocatedPoints: number;
  strength: number;
  endurance: number;
  recovery: number;
  flexibility: number;

  addXP: (amount: number) => number;
  allocatePoint: (stat: StatName) => void;
}

function loadNum(key: string, fallback: number): number {
  return storage.getNumber(key) ?? fallback;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  level: loadNum('profile_level', 1),
  currentXP: loadNum('profile_currentXP', 0),
  totalXP: loadNum('profile_totalXP', 0),
  unallocatedPoints: loadNum('profile_unallocatedPoints', 0),
  strength: loadNum('profile_strength', 10),
  endurance: loadNum('profile_endurance', 8),
  recovery: loadNum('profile_recovery', 7),
  flexibility: loadNum('profile_flexibility', 6),

  addXP: (amount: number) => {
    const state = get();
    let newXP = state.currentXP + amount;
    const newTotal = state.totalXP + amount;
    let newLevel = state.level;
    let newPoints = state.unallocatedPoints;

    while (newXP >= 100) {
      newXP -= 100;
      newLevel++;
      newPoints++;
    }

    storage.set('profile_currentXP', newXP);
    storage.set('profile_totalXP', newTotal);
    storage.set('profile_level', newLevel);
    storage.set('profile_unallocatedPoints', newPoints);

    set({
      currentXP: newXP,
      totalXP: newTotal,
      level: newLevel,
      unallocatedPoints: newPoints,
    });

    return newLevel - state.level;
  },

  allocatePoint: (stat: StatName) => {
    const state = get();
    if (state.unallocatedPoints <= 0) return;

    const newVal = state[stat] + 1;
    storage.set(`profile_${stat}`, newVal);
    storage.set('profile_unallocatedPoints', state.unallocatedPoints - 1);

    set({
      [stat]: newVal,
      unallocatedPoints: state.unallocatedPoints - 1,
    });
  },
}));
