// src/hooks/usePoseDetection.ts
import { useState, useCallback } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { runPoseDetection, type PoseLandmarkerResult } from 'react-native-esanusi-sensor-pose';
import { useSharedValue, runOnJS } from 'react-native-worklets-core';

export type ExerciseType = 'pushup' | 'situp';

interface Point {
  x: number;
  y: number;
  z?: number;
}

function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

export function usePoseDetection(exercise: ExerciseType, onRepComplete: () => void) {
  const repCount = useSharedValue(0);
  const phase = useSharedValue<'up' | 'down'>('up');
  const [uiRepCount, setUiRepCount] = useState(0);
  const [formWarning, setFormWarning] = useState<string | null>(null);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    try {
      const results = runPoseDetection(frame, {
        performanceMode: 'fast',
        detectorMode: 'stream',
      }) as PoseLandmarkerResult;

      if (results.poses && results.poses.length > 0) {
        const pose = results.poses[0];

        if (exercise === 'pushup') {
          const leftShoulder = pose.landmarks[11];
          const leftElbow = pose.landmarks[13];
          const leftWrist = pose.landmarks[15];

          if (leftShoulder && leftElbow && leftWrist) {
            const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);

            if (phase.value === 'up' && angle < 90) {
              phase.value = 'down';
            } else if (phase.value === 'down' && angle > 150) {
              phase.value = 'up';
              repCount.value += 1;
              runOnJS(setUiRepCount)(repCount.value);
              runOnJS(onRepComplete)();
            }

            if (angle < 70) {
              runOnJS(setFormWarning)('Too low, keep back straight');
            } else if (angle > 160 && phase.value === 'down') {
              runOnJS(setFormWarning)('Not low enough');
            } else {
              runOnJS(setFormWarning)(null);
            }
          }
        } else if (exercise === 'situp') {
          const leftShoulder = pose.landmarks[11];
          const leftHip = pose.landmarks[23];
          const leftKnee = pose.landmarks[25];

          if (leftShoulder && leftHip && leftKnee) {
            const angle = calculateAngle(leftShoulder, leftHip, leftKnee);

            if (phase.value === 'up' && angle < 90) {
              phase.value = 'down';
            } else if (phase.value === 'down' && angle > 150) {
              phase.value = 'up';
              repCount.value += 1;
              runOnJS(setUiRepCount)(repCount.value);
              runOnJS(onRepComplete)();
            }

            if (angle < 70) {
              runOnJS(setFormWarning)('Sit up too far');
            } else {
              runOnJS(setFormWarning)(null);
            }
          }
        }
      } else {
        runOnJS(setFormWarning)('No person detected, adjust camera');
      }
    } catch (e) {
      // Silent fail
    }
  }, [exercise]);

  return {
    frameProcessor,
    repCount: uiRepCount,
    formWarning,
  };
}