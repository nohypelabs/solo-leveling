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
  hex: string;
}[] = [
  { key: 'strength', label: 'STRENGTH', icon: '⚔️', color: 'bg-red-500', hex: '#ef4444' },
  { key: 'endurance', label: 'ENDURANCE', icon: '🛡️', color: 'bg-blue-500', hex: '#3b82f6' },
  { key: 'recovery', label: 'RECOVERY', icon: '💚', color: 'bg-green-500', hex: '#22c55e' },
  { key: 'flexibility', label: 'FLEXIBILITY', icon: '🌀', color: 'bg-purple-500', hex: '#a855f7' },
];

export default function ProfileScreen() {
  const profile = useProfileStore();
  const mission = useMissionStore();

  function handleAllocate(stat: StatName) {
    if (profile.unallocatedPoints <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    profile.allocatePoint(stat);
  }

  const canAllocate = profile.unallocatedPoints > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', paddingHorizontal: 16, paddingTop: 8, gap: 16 }}>
      <View
        style={{
          backgroundColor: '#0a0a0a',
          borderWidth: 1,
          borderColor: 'rgba(0, 243, 255, 0.3)',
          borderRadius: 8,
          padding: 16,
          gap: 12,
        }}
      >
        <GlitchText className="text-center text-sm tracking-widest">
          BUILDER PROFILE
        </GlitchText>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <GlitchText className="text-2xl">Lv. {profile.level}</GlitchText>
          <XPBar current={profile.currentXP} />
          <Text style={{ color: '#6b7280', fontSize: 12 }}>
            Total XP: {profile.totalXP}
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: '#e0e0e0', fontSize: 14 }}>🔥 Streak</Text>
          <GlitchText variant="pink" className="text-lg">
            {mission.streakDays} days
          </GlitchText>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#0a0a0a',
          borderWidth: 1,
          borderColor: 'rgba(0, 243, 255, 0.3)',
          borderRadius: 8,
          padding: 16,
          gap: 8,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <GlitchText variant="pink" className="text-sm tracking-widest">
            STATUS POINTS
          </GlitchText>
          <Text
            style={{ fontSize: 14, fontWeight: 'bold', color: canAllocate ? '#00f3ff' : '#6b7280' }}
          >
            Unallocated: {profile.unallocatedPoints}
          </Text>
        </View>

        {STAT_CONFIG.map((stat) => (
          <View
            key={stat.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#1f2937',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
              <Text style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 'bold' }}>
                {stat.label}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 96, height: 8, borderRadius: 9999, backgroundColor: '#1f2937', overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    borderRadius: 9999,
                    backgroundColor: stat.hex,
                    width: `${Math.min((profile[stat.key] / 50) * 100, 100)}%`,
                  }}
                />
              </View>
              <Text style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 'bold', width: 32, textAlign: 'right' }}>
                {profile[stat.key]}
              </Text>
              <Pressable
                onPress={() => handleAllocate(stat.key)}
                disabled={!canAllocate}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  backgroundColor: canAllocate ? 'rgba(0, 243, 255, 0.2)' : '#111827',
                  borderColor: canAllocate ? '#00f3ff' : '#374151',
                }}
              >
                <Text
                  style={{ fontWeight: 'bold', color: canAllocate ? '#00f3ff' : '#374151' }}
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
