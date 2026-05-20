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
    <View
      style={{
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: 'rgba(255, 0, 204, 0.3)',
        borderRadius: 8,
        padding: 16,
        gap: 8,
      }}
    >
      <GlitchText variant="pink" className="text-center text-sm tracking-widest">
        COOLDOWN ACTIVE
      </GlitchText>

      {GROUPS.map((group) => {
        const remaining = cooldown.getRemainingForGroup(group.key);
        if (remaining <= 0) return null;
        return (
          <View key={group.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#e0e0e0', fontSize: 12 }}>
              {group.emoji} {group.label}
            </Text>
            <Text style={{ color: '#ff00cc', fontWeight: 'bold', fontSize: 14, fontFamily: 'monospace' }}>
              {formatCooldown(remaining)}
            </Text>
          </View>
        );
      })}

      <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        Missions locked until cooldown expires
      </Text>
    </View>
  );
}
