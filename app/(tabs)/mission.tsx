import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useMissionStore, MISSION_TARGETS } from '@/stores/useMissionStore';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { MissionCard } from '@/components/MissionCard';
import { CooldownTimer } from '@/components/CooldownTimer';
import { RewardModal } from '@/components/RewardModal';

export default function MissionScreen() {
  const mission = useMissionStore();
  const cooldown = useCooldownStore();

  const [showReward, setShowReward] = useState(false);
  const [plankRunning, setPlankRunning] = useState(false);
  const [plankElapsed, setPlankElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const timerScale = useSharedValue(1);
  const cardGlow = useSharedValue(0);

  const chestCooldown = cooldown.isGroupOnCooldown('chest');
  const backCooldown = cooldown.isGroupOnCooldown('back');
  const coreCooldown = cooldown.isGroupOnCooldown('core');

  useEffect(() => {
    if (plankRunning) {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 }),
        ),
        -1,
        false,
      );
      cardGlow.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(0.1, { duration: 1000 }),
        ),
        -1,
        false,
      );
    } else {
      timerScale.value = withTiming(1);
      cardGlow.value = withTiming(0);
    }
  }, [plankRunning]);

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
  }));

  const cardGlowStyle = useAnimatedStyle(() => ({
    shadowColor: '#00f3ff',
    shadowOpacity: cardGlow.value,
    shadowRadius: 10,
  }));

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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const remainingSeconds = Math.max(
    0,
    MISSION_TARGETS.plank - plankElapsed,
  );

  const isUrgent = plankRunning && remainingSeconds <= 10 && remainingSeconds > 0;
  const timerColor = isUrgent ? '#ff00cc' : '#00f3ff';

  const plankDone = mission.plankSecondsDone >= MISSION_TARGETS.plank;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      contentContainerStyle={{ gap: 12, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 8 }}
    >
      {cooldown.isAnyOnCooldown() && <CooldownTimer />}

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

      {/* Plank */}
      <Animated.View
        style={[
          {
            backgroundColor: 'rgba(17, 24, 39, 0.5)',
            borderWidth: 1,
            borderRadius: 8,
            padding: 16,
            gap: 12,
            borderColor: plankDone
              ? 'rgba(34, 197, 94, 0.5)'
              : coreCooldown
                ? 'rgba(55, 65, 81, 0.3)'
                : 'rgba(0, 243, 255, 0.2)',
            opacity: plankDone ? 1 : coreCooldown ? 0.5 : 1,
          },
          coreCooldown && !mission.isMissionComplete ? {} : cardGlowStyle,
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#00f3ff', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 }}>
            SIDE PLANK
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: plankDone ? '#4ade80' : '#e0e0e0',
            }}
          >
            {mission.plankSecondsDone}/{MISSION_TARGETS.plank}s
            {plankDone ? ' ✓' : ''}
          </Text>
        </View>

        <View style={{ height: 8, borderRadius: 9999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              borderRadius: 9999,
              backgroundColor: plankDone ? '#22c55e' : '#00f3ff',
              width: `${Math.min((mission.plankSecondsDone / MISSION_TARGETS.plank) * 100, 100)}%`,
            }}
          />
        </View>

        {plankRunning && (
          <Animated.View style={[timerStyle, { alignItems: 'center' }]}>
            <Text
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textAlign: 'center',
                color: timerColor,
              }}
            >
              {remainingSeconds.toFixed(1)}s
            </Text>
          </Animated.View>
        )}

        {!mission.isMissionComplete &&
          mission.plankSecondsDone < MISSION_TARGETS.plank &&
          !coreCooldown && (
            <Pressable
              onPress={plankRunning ? stopPlank : startPlank}
              style={{
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
                borderWidth: 1,
                backgroundColor: plankRunning
                  ? 'rgba(127, 29, 29, 0.3)'
                  : 'rgba(255, 0, 204, 0.2)',
                borderColor: plankRunning ? '#ef4444' : '#ff00cc',
                shadowColor: plankRunning ? undefined : '#ff00cc',
                shadowOpacity: plankRunning ? undefined : 0.3,
                shadowRadius: plankRunning ? undefined : 6,
              }}
            >
              <Text
                style={{
                  fontWeight: 'bold',
                  letterSpacing: 4,
                  color: plankRunning ? '#f87171' : '#ff00cc',
                }}
              >
                {plankRunning ? 'STOP' : 'START PLANK'}
              </Text>
            </Pressable>
          )}

        {coreCooldown &&
          mission.plankSecondsDone < MISSION_TARGETS.plank && (
            <Text style={{ color: '#4b5563', fontSize: 12, textAlign: 'center' }}>
              COOLDOWN ACTIVE
            </Text>
          )}
      </Animated.View>

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
