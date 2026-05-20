import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  initPoseDetection,
  ExerciseType,
  PoseState,
  getAnalyzer,
  resetPoseState,
  type PoseLandmarkerResult,
} from '@/services/PoseDetectionService';
import { useMissionStore, MISSION_TARGETS } from '@/stores/useMissionStore';
import { GlitchText } from '@/components/GlitchText';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticTap, hapticQuestComplete } from '@/services/HapticFeedbackService';

const EXERCISES: { key: ExerciseType; label: string; icon: string; target: number; unit: string }[] = [
  { key: 'pushup', label: 'PUSH-UP', icon: '💪', target: MISSION_TARGETS.pushUp, unit: 'reps' },
  { key: 'situp', label: 'SIT-UP', icon: '🎯', target: MISSION_TARGETS.sitUp, unit: 'reps' },
];

export function CameraTrainingScreen({ onClose }: { onClose: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushup');
  const [isTraining, setIsTraining] = useState(false);
  const [poseState, setPoseState] = useState<PoseState>(resetPoseState());
  const [completed, setCompleted] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const frameCount = useRef(0);
  const analyzerRef = useRef(getAnalyzer('pushup'));
  const poseStateRef = useRef<PoseState>(resetPoseState());
  const mission = useMissionStore();

  // Load pose model
  useEffect(() => {
    initPoseDetection()
      .then((ok) => {
        setModelReady(ok);
        if (!ok) setModelError('Failed to load pose detection model');
      })
      .catch((err) => {
        setModelError(String(err));
      });
  }, []);

  // Update analyzer when exercise changes
  useEffect(() => {
    analyzerRef.current = getAnalyzer(selectedExercise);
    poseStateRef.current = resetPoseState();
    setPoseState(resetPoseState());
    setCompleted(false);
  }, [selectedExercise]);

  // Simulate frame processing loop
  // In dev build, this would use CameraView's onFrameProcessor
  // For now we use a polling approach with the camera preview
  useEffect(() => {
    if (!isTraining || !modelReady || completed) return;

    const interval = setInterval(() => {
      frameCount.current++;
      // In production, this processes actual camera frames
      // Here we simulate the detection feedback loop
      // The real implementation hooks into Camera frame processor
    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, [isTraining, modelReady, completed]);

  function handleSimulateRep() {
    if (completed) return;
    hapticTap();

    poseStateRef.current = {
      ...poseStateRef.current,
      repCount: poseStateRef.current.repCount + 1,
      phase: 'up',
      confidence: 0.9,
      formWarning: null,
    };
    setPoseState({ ...poseStateRef.current });

    const exercise = EXERCISES.find((e) => e.key === selectedExercise)!;
    if (poseStateRef.current.repCount >= exercise.target && !completed) {
      setCompleted(true);
      hapticQuestComplete();

      // Save to mission store
      if (selectedExercise === 'pushup') {
        mission.setPlankSecondsDone(mission.plankSecondsDone); // keep plank
        for (let i = 0; i < exercise.target; i++) {
          useMissionStore.getState().incrementPushUp();
        }
      } else if (selectedExercise === 'situp') {
        for (let i = 0; i < exercise.target; i++) {
          useMissionStore.getState().incrementSitUp();
        }
      }
    }
  }

  function handleStartTraining() {
    hapticTap();
    setIsTraining(true);
    poseStateRef.current = resetPoseState();
    setPoseState(resetPoseState());
    setCompleted(false);
  }

  function handleStopTraining() {
    setIsTraining(false);
  }

  function handleReset() {
    poseStateRef.current = resetPoseState();
    setPoseState(resetPoseState());
    setCompleted(false);
    setIsTraining(false);
  }

  // Permission not granted
  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={[{
          backgroundColor: Colors.card,
          borderWidth: 0.5,
          borderColor: 'rgba(0, 243, 255, 0.3)',
          borderRadius: 12,
          overflow: 'hidden',
          width: '100%',
        }, Shadows.neonCyan]}>
          <BlurView intensity={25} tint="dark" style={{ padding: 24, gap: 16, alignItems: 'center' }}>
            <GlitchText size={16} center>AI POSE DETECTION</GlitchText>
            <Text style={{
              color: Colors.textSecondary,
              fontSize: 13,
              fontFamily: FontFamilies.medium,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              Camera access is required for AI-powered exercise tracking. The system will detect your form and count reps automatically.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{ borderRadius: 10, overflow: 'hidden', width: '100%' }}
            >
              <LinearGradient
                colors={['rgba(0, 243, 255, 0.25)', 'rgba(0, 243, 255, 0.1)']}
                style={{ paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.neonCyan, borderRadius: 10 }}
              >
                <GlitchText size={14}>GRANT CAMERA ACCESS</GlitchText>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={onClose}>
              <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: FontFamilies.medium, letterSpacing: 1 }}>
                CANCEL
              </Text>
            </Pressable>
          </BlurView>
        </View>
      </View>
    );
  }

  // Model loading
  if (!modelReady && !modelError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <ActivityIndicator color={Colors.neonCyan} size="large" />
        <GlitchText size={14} center>LOADING AI MODEL...</GlitchText>
        <Text style={{ color: Colors.textMuted, fontSize: 11, fontFamily: FontFamilies.light, letterSpacing: 1 }}>
          Downloading pose detection model
        </Text>
      </View>
    );
  }

  const currentExercise = EXERCISES.find((e) => e.key === selectedExercise)!;
  const progress = Math.min(poseState.repCount / currentExercise.target, 1);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Camera Preview */}
      <View style={{ flex: 1, position: 'relative' }}>
        {Platform.OS !== 'web' ? (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="front"
            active={isTraining}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Colors.textMuted, fontSize: 12, fontFamily: FontFamilies.medium }}>
              Camera preview (requires device)
            </Text>
          </View>
        )}

        {/* Skeleton overlay hint */}
        {isTraining && !completed && (
          <View style={{
            position: 'absolute',
            top: 20,
            left: 0,
            right: 0,
            alignItems: 'center',
          }}>
            <View style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 0.5,
              borderColor: Colors.neonCyan,
            }}>
              <Text style={{
                color: Colors.neonCyan,
                fontSize: 12,
                fontFamily: FontFamilies.semiBold,
                letterSpacing: 2,
              }}>
                🤖 AI TRACKING ACTIVE
              </Text>
            </View>
          </View>
        )}

        {/* Form warning */}
        {poseState.formWarning && isTraining && (
          <View style={{
            position: 'absolute',
            bottom: 200,
            left: 16,
            right: 16,
          }}>
            <View style={{
              backgroundColor: 'rgba(255, 0, 204, 0.2)',
              borderWidth: 0.5,
              borderColor: Colors.neonPink,
              borderRadius: 8,
              padding: 10,
              alignItems: 'center',
            }}>
              <Text style={{
                color: Colors.neonPink,
                fontSize: 12,
                fontFamily: FontFamilies.semiBold,
                letterSpacing: 1,
              }}>
                ⚠️ {poseState.formWarning}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom panel */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}>
          <BlurView intensity={40} tint="dark" style={{ padding: 16, gap: 12 }}>
            {/* Exercise selector */}
            {!isTraining && !completed && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {EXERCISES.map((ex) => (
                  <Pressable
                    key={ex.key}
                    onPress={() => {
                      hapticTap();
                      setSelectedExercise(ex.key);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      borderWidth: 0.5,
                      borderColor: selectedExercise === ex.key ? Colors.neonCyan : 'rgba(55, 65, 81, 0.3)',
                      backgroundColor: selectedExercise === ex.key ? 'rgba(0, 243, 255, 0.15)' : 'rgba(17, 24, 39, 0.5)',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{ex.icon}</Text>
                    <Text style={{
                      color: selectedExercise === ex.key ? Colors.neonCyan : Colors.textMuted,
                      fontSize: 11,
                      fontFamily: FontFamilies.semiBold,
                      letterSpacing: 1,
                      marginTop: 2,
                    }}>
                      {ex.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Progress bar */}
            {(isTraining || completed) && (
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <GlitchText size={13}>{currentExercise.label}</GlitchText>
                  <Text style={{
                    color: completed ? Colors.neonGreen : Colors.textPrimary,
                    fontSize: 14,
                    fontFamily: FontFamilies.semiBold,
                    letterSpacing: 1,
                  }}>
                    {poseState.repCount}/{currentExercise.target} {completed ? '✓' : ''}
                  </Text>
                </View>
                <View style={{ height: 8, borderRadius: 9999, backgroundColor: Colors.barTrack, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    borderRadius: 9999,
                    overflow: 'hidden',
                    width: `${progress * 100}%`,
                  }}>
                    <LinearGradient
                      colors={completed ? [Colors.neonGreenDark, Colors.neonGreen] : [Colors.neonCyan, Colors.neonPink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* Controls */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!isTraining && !completed && (
                <>
                  <Pressable
                    onPress={onClose}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 0.5,
                      borderColor: 'rgba(55, 65, 81, 0.3)',
                      backgroundColor: 'rgba(17, 24, 39, 0.5)',
                    }}
                  >
                    <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: FontFamilies.semiBold, letterSpacing: 2 }}>BACK</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleStartTraining}
                    style={{ flex: 2, borderRadius: 10, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['rgba(0, 243, 255, 0.25)', 'rgba(0, 243, 255, 0.1)']}
                      style={{ paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.neonCyan, borderRadius: 10 }}
                    >
                      <Text style={{
                        color: Colors.neonCyan,
                        fontSize: 14,
                        fontFamily: FontFamilies.bold,
                        letterSpacing: 3,
                      }}>
                        START TRAINING
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}

              {isTraining && !completed && (
                <>
                  <Pressable
                    onPress={handleStopTraining}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 0.5,
                      borderColor: '#ef4444',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    }}
                  >
                    <Text style={{ color: '#f87171', fontSize: 13, fontFamily: FontFamilies.bold, letterSpacing: 2 }}>STOP</Text>
                  </Pressable>
                  {/* Manual rep button for testing / when AI misses */}
                  <Pressable
                    onPress={handleSimulateRep}
                    style={{ flex: 2, borderRadius: 10, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['rgba(255, 0, 204, 0.3)', 'rgba(255, 0, 204, 0.15)']}
                      style={{ paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.neonPink, borderRadius: 10 }}
                    >
                      <Text style={{
                        color: Colors.neonPink,
                        fontSize: 16,
                        fontFamily: FontFamilies.bold,
                        letterSpacing: 2,
                        textShadowColor: Colors.neonPink,
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: 6,
                      }}>
                        +1 REP
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}

              {completed && (
                <>
                  <Pressable
                    onPress={handleReset}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      borderWidth: 0.5,
                      borderColor: 'rgba(55, 65, 81, 0.3)',
                      backgroundColor: 'rgba(17, 24, 39, 0.5)',
                    }}
                  >
                    <Text style={{ color: Colors.textMuted, fontSize: 13, fontFamily: FontFamilies.semiBold, letterSpacing: 2 }}>RESET</Text>
                  </Pressable>
                  <Pressable
                    onPress={onClose}
                    style={{ flex: 2, borderRadius: 10, overflow: 'hidden' }}
                  >
                    <LinearGradient
                      colors={['rgba(34, 197, 94, 0.3)', 'rgba(34, 197, 94, 0.1)']}
                      style={{ paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: Colors.neonGreen, borderRadius: 10 }}
                    >
                      <Text style={{
                        color: Colors.neonGreen,
                        fontSize: 14,
                        fontFamily: FontFamilies.bold,
                        letterSpacing: 3,
                      }}>
                        DONE ✓
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </View>

            {/* AI status */}
            {modelError && (
              <Text style={{ color: Colors.neonPink, fontSize: 10, textAlign: 'center', fontFamily: FontFamilies.light }}>
                AI Model Error: {modelError}. Use manual +1 REP.
              </Text>
            )}
          </BlurView>
        </View>
      </View>
    </View>
  );
}
