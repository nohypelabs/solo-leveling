import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
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

  const chestCooldown = cooldown.isGroupOnCooldown('chest');
  const backCooldown = cooldown.isGroupOnCooldown('back');
  const coreCooldown = cooldown.isGroupOnCooldown('core');

  // AppState listener: reset plank on background
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

  // Clean up interval on unmount
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
          // Plank complete
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPlankRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          mission.setPlankSecondsDone(MISSION_TARGETS.plank);
          // Check mission completion on next tick so store updates first
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
    // Check if this completed the mission
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

  return (
    <ScrollView
      className="flex-1 bg-sl-bg px-4 pt-2"
      contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
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

      {/* Plank Section */}
      <View
        className={`bg-gray-900/50 border rounded-lg p-4 gap-3 ${
          mission.plankSecondsDone >= MISSION_TARGETS.plank
            ? 'border-green-500/50'
            : coreCooldown
              ? 'border-gray-700/30 opacity-50'
              : 'border-sl-cyan/20'
        }`}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-sl-cyan font-bold text-sm tracking-wider">
            SIDE PLANK
          </Text>
          <Text
            className={`text-xs font-bold ${
              mission.plankSecondsDone >= MISSION_TARGETS.plank
                ? 'text-green-400'
                : 'text-sl-text'
            }`}
          >
            {mission.plankSecondsDone}/{MISSION_TARGETS.plank}s
            {mission.plankSecondsDone >= MISSION_TARGETS.plank ? ' ✓' : ''}
          </Text>
        </View>

        <View className="h-2 rounded-full bg-gray-800 overflow-hidden">
          <View
            className={`h-full rounded-full ${
              mission.plankSecondsDone >= MISSION_TARGETS.plank
                ? 'bg-green-500'
                : 'bg-sl-cyan'
            }`}
            style={{
              width: `${Math.min((mission.plankSecondsDone / MISSION_TARGETS.plank) * 100, 100)}%`,
            }}
          />
        </View>

        {plankRunning && (
          <Text className="text-sl-cyan text-4xl font-bold text-center font-mono">
            {remainingSeconds.toFixed(1)}s
          </Text>
        )}

        {!mission.isMissionComplete &&
          mission.plankSecondsDone < MISSION_TARGETS.plank &&
          !coreCooldown && (
            <Pressable
              onPress={plankRunning ? stopPlank : startPlank}
              className={`py-3 rounded-lg items-center border ${
                plankRunning
                  ? 'bg-red-900/30 border-red-500'
                  : 'bg-sl-pink/20 border-sl-pink'
              }`}
            >
              <Text
                className={`font-bold tracking-widest ${
                  plankRunning ? 'text-red-400' : 'text-sl-pink'
                }`}
              >
                {plankRunning ? 'STOP' : 'START PLANK'}
              </Text>
            </Pressable>
          )}

        {coreCooldown &&
          mission.plankSecondsDone < MISSION_TARGETS.plank && (
            <Text className="text-gray-600 text-xs text-center">
              COOLDOWN ACTIVE
            </Text>
          )}
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
