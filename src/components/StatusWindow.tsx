import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useProfileStore } from '@/stores/useProfileStore';
import { useMissionStore, MISSION_TARGETS } from '@/stores/useMissionStore';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { XPBar } from './XPBar';
import { GlitchText } from './GlitchText';

const STATS = [
  { key: 'strength' as const, label: 'STR', icon: '⚔️' },
  { key: 'endurance' as const, label: 'END', icon: '🛡️' },
  { key: 'recovery' as const, label: 'REC', icon: '💚' },
  { key: 'flexibility' as const, label: 'FLX', icon: '🌀' },
] as const;

export function StatusWindow() {
  const profile = useProfileStore();
  const mission = useMissionStore();
  const cooldown = useCooldownStore();

  const prevLevel = useRef(profile.level);
  const [triggerGlitch, setTriggerGlitch] = React.useState(false);

  const flashOpacity = useSharedValue(0);
  const levelScale = useSharedValue(1);

  useEffect(() => {
    if (profile.level > prevLevel.current) {
      prevLevel.current = profile.level;

      flashOpacity.value = withSequence(
        withTiming(0.5, { duration: 100 }),
        withTiming(0, { duration: 400 }),
      );

      levelScale.value = withSequence(
        withSpring(1.4, { damping: 6 }),
        withSpring(1, { damping: 8 }),
      );

      setTriggerGlitch(true);
      const timeout = setTimeout(() => setTriggerGlitch(false), 1000);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      return () => clearTimeout(timeout);
    }
  }, [profile.level]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));

  const missions = [
    {
      name: 'PUSH-UP',
      done: mission.pushUpDone,
      target: MISSION_TARGETS.pushUp,
      blocked: cooldown.isGroupOnCooldown('chest'),
    },
    {
      name: 'PULL-UP',
      done: mission.pullUpDone,
      target: MISSION_TARGETS.pullUp,
      blocked: cooldown.isGroupOnCooldown('back'),
    },
    {
      name: 'SIT-UP',
      done: mission.sitUpDone,
      target: MISSION_TARGETS.sitUp,
      blocked: cooldown.isGroupOnCooldown('core'),
    },
    {
      name: 'SIDE PLANK',
      done: mission.plankSecondsDone,
      target: MISSION_TARGETS.plank,
      blocked: cooldown.isGroupOnCooldown('core'),
    },
  ];

  return (
    <View style={{ position: 'relative' }}>
      {/* Flash overlay */}
      <Animated.View
        style={[flashStyle, {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 10,
          borderRadius: 8,
          pointerEvents: 'none',
        }]}
      />

      <View
        style={{
          backgroundColor: '#0a0a0a',
          borderWidth: 1,
          borderColor: 'rgba(0, 243, 255, 0.3)',
          borderRadius: 8,
          padding: 16,
          gap: 12,
          shadowColor: '#00f3ff',
          shadowOpacity: 0.15,
          shadowRadius: 12,
        }}
      >
        <GlitchText
          className="text-center text-sm tracking-widest"
          animated
          triggerGlitch={triggerGlitch}
        >
          SYSTEM WINDOW
        </GlitchText>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View style={[levelStyle]}>
            <GlitchText className="text-3xl" triggerGlitch={triggerGlitch}>
              Lv. {profile.level}
            </GlitchText>
          </Animated.View>
          <XPBar current={profile.currentXP} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
          {STATS.map((stat) => (
            <View
              key={stat.key}
              style={{
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                borderWidth: 1,
                borderColor: 'rgba(0, 243, 255, 0.2)',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                width: '48%',
                shadowColor: '#00f3ff',
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
              <Text style={{ color: '#e0e0e0', fontSize: 12, fontWeight: 'bold' }}>{stat.label}</Text>
              <GlitchText className="text-xl" animated>
                {profile[stat.key]}
              </GlitchText>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 8, gap: 4 }}>
          <GlitchText variant="pink" className="text-xs tracking-widest">
            TODAY&apos;S MISSIONS
          </GlitchText>
          {missions.map((m) => {
            const isComplete = m.done >= m.target;
            const color = isComplete
              ? '#4ade80'
              : m.blocked
                ? '#4b5563'
                : '#e0e0e0';
            return (
              <View key={m.name} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color }}>{m.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color }}>
                  {m.done}/{m.target}
                  {m.name === 'SIDE PLANK' ? 's' : ''}
                  {isComplete ? ' ✓' : m.blocked ? ' ⏳' : ''}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0, 243, 255, 0.2)' }}>
          <Text style={{ color: '#e0e0e0', fontSize: 12 }}>🔥 Streak</Text>
          <GlitchText className="text-sm" animated>
            {mission.streakDays} days
          </GlitchText>
        </View>
      </View>
    </View>
  );
}
