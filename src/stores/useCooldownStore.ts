import { create } from 'zustand';
import { storage } from '@/lib/mmkv';
import { isOnCooldown, type MuscleGroup } from '@/utils/cooldownLogic';

interface CooldownState {
  chestLastTrained: number | null;
  backLastTrained: number | null;
  coreLastTrained: number | null;

  isGroupOnCooldown: (group: MuscleGroup) => boolean;
  isAnyOnCooldown: () => boolean;
  getRemainingForGroup: (group: MuscleGroup) => number;
  startAllCooldowns: () => void;
  checkAndResetExpired: () => void;
  rehydrate: () => void;
}

function loadTimestamp(key: string): number | null {
  const val = storage.getNumber(key);
  return val ?? null;
}

function getGroupField(group: MuscleGroup): keyof CooldownState {
  const map: Record<MuscleGroup, keyof CooldownState> = {
    chest: 'chestLastTrained',
    back: 'backLastTrained',
    core: 'coreLastTrained',
  };
  return map[group];
}

export const useCooldownStore = create<CooldownState>((set, get) => ({
  chestLastTrained: loadTimestamp('cooldown_chest'),
  backLastTrained: loadTimestamp('cooldown_back'),
  coreLastTrained: loadTimestamp('cooldown_core'),

  isGroupOnCooldown: (group: MuscleGroup) => {
    const field = getGroupField(group);
    return isOnCooldown(get()[field] as number | null);
  },

  isAnyOnCooldown: () => {
    const s = get();
    return (
      isOnCooldown(s.chestLastTrained) ||
      isOnCooldown(s.backLastTrained) ||
      isOnCooldown(s.coreLastTrained)
    );
  },

  getRemainingForGroup: (group: MuscleGroup) => {
    const field = getGroupField(group);
    const ts = get()[field] as number | null;
    if (!ts) return 0;
    const remaining = ts + 48 * 60 * 60 * 1000 - Date.now();
    return Math.max(0, remaining);
  },

  startAllCooldowns: () => {
    const now = Date.now();
    storage.set('cooldown_chest', now);
    storage.set('cooldown_back', now);
    storage.set('cooldown_core', now);
    set({
      chestLastTrained: now,
      backLastTrained: now,
      coreLastTrained: now,
    });
  },

  checkAndResetExpired: () => {
    const s = get();
    const updates: Partial<CooldownState> = {};

    for (const [group, key] of [
      ['chest', 'chestLastTrained'],
      ['back', 'backLastTrained'],
      ['core', 'coreLastTrained'],
    ] as const) {
      const ts = s[key] as number | null;
      if (ts && !isOnCooldown(ts)) {
        storage.delete(`cooldown_${group}`);
        (updates as Record<string, unknown>)[key] = null;
      }
    }

    if (Object.keys(updates).length > 0) {
      set(updates);
    }
  },

  rehydrate: () => {
    set({
      chestLastTrained: loadTimestamp('cooldown_chest'),
      backLastTrained: loadTimestamp('cooldown_back'),
      coreLastTrained: loadTimestamp('cooldown_core'),
    });
  },
}));
