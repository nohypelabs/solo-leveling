import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';

interface GlitchTextProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'pink';
  size?: number;
  weight?: keyof typeof FontFamilies;
  className?: string;
  animated?: boolean;
  triggerGlitch?: boolean;
  center?: boolean;
}

export function GlitchText({
  children,
  variant = 'cyan',
  size = 14,
  weight = 'bold',
  className = '',
  animated = false,
  triggerGlitch = false,
  center = false,
}: GlitchTextProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const skewX = useSharedValue(0);
  const [intenseGlitch, setIntenseGlitch] = React.useState(false);

  useEffect(() => {
    if (!animated) return;

    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 4;
      translateX.value = withSequence(
        withTiming(jitter, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      opacity.value = withSequence(
        withTiming(0.7, { duration: 30 }),
        withTiming(1, { duration: 100 }),
      );
      if (Math.random() > 0.7) {
        skewX.value = withSequence(
          withTiming(3, { duration: 40 }),
          withTiming(-2, { duration: 40 }),
          withTiming(0, { duration: 40 }),
        );
      }
    }, 2500 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, [animated]);

  useEffect(() => {
    if (!triggerGlitch) return;

    setIntenseGlitch(true);
    let count = 0;
    const interval = setInterval(() => {
      const jitter = (Math.random() - 0.5) * 12;
      translateX.value = withTiming(jitter, { duration: 30 });
      opacity.value = withSequence(
        withTiming(0.5, { duration: 20 }),
        withTiming(1, { duration: 60 }),
      );
      skewX.value = withSequence(
        withTiming((Math.random() - 0.5) * 15, { duration: 30 }),
        withTiming((Math.random() - 0.5) * 10, { duration: 30 }),
      );
      count++;
      if (count > 12) {
        clearInterval(interval);
        translateX.value = withTiming(0, { duration: 100 });
        skewX.value = withTiming(0, { duration: 100 });
        opacity.value = withTiming(1, { duration: 100 });
        setIntenseGlitch(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [triggerGlitch]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { skewX: `${skewX.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const color = variant === 'cyan' ? Colors.neonCyan : Colors.neonPink;
  const glowColor = variant === 'cyan' ? Colors.neonCyan : Colors.neonPink;

  return (
    <Animated.Text
      className={`font-bold ${variant === 'cyan' ? 'text-sl-cyan' : 'text-sl-pink'} ${className}`}
      style={[
        animatedStyle,
        {
          fontFamily: FontFamilies[weight],
          fontSize: size,
          color,
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: intenseGlitch ? 16 : 6,
          letterSpacing: 2,
          textAlign: center ? 'center' : 'auto',
        },
      ]}
    >
      {children}
    </Animated.Text>
  );
}
