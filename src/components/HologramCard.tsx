import React from 'react';
import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';
import { useGyroscopeHologram } from '@/hooks/useGyroscopeHologram';
import { Colors, Shadows } from '@/constants/theme';

interface HologramCardProps {
  children: React.ReactNode;
  borderColor?: string;
  glowColor?: keyof typeof Shadows;
  blurIntensity?: number;
  padding?: number;
  style?: object;
}

export function HologramCard({
  children,
  borderColor = 'rgba(0, 243, 255, 0.3)',
  glowColor = 'neonCyan',
  blurIntensity = 25,
  padding = 20,
  style,
}: HologramCardProps) {
  const { animatedStyle } = useGyroscopeHologram();

  const shadowConfig = Shadows[glowColor] || Shadows.neonCyan;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          backgroundColor: Colors.card,
          borderWidth: 0.5,
          borderColor,
          borderRadius: 12,
          overflow: 'hidden',
        },
        shadowConfig,
        style,
      ]}
    >
      <BlurView intensity={blurIntensity} tint="dark" style={{ padding }}>
        {children}
      </BlurView>
    </Animated.View>
  );
}
