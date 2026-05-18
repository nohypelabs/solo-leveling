export interface StreakMilestone {
  days: number;
  bonusXP: number;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, bonusXP: 10 },
  { days: 7, bonusXP: 25 },
  { days: 14, bonusXP: 50 },
  { days: 30, bonusXP: 100 },
];

export function getStreakBonus(streakDays: number): number {
  let bonus = 0;
  for (const milestone of STREAK_MILESTONES) {
    if (streakDays >= milestone.days) {
      bonus = milestone.bonusXP;
    }
  }
  return bonus;
}

export function getNewMilestones(
  streakDays: number,
  claimedMilestones: number[],
): number[] {
  return STREAK_MILESTONES.filter(
    (m) => streakDays >= m.days && !claimedMilestones.includes(m.days),
  ).map((m) => m.days);
}

export function getMilestoneBonus(milestones: number[]): number {
  return milestones.reduce((sum, day) => {
    const m = STREAK_MILESTONES.find((s) => s.days === day);
    return sum + (m?.bonusXP ?? 0);
  }, 0);
}

export function isStreakBroken(lastStreakDate: string | null): boolean {
  if (!lastStreakDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastStreakDate + 'T00:00:00');
  last.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000),
  );
  return diffDays > 1;
}

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isYesterday(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000),
  );
  return diffDays === 1;
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayString();
}
