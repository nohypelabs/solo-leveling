import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { formatCooldown, getRemainingCooldown } from '@/utils/cooldownLogic';
import { GlitchText } from './GlitchText';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';

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
    <View style={[{
      backgroundColor: Colors.card,
      borderWidth: 0.5,
      borderColor: 'rgba(255, 0, 204, 0.3)',
      borderRadius: 12,
      overflow: 'hidden',
    }, Shadows.neonPink]}>
      <BlurView intensity={20} tint="dark" style={{ padding: 16, gap: 8 }}>
        <GlitchText variant="pink" size={12} center>
          COOLDOWN ACTIVE
        </GlitchText>

        {GROUPS.map((group) => {
          const remaining = cooldown.getRemainingForGroup(group.key);
          if (remaining <= 0) return null;
          return (
            <View key={group.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: Colors.textPrimary, fontSize: 12, fontFamily: FontFamilies.medium }}>
                {group.emoji} {group.label}
              </Text>
              <Text style={{
                color: Colors.neonPink,
                fontWeight: 'bold',
                fontSize: 14,
                fontFamily: FontFamilies.semiBold,
                textShadowColor: Colors.neonPink,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 4,
              }}>
                {formatCooldown(remaining)}
              </Text>
            </View>
          );
        })}

        <Text style={{
          color: Colors.textMuted,
          fontSize: 11,
          textAlign: 'center',
          marginTop: 4,
          fontFamily: FontFamilies.light,
          letterSpacing: 1,
        }}>
          Missions locked until cooldown expires
        </Text>
      </BlurView>
    </View>
  );
}
