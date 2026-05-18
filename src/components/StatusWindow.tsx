import React from 'react';
import { View, Text } from 'react-native';
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
    <View className="bg-sl-bg border border-sl-cyan/30 rounded-lg p-4 gap-3">
      <GlitchText className="text-center text-sm tracking-widest">
        SYSTEM WINDOW
      </GlitchText>

      <View className="items-center gap-1">
        <GlitchText className="text-3xl">Lv. {profile.level}</GlitchText>
        <XPBar current={profile.currentXP} />
      </View>

      <View className="flex-row flex-wrap justify-between gap-2 mt-2">
        {STATS.map((stat) => (
          <View
            key={stat.key}
            className="bg-gray-900/50 border border-sl-cyan/20 rounded-lg p-3 items-center w-[48%]"
          >
            <Text className="text-lg">{stat.icon}</Text>
            <Text className="text-sl-text text-xs font-bold">{stat.label}</Text>
            <GlitchText className="text-xl">{profile[stat.key]}</GlitchText>
          </View>
        ))}
      </View>

      <View className="mt-2 gap-1">
        <GlitchText variant="pink" className="text-xs tracking-widest mb-1">
          TODAY&apos;S MISSIONS
        </GlitchText>
        {missions.map((m) => {
          const isComplete = m.done >= m.target;
          const color = isComplete
            ? 'text-green-400'
            : m.blocked
              ? 'text-gray-600'
              : 'text-sl-text';
          return (
            <View key={m.name} className="flex-row justify-between">
              <Text className={`text-xs ${color}`}>{m.name}</Text>
              <Text className={`text-xs font-bold ${color}`}>
                {m.done}/{m.target}
                {m.name === 'SIDE PLANK' ? 's' : ''}
                {isComplete ? ' ✓' : m.blocked ? ' ⏳' : ''}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-sl-cyan/20">
        <Text className="text-sl-text text-xs">🔥 Streak</Text>
        <GlitchText className="text-sm">{mission.streakDays} days</GlitchText>
      </View>
    </View>
  );
}
