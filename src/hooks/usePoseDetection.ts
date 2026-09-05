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

function mirrorLandmark(lm: any, frameWidth: number) {
  'worklet';
  return { ...lm, x: frameWidth - lm.x };
}

function mirrorPose(pose: Pose, frameWidth: number): Pose {
  'worklet';
  const result: Pose = {};
  for (const key in pose) {
    const lm = pose[key as keyof Pose];
    if (lm) {
      (result as Record<string, any>)[key] = mirrorLandmark(lm, frameWidth);
    }
  }
  return result;
}

function getBestArmAngle(pose: Pose): number | null {
  const ls = pose.leftShoulder;
  const le = pose.leftElbow;
  const lw = pose.leftWrist;
  
  const rs = pose.rightShoulder;
  const re = pose.rightElbow;
  const rw = pose.rightWrist;
  
  const leftValid = ls && le && lw;
  const rightValid = rs && re && rw;
  
  if (!leftValid && !rightValid) return null;
  
  if (leftValid && rightValid) {
    const leftConf = Math.min(ls.inFrameLikelihood ?? 0, le.inFrameLikelihood ?? 0, lw.inFrameLikelihood ?? 0);
    const rightConf = Math.min(rs.inFrameLikelihood ?? 0, re.inFrameLikelihood ?? 0, rw.inFrameLikelihood ?? 0);
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
  
  const leftValid = ls && lh && lk;
  const rightValid = rs && rh && rk;
  
  if (!leftValid && !rightValid) return null;
  
  if (leftValid && rightValid) {
    const leftConf = Math.min(ls.inFrameLikelihood ?? 0, lh.inFrameLikelihood ?? 0, lk.inFrameLikelihood ?? 0);
    const rightConf = Math.min(rs.inFrameLikelihood ?? 0, rh.inFrameLikelihood ?? 0, rk.inFrameLikelihood ?? 0);
    return leftConf >= rightConf ? getAngle(ls!, lh!, lk!) : getAngle(rs!, rh!, rk!);
  }
  
  if (leftValid) return getAngle(ls!, lh!, lk!);
  return getAngle(rs!, rh!, rk!);
}

function isPoseComplete(pose: Pose, exercise: ExerciseType): boolean {
  if (exercise === 'pushup') {
    const angle = getBestArmAngle(pose);
    if (angle === null) return false;
    return angle < 95;
  } else {
    const angle = getBestTorsoAngle(pose);
    if (angle === null) return false;
    return angle < 95;
  }
}

function isPoseReset(pose: Pose, exercise: ExerciseType): boolean {
  if (exercise === 'pushup') {
    const angle = getBestArmAngle(pose);
    if (angle === null) return false;
    return angle > 145;
  } else {
    const angle = getBestTorsoAngle(pose);
    if (angle === null) return false;
    return angle > 145;
  }
}

function getFormWarning(pose: Pose, exercise: ExerciseType): string | null {
  if (exercise === 'pushup') {
    const ls = pose.leftShoulder;
    const lh = pose.leftHip;
    const lk = pose.leftKnee;
    
    const rs = pose.rightShoulder;
    const rh = pose.rightHip;
    const rk = pose.rightKnee;
    
    const leftValid = ls && lh && lk;
    const rightValid = rs && rh && rk;
    
    if (!leftValid && !rightValid) return null;
    
    let backAngle = 180;
    if (leftValid && rightValid) {
      const leftConf = Math.min(ls.inFrameLikelihood ?? 0, lh.inFrameLikelihood ?? 0, lk.inFrameLikelihood ?? 0);
      const rightConf = Math.min(rs.inFrameLikelihood ?? 0, rh.inFrameLikelihood ?? 0, rk.inFrameLikelihood ?? 0);
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
    
    const leftValid = lk && lh && la;
    const rightValid = rk && rh && ra;
    
    if (!leftValid && !rightValid) return null;
    
    let kneeAngle = 90;
    if (leftValid && rightValid) {
      const leftConf = Math.min(lk.inFrameLikelihood ?? 0, lh.inFrameLikelihood ?? 0, la.inFrameLikelihood ?? 0);
      const rightConf = Math.min(rk.inFrameLikelihood ?? 0, rh.inFrameLikelihood ?? 0, ra.inFrameLikelihood ?? 0);
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

function getCurrentAngle(pose: Pose, exercise: ExerciseType): number | null {
  if (exercise === 'pushup') {
    return getBestArmAngle(pose);
  } else {
    return getBestTorsoAngle(pose);
  }
}

export function usePoseDetection(exercise: ExerciseType, onRepComplete: () => void, mirrorX: boolean = true) {
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

        // Mirror overlay poses for UI rendering if mirrorX is true
        let poseToRender = pose;
        if (mirrorX && w > 0) {
          poseToRender = mirrorPose(pose, w);
        }

        // Update overlay poses
        runOnJS(setCurrentPoses)([poseToRender]);

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
  }, [exercise, detectPose, mirrorX]);

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
