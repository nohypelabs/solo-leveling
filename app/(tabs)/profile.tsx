import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useProfileStore, type StatName } from '@/stores/useProfileStore';
import { useMissionStore } from '@/stores/useMissionStore';
import { XPBar } from '@/components/XPBar';
import { GlitchText } from '@/components/GlitchText';

const STAT_CONFIG: {
  key: StatName;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: 'strength', label: 'STRENGTH', icon: '⚔️', color: 'bg-red-500' },
  { key: 'endurance', label: 'ENDURANCE', icon: '🛡️', color: 'bg-blue-500' },
  { key: 'recovery', label: 'RECOVERY', icon: '💚', color: 'bg-green-500' },
  { key: 'flexibility', label: 'FLEXIBILITY', icon: '🌀', color: 'bg-purple-500' },
];

export default function ProfileScreen() {
  const profile = useProfileStore();
  const mission = useMissionStore();

  function handleAllocate(stat: StatName) {
    if (profile.unallocatedPoints <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    profile.allocatePoint(stat);
  }

  return (
    <View className="flex-1 bg-sl-bg px-4 pt-2 gap-4">
      <View className="bg-sl-bg border border-sl-cyan/30 rounded-lg p-4 gap-3">
        <GlitchText className="text-center text-sm tracking-widest">
          BUILDER PROFILE
        </GlitchText>

        <View className="items-center gap-1">
          <GlitchText className="text-2xl">Lv. {profile.level}</GlitchText>
          <XPBar current={profile.currentXP} />
          <Text className="text-gray-500 text-xs">
            Total XP: {profile.totalXP}
          </Text>
        </View>

        <View className="items-center mt-2">
          <Text className="text-sl-text text-sm">🔥 Streak</Text>
          <GlitchText variant="pink" className="text-lg">
            {mission.streakDays} days
          </GlitchText>
        </View>
      </View>

      <View className="bg-sl-bg border border-sl-cyan/30 rounded-lg p-4 gap-2">
        <View className="flex-row justify-between items-center mb-2">
          <GlitchText variant="pink" className="text-sm tracking-widest">
            STATUS POINTS
          </GlitchText>
          <Text
            className={`text-sm font-bold ${
              profile.unallocatedPoints > 0
                ? 'text-sl-cyan'
                : 'text-gray-500'
            }`}
          >
            Unallocated: {profile.unallocatedPoints}
          </Text>
        </View>

        {STAT_CONFIG.map((stat) => (
          <View
            key={stat.key}
            className="flex-row items-center justify-between py-2 border-b border-gray-800"
          >
            <View className="flex-row items-center gap-2 flex-1">
              <Text className="text-lg">{stat.icon}</Text>
              <Text className="text-sl-text text-sm font-bold">
                {stat.label}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-24 h-2 rounded-full bg-gray-800 overflow-hidden">
                <View
                  className={`h-full rounded-full ${stat.color}`}
                  style={{
                    width: `${Math.min((profile[stat.key] / 50) * 100, 100)}%`,
                  }}
                />
              </View>
              <Text className="text-sl-text text-sm font-bold w-8 text-right">
                {profile[stat.key]}
              </Text>
              <Pressable
                onPress={() => handleAllocate(stat.key)}
                disabled={profile.unallocatedPoints <= 0}
                className={`w-8 h-8 rounded-full items-center justify-center border ${
                  profile.unallocatedPoints > 0
                    ? 'bg-sl-cyan/20 border-sl-cyan active:bg-sl-cyan/40'
                    : 'bg-gray-900 border-gray-700'
                }`}
              >
                <Text
                  className={`font-bold ${
                    profile.unallocatedPoints > 0
                      ? 'text-sl-cyan'
                      : 'text-gray-700'
                  }`}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
