import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { formatCooldown, getRemainingCooldown } from '@/utils/cooldownLogic';
import { GlitchText } from './GlitchText';

const GROUPS = [
  { key: 'chest' as const, label: 'Chest', emoji: '💪' },
  { key: 'back' as const, label: 'Back', emoji: '🔙' },
  { key: 'core' as const, label: 'Core', emoji: '🎯' },
] as const;

export function CooldownTimer() {
  const cooldown = useCooldownStore();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      cooldown.checkAndResetExpired();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!cooldown.isAnyOnCooldown()) return null;

  return (
    <View className="bg-sl-bg border border-sl-pink/30 rounded-lg p-4 gap-2">
      <GlitchText variant="pink" className="text-center text-sm tracking-widest">
        COOLDOWN ACTIVE
      </GlitchText>

      {GROUPS.map((group) => {
        const remaining = cooldown.getRemainingForGroup(group.key);
        if (remaining <= 0) return null;
        return (
          <View key={group.key} className="flex-row justify-between items-center">
            <Text className="text-sl-text text-xs">
              {group.emoji} {group.label}
            </Text>
            <Text className="text-sl-pink font-bold text-sm font-mono">
              {formatCooldown(remaining)}
            </Text>
          </View>
        );
      })}

      <Text className="text-gray-500 text-xs text-center mt-1">
        Missions locked until cooldown expires
      </Text>
    </View>
  );
}
