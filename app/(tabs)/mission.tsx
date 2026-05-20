import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, AppState } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useMissionStore, MISSION_TARGETS } from '@/stores/useMissionStore';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { MissionCard } from '@/components/MissionCard';
import { CooldownTimer } from '@/components/CooldownTimer';
import { RewardModal } from '@/components/RewardModal';
import { GlitchText } from '@/components/GlitchText';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticTap, hapticQuestComplete } from '@/services/HapticFeedbackService';
import { CameraTrainingScreen } from '@/screens/CameraTrainingScreen';

export default function MissionScreen() {
  const mission = useMissionStore();
  const cooldown = useCooldownStore();

  const [showReward, setShowReward] = useState(false);
  const [plankRunning, setPlankRunning] = useState(false);
  const [plankElapsed, setPlankElapsed] = useState(0);
  const [showAITraining, setShowAITraining] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const timerScale = useRef({ value: 1 }).current;
  const cardGlow = useRef({ value: 0 }).current;

  const chestCooldown = cooldown.isGroupOnCooldown('chest');
  const backCooldown = cooldown.isGroupOnCooldown('back');
  const coreCooldown = cooldown.isGroupOnCooldown('core');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (
        appStateRef.current === 'active' &&
        next === 'background' &&
        plankRunning
      ) {
        stopPlank();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [plankRunning]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startPlank() {
    if (coreCooldown || mission.isMissionComplete) return;
    setPlankRunning(true);
    setPlankElapsed(0);

    intervalRef.current = setInterval(() => {
      setPlankElapsed((prev) => {
        const next = prev + 0.1;
        if (next >= MISSION_TARGETS.plank) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPlankRunning(false);
          hapticQuestComplete();
          mission.setPlankSecondsDone(MISSION_TARGETS.plank);
          setTimeout(() => {
            const completed = mission.checkAndCompleteMission();
            if (completed) setShowReward(true);
          }, 50);
          return MISSION_TARGETS.plank;
        }
        return next;
      });
    }, 100);
  }

  function stopPlank() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setPlankRunning(false);
    setPlankElapsed(0);
  }

  const handlePushUp = useCallback(() => {
    mission.incrementPushUp();
    setTimeout(() => {
      const s = useMissionStore.getState();
      if (s.isMissionComplete && !showReward) setShowReward(true);
    }, 50);
  }, []);

  const handlePullUp = useCallback(() => {
    mission.incrementPullUp();
    setTimeout(() => {
      const s = useMissionStore.getState();
      if (s.isMissionComplete && !showReward) setShowReward(true);
    }, 50);
  }, []);

  const handleSitUp = useCallback(() => {
    mission.incrementSitUp();
    setTimeout(() => {
      const s = useMissionStore.getState();
      if (s.isMissionComplete && !showReward) setShowReward(true);
    }, 50);
  }, []);

  const remainingSeconds = Math.max(0, MISSION_TARGETS.plank - plankElapsed);
  const isUrgent = plankRunning && remainingSeconds <= 10 && remainingSeconds > 0;
  const timerColor = isUrgent ? Colors.neonPink : Colors.neonCyan;
  const plankDone = mission.plankSecondsDone >= MISSION_TARGETS.plank;

  // AI Training overlay
  if (showAITraining) {
    return <CameraTrainingScreen onClose={() => setShowAITraining(false)} />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ gap: 12, paddingBottom: 24, paddingHorizontal: 16, paddingTop: 12 }}
    >
      {cooldown.isAnyOnCooldown() && <CooldownTimer />}

      {/* AI Training Banner */}
      <Pressable onPress={() => { hapticTap(); setShowAITraining(true); }}>
        <View style={[{
          backgroundColor: Colors.card,
          borderWidth: 0.5,
          borderColor: 'rgba(255, 0, 204, 0.4)',
          borderRadius: 12,
          overflow: 'hidden',
        }, Shadows.neonPink]}>
          <LinearGradient
            colors={['rgba(255, 0, 204, 0.15)', 'rgba(0, 243, 255, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>🤖</Text>
              <View>
                <Text style={{
                  color: Colors.neonPink,
                  fontSize: 13,
                  fontFamily: FontFamilies.bold,
                  letterSpacing: 2,
                  textShadowColor: Colors.neonPink,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 4,
                }}>
                  AI POSE DETECTION
                </Text>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: 10,
                  fontFamily: FontFamilies.light,
                  letterSpacing: 0.5,
                  marginTop: 2,
                }}>
                  Auto-count reps with camera
                </Text>
              </View>
            </View>
            <Text style={{ color: Colors.neonCyan, fontSize: 18, fontFamily: FontFamilies.bold }}>
              →
            </Text>
          </LinearGradient>
        </View>
      </Pressable>

      <MissionCard
        exerciseName="PUSH-UP"
        done={mission.pushUpDone}
        target={MISSION_TARGETS.pushUp}
        unit="reps"
        onIncrement={handlePushUp}
        disabled={chestCooldown || mission.isMissionComplete}
        isComplete={mission.pushUpDone >= MISSION_TARGETS.pushUp}
      />

      <MissionCard
        exerciseName="PULL-UP"
        done={mission.pullUpDone}
        target={MISSION_TARGETS.pullUp}
        unit="reps"
        onIncrement={handlePullUp}
        disabled={backCooldown || mission.isMissionComplete}
        isComplete={mission.pullUpDone >= MISSION_TARGETS.pullUp}
      />

      <MissionCard
        exerciseName="SIT-UP"
        done={mission.sitUpDone}
        target={MISSION_TARGETS.sitUp}
        unit="reps"
        onIncrement={handleSitUp}
        disabled={coreCooldown || mission.isMissionComplete}
        isComplete={mission.sitUpDone >= MISSION_TARGETS.sitUp}
      />

      {/* Plank Card */}
      <View
        style={{
          backgroundColor: Colors.card,
          borderWidth: 0.5,
          borderRadius: 12,
          overflow: 'hidden',
          borderColor: plankDone
            ? 'rgba(34, 197, 94, 0.5)'
            : coreCooldown
              ? 'rgba(55, 65, 81, 0.3)'
              : 'rgba(0, 243, 255, 0.25)',
          opacity: plankDone ? 1 : coreCooldown ? 0.5 : 1,
        }}
      >
        <BlurView intensity={20} tint="dark" style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <GlitchText size={15} animated>
              SIDE PLANK
            </GlitchText>
            <Text style={{
              fontSize: 13,
              fontWeight: 'bold',
              fontFamily: FontFamilies.semiBold,
              color: plankDone ? Colors.neonGreen : Colors.textPrimary,
              letterSpacing: 1,
            }}>
              {mission.plankSecondsDone}/{MISSION_TARGETS.plank}s
              {plankDone ? ' ✓' : ''}
            </Text>
          </View>

          <View style={{ height: 8, borderRadius: 9999, backgroundColor: Colors.barTrack, overflow: 'hidden' }}>
            <View style={{
              height: '100%',
              borderRadius: 9999,
              overflow: 'hidden',
              width: `${Math.min((mission.plankSecondsDone / MISSION_TARGETS.plank) * 100, 100)}%`,
            }}>
              <LinearGradient
                colors={plankDone ? [Colors.neonGreenDark, Colors.neonGreen] : [Colors.neonCyan, Colors.neonPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </View>
          </View>

          {plankRunning && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontSize: 40,
                fontWeight: 'bold',
                fontFamily: FontFamilies.bold,
                textAlign: 'center',
                color: timerColor,
                textShadowColor: timerColor,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 12,
                letterSpacing: 4,
              }}>
                {remainingSeconds.toFixed(1)}s
              </Text>
            </View>
          )}

          {!mission.isMissionComplete &&
            mission.plankSecondsDone < MISSION_TARGETS.plank &&
            !coreCooldown && (
              <Pressable
                onPress={plankRunning ? stopPlank : startPlank}
                style={{ borderRadius: 10, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={
                    plankRunning
                      ? ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']
                      : ['rgba(0, 243, 255, 0.25)', 'rgba(0, 243, 255, 0.1)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: 14,
                    alignItems: 'center',
                    borderWidth: 0.5,
                    borderColor: plankRunning ? '#ef4444' : Colors.neonCyan,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{
                    fontWeight: 'bold',
                    fontFamily: FontFamilies.bold,
                    letterSpacing: 4,
                    color: plankRunning ? '#f87171' : Colors.neonCyan,
                    textShadowColor: plankRunning ? 'transparent' : Colors.neonCyan,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 6,
                  }}>
                    {plankRunning ? 'STOP' : 'START PLANK'}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}

          {coreCooldown && mission.plankSecondsDone < MISSION_TARGETS.plank && (
            <Text style={{
              color: Colors.textMuted,
              fontSize: 11,
              textAlign: 'center',
              fontFamily: FontFamilies.medium,
              letterSpacing: 2,
            }}>
              COOLDOWN ACTIVE
            </Text>
          )}
        </BlurView>
      </View>

      <RewardModal
        visible={showReward && mission.isMissionComplete}
        reward={mission.lastReward}
        xpEarned={
          mission.pushUpDone * 2 +
          mission.pullUpDone * 4 +
          mission.sitUpDone * 1 +
          Math.floor(mission.plankSecondsDone / 10)
        }
        streakBonus={0}
        onDismiss={() => setShowReward(false)}
      />
    </ScrollView>
  );
}
