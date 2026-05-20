import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import { PoseOverlay } from 'react-native-esanusi-sensor-pose';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { usePoseDetection, type ExerciseType } from '@/hooks/usePoseDetection';
import { useMissionStore, MISSION_TARGETS } from '@/stores/useMissionStore';
import { GlitchText } from '@/components/GlitchText';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticTap, hapticQuestComplete } from '@/services/HapticFeedbackService';

const EXERCISES: { key: ExerciseType; label: string; icon: string; target: number; unit: string }[] = [
  { key: 'pushup', label: 'PUSH-UP', icon: '💪', target: MISSION_TARGETS.pushUp, unit: 'reps' },
  { key: 'situp', label: 'SIT-UP', icon: '🎯', target: MISSION_TARGETS.sitUp, unit: 'reps' },
];

export function CameraTrainingScreen({ onClose }: { onClose: () => void }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'front');
  const { width: viewWidth, height: viewHeight } = useWindowDimensions();

  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushup');
  const [isTraining, setIsTraining] = useState(false);
  const [completed, setCompleted] = useState(false);

  const mission = useMissionStore();

  const handleRepComplete = useCallback(() => {}, [selectedExercise]);

  const { frameProcessor, repCount, formWarning, reset, debug, currentPoses, frameSize } = usePoseDetection(
    selectedExercise,
    handleRepComplete,
  );

  // Track completion when repCount changes
  useEffect(() => {
    if (completed) return;
    const exercise = EXERCISES.find((e) => e.key === selectedExercise)!;
    if (repCount >= exercise.target) {
      setCompleted(true);
      hapticQuestComplete();

      if (selectedExercise === 'pushup') {
        for (let i = 0; i < exercise.target; i++) {
          useMissionStore.getState().incrementPushUp();
        }
      } else if (selectedExercise === 'situp') {
        for (let i = 0; i < exercise.target; i++) {
          useMissionStore.getState().incrementSitUp();
        }
      }
    }
  }, [repCount, selectedExercise, completed]);

  function handleStartTraining() {
    hapticTap();
    reset();
    setCompleted(false);
    setIsTraining(true);
  }

  function handleStopTraining() {
    setIsTraining(false);
  }

  function handleReset() {
    reset();
    setCompleted(false);
    setIsTraining(false);
  }

  function handleSelectExercise(key: ExerciseType) {
    hapticTap();
    reset();
    setCompleted(false);
    setSelectedExercise(key);
  }

  if (!hasPermission) {
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
              Camera access is required for AI-powered exercise tracking.
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

  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <ActivityIndicator color={Colors.neonCyan} size="large" />
        <GlitchText size={14} center>LOADING CAMERA...</GlitchText>
      </View>
    );
  }

  const currentExercise = EXERCISES.find((e) => e.key === selectedExercise)!;
  const progress = Math.min(repCount / currentExercise.target, 1);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, position: 'relative' }}>
        <Camera
          style={{ flex: 1 }}
          device={device}
          isActive={true}
          frameProcessor={isTraining ? frameProcessor : undefined}
        />

        {/* Skeleton overlay */}
        {isTraining && currentPoses.length > 0 && frameSize.width > 0 && (
          <PoseOverlay
            poses={currentPoses}
            frameWidth={frameSize.width}
            frameHeight={frameSize.height}
            viewWidth={viewWidth}
            viewHeight={viewHeight}
            dotColor={Colors.neonCyan}
            boneColor={Colors.neonCyan}
            dotSize={8}
            boneWidth={3}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}

        {/* Debug overlay */}
        {isTraining && (
          <View style={{
            position: 'absolute',
            top: 60,
            left: 10,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: Colors.neonPink,
          }}>
            <Text style={{ color: '#ff0', fontSize: 10, fontFamily: FontFamilies.medium }}>
              Frames: {debug.frameCount}{'\n'}
              Detects: {debug.detectCount}{'\n'}
              Poses: {debug.poseCount}{'\n'}
              Angle: {debug.lastAngle !== null ? debug.lastAngle.toFixed(1) : '—'}{'\n'}
              Phase: {debug.phase}
            </Text>
          </View>
        )}

        {/* Status indicator */}
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
                AI TRACKING ACTIVE
              </Text>
            </View>
          </View>
        )}

        {/* Form warning */}
        {formWarning && isTraining && (
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
                {formWarning}
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
                    onPress={() => handleSelectExercise(ex.key)}
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
                    {repCount}/{currentExercise.target} {completed ? '✓' : ''}
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
                        DONE
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}
