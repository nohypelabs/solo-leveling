import { create } from 'zustand';
import { storage } from '@/lib/mmkv';

interface NotificationSettings {
  enabled: boolean;
  morningHour: number; // 0-23
  morningMinute: number;
  eveningHour: number;
  eveningMinute: number;
  hardcoreMode: boolean; // reminder every 30 min if incomplete

  setEnabled: (v: boolean) => void;
  setMorningTime: (hour: number, minute: number) => void;
  setEveningTime: (hour: number, minute: number) => void;
  setHardcoreMode: (v: boolean) => void;
  rehydrate: () => void;
}

function loadNum(key: string, fallback: number): number {
  return storage.getNumber(key) ?? fallback;
}
function loadBool(key: string, fallback: boolean): boolean {
  const v = storage.getBoolean(key);
  return v !== undefined ? v : fallback;
}

export const useNotificationStore = create<NotificationSettings>((set, get) => ({
  enabled: loadBool('notif_enabled', true),
  morningHour: loadNum('notif_morningHour', 7),
  morningMinute: loadNum('notif_morningMinute', 0),
  eveningHour: loadNum('notif_eveningHour', 20),
  eveningMinute: loadNum('notif_eveningMinute', 0),
  hardcoreMode: loadBool('notif_hardcore', false),

  setEnabled: (v: boolean) => {
    storage.set('notif_enabled', v);
    set({ enabled: v });
  },
  setMorningTime: (hour: number, minute: number) => {
    storage.set('notif_morningHour', hour);
    storage.set('notif_morningMinute', minute);
    set({ morningHour: hour, morningMinute: minute });
  },
  setEveningTime: (hour: number, minute: number) => {
    storage.set('notif_eveningHour', hour);
    storage.set('notif_eveningMinute', minute);
    set({ eveningHour: hour, eveningMinute: minute });
  },
  setHardcoreMode: (v: boolean) => {
    storage.set('notif_hardcore', v);
    set({ hardcoreMode: v });
  },
  rehydrate: () => {
    set({
      enabled: loadBool('notif_enabled', get().enabled),
      morningHour: loadNum('notif_morningHour', get().morningHour),
      morningMinute: loadNum('notif_morningMinute', get().morningMinute),
      eveningHour: loadNum('notif_eveningHour', get().eveningHour),
      eveningMinute: loadNum('notif_eveningMinute', get().eveningMinute),
      hardcoreMode: loadBool('notif_hardcore', get().hardcoreMode),
    });
  },
}));
