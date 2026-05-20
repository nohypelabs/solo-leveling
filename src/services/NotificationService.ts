import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useMissionStore } from '@/stores/useMissionStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let initialized = false;

export async function initNotifications(): Promise<string | null> {
  if (initialized) return null;

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  initialized = true;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('solo-leveling', {
      name: 'Solo Leveling',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00f3ff',
      sound: 'default',
    });
  }

  return (await Notifications.getExpoPushTokenAsync()).data;
}

export async function scheduleDailyMissionReminder() {
  await cancelAllScheduled();

  const settings = useNotificationStore.getState();
  if (!settings.enabled) return;

  const mission = useMissionStore.getState();

  // Morning reminder — "New Daily Mission Available"
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚔️ New Daily Mission Available',
      body: 'Shadow System has generated your training for today. Push-up, Pull-up, Sit-up, Side Plank.',
      data: { type: 'morning_mission' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.morningHour,
      minute: settings.morningMinute,
      channelId: 'solo-leveling',
    },
  });

  // Evening reminder — check if missions incomplete
  const isIncomplete = !mission.isMissionComplete;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: isIncomplete
        ? '⚠️ Daily Mission Incomplete'
        : '✅ Training Complete',
      body: isIncomplete
        ? 'Shadow System reminds you to complete your training. The weak die, the strong survive.'
        : 'Rest well, Builder. Tomorrow brings new challenges.',
      data: { type: 'evening_reminder' },
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: settings.eveningHour,
      minute: settings.eveningMinute,
      channelId: 'solo-leveling',
    },
  });

  // Hardcore mode — every 30 min if incomplete
  if (settings.hardcoreMode) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔥 Training Incomplete!',
        body: 'Hardcore mode active. Complete your missions now!',
        data: { type: 'hardcore_reminder' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 10,
        minute: 0,
        repeats: true,
        channelId: 'solo-leveling',
      },
    });
  }
}

export async function sendLevelUpNotification(level: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⬆️ LEVEL UP! Level ${level}`,
      body: 'You have grown stronger. New power awaits allocation.',
      data: { type: 'level_up', level },
      sound: 'default',
    },
    trigger: null, // immediate
  });
}

export async function sendQuestCompleteNotification(xp: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Quest Complete!',
      body: `All daily missions completed! +${xp} XP earned.`,
      data: { type: 'quest_complete', xp },
      sound: 'default',
    },
    trigger: null,
  });
}

export async function cancelAllScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
