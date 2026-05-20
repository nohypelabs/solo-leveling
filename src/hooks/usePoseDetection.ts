import { useState, useCallback, useRef } from 'react';
import { useFrameProcessor, type Frame, runAtTargetFps } from 'react-native-vision-camera';
import { usePoseDetector, getAngle, type Pose } from 'react-native-esanusi-sensor-pose';
import { runOnJS } from 'react-native-reanimated';

export type ExerciseType = 'pushup' | 'situp';

function isPoseComplete(pose: Pose, exercise: ExerciseType): boolean {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const le = pose.leftElbow;
    const lw = pose.leftWrist;
    if (!ls || !le || !lw) return false;
    const angle = getAngle(ls, le, lw);
    return angle < 90;
  } else {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return false;
    const angle = getAngle(ls, lh, lk);
    return angle < 90;
  }
}

function isPoseReset(pose: Pose, exercise: ExerciseType): boolean {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const le = pose.leftElbow;
    const lw = pose.leftWrist;
    if (!ls || !le || !lw) return false;
    const angle = getAngle(ls, le, lw);
    return angle > 150;
  } else {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return false;
    const angle = getAngle(ls, lh, lk);
    return angle > 150;
  }
}

function getFormWarning(pose: Pose, exercise: ExerciseType): string | null {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    if (!ls || !lh || !lk) return null;
    const bodyAngle = getAngle(ls, lh, lk);
    if (bodyAngle < 150) return 'Keep your back straight';
    return null;
  } else {
    const lk = pose.leftKnee;
    const lh = pose.leftHip;
    const la = pose.leftAnkle;
    if (!lk || !lh || !la) return null;
    const kneeAngle = getAngle(la, lk, lh);
    if (kneeAngle > 120) return 'Bend your knees more';
    return null;
  }
}

export function usePoseDetection(exercise: ExerciseType, onRepComplete: () => void) {
  const [uiRepCount, setUiRepCount] = useState(0);
  const [formWarning, setFormWarning] = useState<string | null>(null);

  const phaseRef = useRef<'up' | 'down'>('up');
  const repCountRef = useRef(0);
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
        const poses = detectPose(frame);
        if (!poses || poses.length === 0) {
          runOnJS(setFormWarning)('No person detected — adjust camera');
          return;
        }

        const pose = poses[0];

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

        const warning = getFormWarning(pose, exercise);
        runOnJS(setFormWarning)(warning);
      } catch (e) {
        // Silent fail on frame processing errors
      }
    });
  }, [exercise, detectPose]);

  const reset = useCallback(() => {
    phaseRef.current = 'up';
    repCountRef.current = 0;
    setUiRepCount(0);
    setFormWarning(null);
  }, []);

  return {
    frameProcessor,
    repCount: uiRepCount,
    formWarning,
    reset,
  };
}
