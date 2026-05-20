import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback patterns for Solo Leveling Fitness.
 * Optimized for linear haptic motor (Poco F5 / Snapdragon 7+ Gen 2).
 */

/** +1 button press — light tap */
export function hapticTap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Single mission completed — medium + notification */
export function hapticMissionDone() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, 100);
}

/** Level up — heavy triple pulse */
export async function hapticLevelUp() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await delay(80);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await delay(80);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  await delay(150);
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Quest complete (all missions done) — long single vibration */
export async function hapticQuestComplete() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await delay(200);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/** Status point allocated — medium confirmation */
export function hapticAllocate() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/** Error / blocked action — warning */
export function hapticWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/** Plank timer tick (last 10 seconds) — light ticks */
export function hapticTick() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
