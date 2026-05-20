import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';

interface XPBarProps {
  current: number;
  max?: number;
  showLabel?: boolean;
}

export function XPBar({ current, max = 100, showLabel = true }: XPBarProps) {
  const progress = Math.min(current / max, 1);
  const width = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, {
      duration: 500,
      easing: Easing.inOut(Easing.quad),
    });
  }, [progress]);

  useEffect(() => {
    if (progress >= 0.9) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.2, { duration: 800 }),
        ),
        -1,
        false,
      );
    } else {
      glowOpacity.value = withTiming(0);
    }
  }, [progress >= 0.9]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(0, 243, 255, ${0.3 + glowOpacity.value * 0.5})`,
    shadowColor: '#00f3ff',
    shadowOpacity: glowOpacity.value,
    shadowRadius: 8,
  }));

  return (
    <View style={{ width: '100%' }}>
      <Animated.View
        style={[borderStyle, {
          height: 18,
          borderRadius: 9999,
          backgroundColor: Colors.barTrack,
          overflow: 'hidden',
          borderWidth: 1,
        }]}
      >
        <Animated.View
          style={[fillStyle, { height: '100%', borderRadius: 9999, overflow: 'hidden' }]}
        >
          <LinearGradient
            colors={[Colors.neonCyan, Colors.neonPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </Animated.View>
      {showLabel && (
        <Text style={{
          color: Colors.textPrimary,
          fontSize: 12,
          marginTop: 4,
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: FontFamilies.semiBold,
          letterSpacing: 1,
        }}>
          {current} / {max} XP
        </Text>
      )}
    </View>
  );
}
