export function calcPushUpXP(reps: number): number {
  return reps * 2;
}

export function calcPullUpXP(reps: number): number {
  return reps * 4;
}

export function calcSitUpXP(reps: number): number {
  return reps * 1;
}

export function calcPlankXP(seconds: number): number {
  return Math.floor(seconds / 10);
}

export function calcTotalXP(
  pushUp: number,
  pullUp: number,
  sitUp: number,
  plankSec: number,
): number {
  return (
    calcPushUpXP(pushUp) +
    calcPullUpXP(pullUp) +
    calcSitUpXP(sitUp) +
    calcPlankXP(plankSec)
  );
}

export function xpForNextLevel(currentXP: number): {
  needed: number;
  progress: number;
} {
  return {
    needed: 100 - currentXP,
    progress: Math.min(currentXP / 100, 1),
  };
}
