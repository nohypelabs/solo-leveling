import { useState, useCallback, useRef } from 'react';
import { useFrameProcessor, type Frame, runAtTargetFps } from 'react-native-vision-camera';
import { usePoseDetector, getAngle, type Pose } from 'react-native-esanusi-sensor-pose';
import { runOnJS } from 'react-native-reanimated';

export type ExerciseType = 'pushup' | 'situp';

export interface PoseDebugInfo {
  frameCount: number;
  detectCount: number;
  poseCount: number;
  lastAngle: number | null;
  phase: string;
}

export interface FrameSize {
  width: number;
  height: number;
}

function isPoseComplete(pose: Pose, exercise: ExerciseType): boolean {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const le = pose.leftElbow;
    const lw = pose.leftWrist;
    if (!ls || !le || !lw) return false;
    return getAngle(ls, le, lw) < 90;
  } else {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return false;
    return getAngle(ls, lh, lk) < 90;
  }
}

function isPoseReset(pose: Pose, exercise: ExerciseType): boolean {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const le = pose.leftElbow;
    const lw = pose.leftWrist;
    if (!ls || !le || !lw) return false;
    return getAngle(ls, le, lw) > 150;
  } else {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return false;
    return getAngle(ls, lh, lk) > 150;
  }
}

function getFormWarning(pose: Pose, exercise: ExerciseType): string | null {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return null;
    if (getAngle(ls, lh, lk) < 150) return 'Keep your back straight';
    return null;
  } else {
    const lk = pose.leftKnee;
    const lh = pose.leftHip;
    const la = pose.leftAnkle;
    if (!lk || !lh || !la) return null;
    if (getAngle(la, lk, lh) > 120) return 'Bend your knees more';
    return null;
  }
}

function getCurrentAngle(pose: Pose, exercise: ExerciseType): number | null {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const le = pose.leftElbow;
    const lw = pose.leftWrist;
    if (!ls || !le || !lw) return null;
    return getAngle(ls, le, lw);
  } else {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return null;
    return getAngle(ls, lh, lk);
  }
}

export function usePoseDetection(exercise: ExerciseType, onRepComplete: () => void) {
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
  });

  const phaseRef = useRef<'up' | 'down'>('up');
  const repCountRef = useRef(0);
  const frameCountRef = useRef(0);
  const detectCountRef = useRef(0);
  const poseCountRef = useRef(0);
  const onRepRef = useRef(onRepComplete);
  onRepRef.current = onRepComplete;

  const { detectPose } = usePoseDetector({
    performanceMode: 'fast',
    detectorMode: 'stream',
    minLandmarkConfidence: 0.5,
  });

  const frameProcessor = useFrameProcessor((frame: Frame) => {
    'worklet';

    runAtTargetFps(15, () => {
      'worklet';
      try {
        frameCountRef.current++;
        const w = frame.width;
        const h = frame.height;

        const poses = detectPose(frame);
        detectCountRef.current++;

        // Update frame size
        if (w > 0 && h > 0) {
          runOnJS(setFrameSize)({ width: w, height: h });
        }

        if (!poses || poses.length === 0) {
          runOnJS(setCurrentPoses)([]);
          runOnJS(setDebug)({
            frameCount: frameCountRef.current,
            detectCount: detectCountRef.current,
            poseCount: 0,
            lastAngle: null,
            phase: phaseRef.current,
          });
          runOnJS(setFormWarning)('No person detected — adjust camera');
          return;
        }

        const pose = poses[0];
        poseCountRef.current++;

        // Update overlay poses
        runOnJS(setCurrentPoses)([pose]);

        const angle = getCurrentAngle(pose, exercise);

        runOnJS(setDebug)({
          frameCount: frameCountRef.current,
          detectCount: detectCountRef.current,
          poseCount: poseCountRef.current,
          lastAngle: angle,
          phase: phaseRef.current,
        });

        if (isPoseComplete(pose, exercise)) {
          if (phaseRef.current === 'up') {
            phaseRef.current = 'down';
            repCountRef.current += 1;
            runOnJS(setUiRepCount)(repCountRef.current);
            runOnJS(onRepRef.current)();
          }
        } else if (isPoseReset(pose, exercise)) {
          phaseRef.current = 'up';
        }

        runOnJS(setFormWarning)(getFormWarning(pose, exercise));
      } catch (e) {
        runOnJS(setCurrentPoses)([]);
        runOnJS(setDebug)({
          frameCount: frameCountRef.current,
          detectCount: 0,
          poseCount: 0,
          lastAngle: null,
          phase: 'error: ' + String(e),
        });
      }
    });
  }, [exercise, detectPose]);

  const reset = useCallback(() => {
    phaseRef.current = 'up';
    repCountRef.current = 0;
    frameCountRef.current = 0;
    detectCountRef.current = 0;
    poseCountRef.current = 0;
    setUiRepCount(0);
    setFormWarning(null);
    setCurrentPoses([]);
    setDebug({ frameCount: 0, detectCount: 0, poseCount: 0, lastAngle: null, phase: 'up' });
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
