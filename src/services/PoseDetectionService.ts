// @ts-expect-error - MediaPipe loaded dynamically at runtime
let poseLandmarker: any = null;
let lastTimestamp = -1;

export type ExerciseType = 'pushup' | 'situp' | 'squat';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseState {
  repCount: number;
  phase: 'up' | 'down' | 'idle';
  formWarning: string | null;
  confidence: number;
}

/**
 * Initialize MediaPipe PoseLandmarker via dynamic import.
 * Uses require() to avoid Metro bundler issues with ESM.
 */
export async function initPoseDetection(): Promise<boolean> {
  try {
    const visionModule = require('@mediapipe/tasks-vision');
    const FilesetResolver = visionModule.FilesetResolver;
    const PoseLandmarker = visionModule.PoseLandmarker;

    if (!FilesetResolver || !PoseLandmarker) {
      console.warn('MediaPipe modules not available');
      return false;
    }

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
    });

    return true;
  } catch (err) {
    console.warn('PoseDetection init failed:', err);
    return false;
  }
}

/**
 * Run pose detection on a video frame.
 * Returns the raw MediaPipe result.
 */
export function detectPose(videoElement: HTMLVideoElement | HTMLCanvasElement, timestampMs: number): PoseLandmarkerResult | null {
  if (!poseLandmarker) return null;
  if (timestampMs === lastTimestamp) return null;
  lastTimestamp = timestampMs;
  return poseLandmarker.detectForVideo(videoElement, timestampMs);
}

/**
 * Analyze push-up from pose landmarks.
 * Detects reps by tracking shoulder-elbow vertical angle.
 * Returns updated PoseState.
 */
export function analyzePushUp(
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
  prevState: PoseState,
): PoseState {
  if (!landmarks || landmarks.length < 25) {
    return { ...prevState, formWarning: 'Body not fully visible' };
  }

  // Key landmarks (MediaPipe Pose 33 points)
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Average shoulder Y (normalized 0-1, lower = lower position)
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const wristY = (leftWrist.y + rightWrist.y) / 2;

  // Shoulder-hip vertical distance (body angle check)
  const bodyAngle = Math.abs(shoulderY - hipY);

  // Check form: body should be roughly straight
  let formWarning: string | null = null;
  if (bodyAngle < 0.08) {
    formWarning = 'Hips too high — keep body straight';
  }

  // Wrist should be below shoulders when down
  const isDown = wristY > shoulderY + 0.12;
  const isUp = wristY < shoulderY - 0.02;

  let { repCount, phase } = prevState;

  // State machine for rep counting
  if (phase === 'up' && isDown) {
    phase = 'down';
  } else if (phase === 'down' && isUp) {
    phase = 'up';
    repCount++;
  } else if (phase === 'idle' && isUp) {
    phase = 'up';
  }

  return {
    repCount,
    phase,
    formWarning,
    confidence: Math.min(leftShoulder.visibility + rightShoulder.visibility, 1),
  };
}

/**
 * Analyze sit-up from pose landmarks.
 * Detects reps by tracking shoulder-to-hip angle.
 */
export function analyzeSitUp(
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
  prevState: PoseState,
): PoseState {
  if (!landmarks || landmarks.length < 25) {
    return { ...prevState, formWarning: 'Body not fully visible' };
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const kneeY = (leftKnee.y + rightKnee.y) / 2;

  // Sit-up: shoulders come close to hips when "up" (crunched)
  const shoulderHipDist = Math.abs(shoulderY - hipY);

  // Crunched = shoulders close to hips (small vertical distance)
  const isUp = shoulderHipDist < 0.12;
  // Flat = shoulders far from hips (large vertical distance)
  const isDown = shoulderHipDist > 0.22;

  let formWarning: string | null = null;
  // Check knees are bent (knees should be between hips and feet in Y)
  if (kneeY < hipY + 0.05) {
    formWarning = 'Bend your knees more';
  }

  let { repCount, phase } = prevState;

  if (phase === 'down' && isUp) {
    phase = 'up';
    repCount++;
  } else if (phase === 'up' && isDown) {
    phase = 'down';
  } else if (phase === 'idle' && isDown) {
    phase = 'down';
  }

  return {
    repCount,
    phase,
    formWarning,
    confidence: Math.min(leftShoulder.visibility + rightHip.visibility, 1),
  };
}

/**
 * Analyze squat from pose landmarks.
 * Detects reps by tracking hip-to-knee vertical angle.
 */
export function analyzeSquat(
  landmarks: Array<{ x: number; y: number; z: number; visibility: number }>,
  prevState: PoseState,
): PoseState {
  if (!landmarks || landmarks.length < 25) {
    return { ...prevState, formWarning: 'Body not fully visible' };
  }

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  const hipY = (leftHip.y + rightHip.y) / 2;
  const kneeY = (leftKnee.y + rightKnee.y) / 2;
  const ankleY = (leftAnkle.y + rightAnkle.y) / 2;

  // Squat down: hips drop close to knees
  const hipKneeDist = Math.abs(hipY - kneeY);
  const isDown = hipKneeDist < 0.08;
  const isUp = hipKneeDist > 0.18;

  let formWarning: string | null = null;
  if (kneeY > ankleY - 0.03) {
    formWarning = 'Knees going past toes — sit back more';
  }

  let { repCount, phase } = prevState;

  if (phase === 'up' && isDown) {
    phase = 'down';
  } else if (phase === 'down' && isUp) {
    phase = 'up';
    repCount++;
  } else if (phase === 'idle' && isUp) {
    phase = 'up';
  }

  return {
    repCount,
    phase,
    formWarning,
    confidence: Math.min(leftHip.visibility + rightHip.visibility, 1),
  };
}

/**
 * Get the correct analyzer for an exercise type.
 */
export function getAnalyzer(exercise: ExerciseType) {
  switch (exercise) {
    case 'pushup': return analyzePushUp;
    case 'situp': return analyzeSitUp;
    case 'squat': return analyzeSquat;
  }
}

export function resetPoseState(): PoseState {
  return { repCount: 0, phase: 'idle', formWarning: null, confidence: 0 };
}

export function disposePoseDetection() {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
}
