import { useState, useCallback, useRef, useMemo } from 'react';
import { useFrameProcessor, type Frame, type FrameInternal } from 'react-native-vision-camera';
import { Worklets, useSharedValue } from 'react-native-worklets-core';
import { usePoseDetector, getAngle, type Pose } from 'react-native-esanusi-sensor-pose';

export type ExerciseType = 'pushup' | 'situp';

export interface PoseDebugInfo {
  frameCount: number;
  detectCount: number;
  poseCount: number;
  lastAngle: number | null;
  phase: string;
  bob: string | null;
}

export interface FrameSize {
  width: number;
  height: number;
}

// ---- tuning ----
const COMPLETE_ANGLE = 100; // bent enough = bottom of rep
const RESET_ANGLE = 150; // extended enough = top of rep
const MIN_CONF = 0.4; // ignore landmarks below this likelihood
const SMOOTH_WINDOW = 3; // moving-average taps: 3 = ~300ms lag at 10Hz, still kills single-frame spikes
const MIN_REP_INTERVAL_MS = 700; // debounce between counted reps
const EVERY_NTH_FRAME = 3; // ~10Hz payloads at 30fps preview
// Displacement cycle tracker (camera-agnostic rep counting):
// baseline = position 0 (body up). Excursion beyond BOB_ARM arms the
// tracker, return within BOB_RETURN of baseline counts 1 rep.
const BOB_ARM = 0.045; // normalized excursion that arms a rep
const BOB_RETURN = 0.018; // must return within this of baseline to count
const BOB_MIN_EXCURSION_MS = 350; // excursion must last this long (reject jitter)
const BOB_MIN_INTERVAL_MS = 1000; // debounce between bob-counted reps

function mirrorLandmark(lm: any, frameWidth: number) {
  return { ...lm, x: frameWidth - lm.x };
}

function mirrorPose(pose: Pose, frameWidth: number): Pose {
  const result: Pose = {};
  for (const key in pose) {
    const lm = pose[key as keyof Pose];
    if (lm) {
      (result as Record<string, any>)[key] = mirrorLandmark(lm, frameWidth);
    }
  }
  return result;
}

function confOk(...lms: any[]): boolean {
  for (const lm of lms) {
    if (!lm) return false;
    if ((lm.inFrameLikelihood ?? 1) < MIN_CONF) return false;
  }
  return true;
}

function getBestArmAngle(pose: Pose): number | null {
  const ls = pose.leftShoulder;
  const le = pose.leftElbow;
  const lw = pose.leftWrist;

  const rs = pose.rightShoulder;
  const re = pose.rightElbow;
  const rw = pose.rightWrist;

  const leftValid = confOk(ls, le, lw);
  const rightValid = confOk(rs, re, rw);

  if (!leftValid && !rightValid) return null;

  if (leftValid && rightValid) {
    const leftConf = Math.min(ls!.inFrameLikelihood ?? 1, le!.inFrameLikelihood ?? 1, lw!.inFrameLikelihood ?? 1);
    const rightConf = Math.min(rs!.inFrameLikelihood ?? 1, re!.inFrameLikelihood ?? 1, rw!.inFrameLikelihood ?? 1);
    return leftConf >= rightConf ? getAngle(ls!, le!, lw!) : getAngle(rs!, re!, rw!);
  }

  if (leftValid) return getAngle(ls!, le!, lw!);
  return getAngle(rs!, re!, rw!);
}

function getBestTorsoAngle(pose: Pose): number | null {
  const ls = pose.leftShoulder;
  const lh = pose.leftHip;
  const lk = pose.leftKnee;

  const rs = pose.rightShoulder;
  const rh = pose.rightHip;
  const rk = pose.rightKnee;

  const leftValid = confOk(ls, lh, lk);
  const rightValid = confOk(rs, rh, rk);

  if (!leftValid && !rightValid) return null;

  if (leftValid && rightValid) {
    const leftConf = Math.min(ls!.inFrameLikelihood ?? 1, lh!.inFrameLikelihood ?? 1, lk!.inFrameLikelihood ?? 1);
    const rightConf = Math.min(rs!.inFrameLikelihood ?? 1, rh!.inFrameLikelihood ?? 1, rk!.inFrameLikelihood ?? 1);
    return leftConf >= rightConf ? getAngle(ls!, lh!, lk!) : getAngle(rs!, rh!, rk!);
  }

  if (leftValid) return getAngle(ls!, lh!, lk!);
  return getAngle(rs!, rh!, rk!);
}

function getCurrentAngle(pose: Pose, exercise: ExerciseType): number | null {
  if (exercise === 'pushup') {
    return getBestArmAngle(pose);
  } else {
    return getBestTorsoAngle(pose);
  }
}

function getShoulderCenterY(pose: Pose): number | null {
  const ls = pose.leftShoulder;
  const rs = pose.rightShoulder;
  if (ls && rs && (ls.inFrameLikelihood ?? 1) >= MIN_CONF && (rs.inFrameLikelihood ?? 1) >= MIN_CONF) {
    return (ls.y + rs.y) / 2;
  }
  if (ls && (ls.inFrameLikelihood ?? 1) >= MIN_CONF) return ls.y;
  if (rs && (rs.inFrameLikelihood ?? 1) >= MIN_CONF) return rs.y;
  return null;
}

function getFormWarning(pose: Pose, exercise: ExerciseType): string | null {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;

    const rs = pose.rightShoulder;
    const rh = pose.rightHip;
    const rk = pose.rightKnee;

    const leftValid = confOk(ls, lh, lk);
    const rightValid = confOk(rs, rh, rk);

    if (!leftValid && !rightValid) return null;

    let backAngle = 180;
    if (leftValid && rightValid) {
      const leftConf = Math.min(ls!.inFrameLikelihood ?? 1, lh!.inFrameLikelihood ?? 1, lk!.inFrameLikelihood ?? 1);
      const rightConf = Math.min(rs!.inFrameLikelihood ?? 1, rh!.inFrameLikelihood ?? 1, rk!.inFrameLikelihood ?? 1);
      backAngle = leftConf >= rightConf ? getAngle(ls!, lh!, lk!) : getAngle(rs!, rh!, rk!);
    } else if (leftValid) {
      backAngle = getAngle(ls!, lh!, lk!);
    } else {
      backAngle = getAngle(rs!, rh!, rk!);
    }

    if (backAngle < 140) return 'Keep your back straight';
    return null;
  } else {
    const lk = pose.leftKnee;
    const lh = pose.leftHip;
    const la = pose.leftAnkle;

    const rk = pose.rightKnee;
    const rh = pose.rightHip;
    const ra = pose.rightAnkle;

    const leftValid = confOk(lk, lh, la);
    const rightValid = confOk(rk, rh, ra);

    if (!leftValid && !rightValid) return null;

    let kneeAngle = 90;
    if (leftValid && rightValid) {
      const leftConf = Math.min(lk!.inFrameLikelihood ?? 1, lh!.inFrameLikelihood ?? 1, la!.inFrameLikelihood ?? 1);
      const rightConf = Math.min(rk!.inFrameLikelihood ?? 1, rh!.inFrameLikelihood ?? 1, ra!.inFrameLikelihood ?? 1);
      kneeAngle = leftConf >= rightConf ? getAngle(la!, lk!, lh!) : getAngle(ra!, rk!, rh!);
    } else if (leftValid) {
      kneeAngle = getAngle(la!, lk!, lh!);
    } else {
      kneeAngle = getAngle(ra!, rk!, rh!);
    }

    if (kneeAngle > 130) return 'Bend your knees more';
    return null;
  }
}

interface Payload {
  posesJson: string;
  width: number;
  height: number;
  frameCount: number;
}

export function usePoseDetection(exercise: ExerciseType, onRepComplete: () => void, mirrorX: boolean = true, counting: boolean = true) {
  const [uiRepCount, setUiRepCount] = useState(0);
  const [formWarning, setFormWarning] = useState<string | null>(null);
  const [currentPoses, setCurrentPoses] = useState<Pose[]>([]);
  const [frameSize, setFrameSize] = useState<FrameSize>({ width: 0, height: 0 });
  const [debug, setDebug] = useState<PoseDebugInfo>({
    frameCount: 0,
    detectCount: 0,
    poseCount: 0,
    lastAngle: null,
    phase: 'up',
    bob: null,
  });

  const phaseRef = useRef<'up' | 'down'>('up');
  const repCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const detectCountRef = useRef(0);
  const poseCountRef = useRef(0);
  const angleWindowRef = useRef<number[]>([]);
  const lastRepTimeRef = useRef(0);
  const nullStreakRef = useRef(0);
  // Displacement tracker: shoulder-Y oscillation when joint angles are occluded.
  // Works for any exercise/camera — baseline = position 0 (body up).
  const bobBaselineRef = useRef<number | null>(null);
  const bobArmedRef = useRef(false);
  const bobArmTimeRef = useRef(0);
  const onRepRef = useRef(onRepComplete);
  onRepRef.current = onRepComplete;
  const exerciseRef = useRef(exercise);
  exerciseRef.current = exercise;
  const mirrorRef = useRef(mirrorX);
  mirrorRef.current = mirrorX;
  // Preview mode (counting=false): skeleton + debug keep tracking the full
  // body so the user can position themselves, but no reps are counted.
  const countingRef = useRef(counting);
  countingRef.current = counting;

  const { detectPose } = usePoseDetector({
    performanceMode: 'fast',
    detectorMode: 'stream',
    minLandmarkConfidence: 0.5,
  });

  // Async bridge: worklet -> JS. Created once via worklets-core (NOT reanimated),
  // because VisionCamera v4 frame processors run on the worklets-core runtime.
  const handlePayload = useCallback((p: Payload) => {
    frameCountRef.current += 1;
    detectCountRef.current += 1;
    let poses: Pose[] = [];
    try {
      poses = JSON.parse(p.posesJson) as Pose[];
    } catch {
      poses = [];
    }

    if (p.width > 0 && p.height > 0) {
      setFrameSize((prev: FrameSize) => (prev.width === p.width && prev.height === p.height ? prev : { width: p.width, height: p.height }));
    }

    const ex = exerciseRef.current;

    if (!poses || poses.length === 0) {
      nullStreakRef.current += 1;
      // Body left the frame: drop the armed bob cycle and stale baseline so a
      // re-appearing body can't instantly "return" into a phantom rep.
      if (nullStreakRef.current > 10) {
        bobArmedRef.current = false;
        bobBaselineRef.current = null;
        angleWindowRef.current = [];
      }
      setCurrentPoses([]);
      setDebug({
        frameCount: frameCountRef.current,
        detectCount: detectCountRef.current,
        poseCount: 0,
        lastAngle: null,
        phase: phaseRef.current,
        bob: null,
      });
      setFormWarning('No person detected — adjust camera');
      return;
    }
    poseCountRef.current += 1;

    const pose = poses[0];
    const w = p.width;
    const poseToRender = mirrorRef.current && w > 0 ? mirrorPose(pose, w) : pose;
    setCurrentPoses([poseToRender]);

    const rawAngle = getCurrentAngle(pose, ex);
    let smoothAngle: number | null = null;
    if (rawAngle !== null) {
      nullStreakRef.current = 0;
      const win = angleWindowRef.current;
      win.push(rawAngle);
      if (win.length > SMOOTH_WINDOW) win.shift();
      smoothAngle = win.reduce((a: number, b: number) => a + b, 0) / win.length;
    } else {
      nullStreakRef.current += 1;
      // decay the window so a stale angle can't latch the phase forever
      if (nullStreakRef.current > 10) angleWindowRef.current = [];
    }

    const now = Date.now();
    if (smoothAngle !== null) {
      if (smoothAngle < COMPLETE_ANGLE) {
        // bottom of rep — arm the down phase, count when pushing back up
        phaseRef.current = 'down';
      } else if (smoothAngle > RESET_ANGLE && phaseRef.current === 'down') {
        phaseRef.current = 'up';
        if (countingRef.current && now - lastRepTimeRef.current >= MIN_REP_INTERVAL_MS) {
          lastRepTimeRef.current = now;
          repCountRef.current += 1;
          setUiRepCount(repCountRef.current);
          onRepRef.current();
        }
      } else if (smoothAngle > RESET_ANGLE) {
        phaseRef.current = 'up';
      }
      // a good angle keeps the phase machine in sync (bob tracker runs below regardless)
    }

    // Displacement tracker (fused second signal, runs every frame for any
    // exercise/camera): baseline = position 0 (body up). Excursion beyond
    // BOB_ARM arms the tracker; return within BOB_RETURN of baseline = 1 rep.
    // Shares lastRepTimeRef with the angle path so one physical rep = 1 count.
    let bobLabel: string | null = null;
    const y = getShoulderCenterY(pose);
    if (y !== null && p.height > 0) {
      const yn = y / p.height;
      let base = bobBaselineRef.current;
      if (base === null) {
        base = yn;
        bobBaselineRef.current = base;
      }
      const dev = Math.abs(yn - base);
      if (!bobArmedRef.current) {
        if (dev > BOB_ARM) {
          bobArmedRef.current = true;
          bobArmTimeRef.current = now;
        } else {
          // slow EMA toward rest so baseline tracks position 0 as the user shifts
          bobBaselineRef.current = base + (yn - base) * 0.05;
        }
      }
      if (bobArmedRef.current) {
        bobLabel = `armed ${dev.toFixed(3)}`;
        if (
          dev < BOB_RETURN &&
          now - bobArmTimeRef.current >= BOB_MIN_EXCURSION_MS &&
          countingRef.current &&
          now - lastRepTimeRef.current >= BOB_MIN_INTERVAL_MS
        ) {
          bobArmedRef.current = false;
          lastRepTimeRef.current = now;
          bobBaselineRef.current = yn;
          repCountRef.current += 1;
          setUiRepCount(repCountRef.current);
          onRepRef.current();
          bobLabel = 'counted';
        }
      } else {
        bobLabel = `rest ${dev.toFixed(3)}`;
      }
    }

    setDebug({
      frameCount: frameCountRef.current,
      detectCount: detectCountRef.current,
      poseCount: poseCountRef.current,
      lastAngle: smoothAngle,
      phase: phaseRef.current,
      bob: bobLabel,
    });
    setFormWarning(getFormWarning(pose, ex));
  }, []);

  const runOnJs = useMemo(() => Worklets.createRunOnJS(handlePayload), [handlePayload]);
  const busy = useSharedValue(false);
  const tick = useSharedValue(0);

  // detectPose is memoized by the library (stable unless options change) and
  // runOnJs above is stable too, so closing over them directly is safe and
  // matches the library's own Camera implementation. Do NOT stash them in
  // refs — ref objects don't survive worklet serialization reliably.
  const runAsync = useMemo(
    () =>
      Worklets.defaultContext.createRunAsync((frame: Frame) => {
        'worklet';
        try {
          const poses = detectPose(frame) as Pose[] | null;
          const json = JSON.stringify(poses ?? []);
          runOnJs({ posesJson: json, width: frame.width, height: frame.height, frameCount: 0 });
        } catch {
          runOnJs({
            posesJson: '[]',
            width: frame.width,
            height: frame.height,
            frameCount: 0,
          });
        } finally {
          // Same private API the esanusi Camera itself uses: keep the frame
          // alive across the async boundary, release when done.
          (frame as FrameInternal).decrementRefCount();
          busy.value = false;
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detectPose, runOnJs],
  );

  const frameProcessor = useFrameProcessor(
    (frame: Frame) => {
      'worklet';
      if (busy.value) return;
      tick.value += 1;
      if (tick.value % EVERY_NTH_FRAME !== 0) return;
      busy.value = true;
      (frame as FrameInternal).incrementRefCount();
      runAsync(frame);
    },
    [runAsync],
  );

  const reset = useCallback(() => {
    phaseRef.current = 'up';
    repCountRef.current = 0;
    frameCountRef.current = 0;
    detectCountRef.current = 0;
    poseCountRef.current = 0;
    angleWindowRef.current = [];
    lastRepTimeRef.current = 0;
    nullStreakRef.current = 0;
    bobBaselineRef.current = null;
    bobArmedRef.current = false;
    bobArmTimeRef.current = 0;
    setUiRepCount(0);
    setFormWarning(null);
    setCurrentPoses([]);
    setDebug({ frameCount: 0, detectCount: 0, poseCount: 0, lastAngle: null, phase: 'up', bob: null });
  }, []);

  return {
    frameProcessor,
    repCount: uiRepCount,
    formWarning,
    reset,
    debug,
    currentPoses,
    frameSize,
  };
}
