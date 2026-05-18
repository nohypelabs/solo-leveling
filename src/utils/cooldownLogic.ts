export type MuscleGroup = 'chest' | 'back' | 'core';

export const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours

export function isOnCooldown(lastTrainedAt: number | null): boolean {
  if (!lastTrainedAt) return false;
  return Date.now() - lastTrainedAt < COOLDOWN_MS;
}

export function getCooldownEnd(lastTrainedAt: number): number {
  return lastTrainedAt + COOLDOWN_MS;
}

export function getRemainingCooldown(lastTrainedAt: number): number {
  const remaining = getCooldownEnd(lastTrainedAt) - Date.now();
  return Math.max(0, remaining);
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
