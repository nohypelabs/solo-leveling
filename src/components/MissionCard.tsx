import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { GlitchText } from './GlitchText';
import { Colors, FontFamilies, Shadows, Borders } from '@/constants/theme';
import { hapticTap } from '@/services/HapticFeedbackService';

interface MissionCardProps {
  exerciseName: string;
  done: number;
  target: number;
  unit: string;
  onIncrement: () => void;
  disabled: boolean;
  isComplete: boolean;
}

export function MissionCard({
  exerciseName,
  done,
  target,
  unit,
  onIncrement,
  disabled,
  isComplete,
}: MissionCardProps) {
  const progress = Math.min(done / target, 1);
  const fillWidth = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const checkScale = useSharedValue(0);
  const cooldownPulse = useSharedValue(1);

  React.useEffect(() => {
    fillWidth.value = withTiming(progress, { duration: 400 });
  }, [progress]);

  React.useEffect(() => {
    if (isComplete) {
      checkScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    }
  }, [isComplete]);

  React.useEffect(() => {
    if (disabled && !isComplete) {
      cooldownPulse.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        false,
      );
    } else {
      cooldownPulse.value = withTiming(1);
    }
  }, [disabled && !isComplete]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillWidth.value * 100}%`,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const cooldownStyle = useAnimatedStyle(() => ({
    opacity: cooldownPulse.value,
  }));

  function handlePress() {
    if (disabled || isComplete) return;
    buttonScale.value = withSpring(0.9, { damping: 10 }, () => {
      buttonScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hapticTap();
    onIncrement();
  }

  const borderColor = isComplete
    ? 'rgba(34, 197, 94, 0.5)'
    : disabled
      ? 'rgba(55, 65, 81, 0.3)'
      : 'rgba(0, 243, 255, 0.25)';

  const glowStyle = isComplete
    ? Shadows.neonGreen
    : disabled
      ? {}
      : Shadows.neonCyan;

  return (
    <View
      style={[{
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor,
        borderRadius: 12,
        overflow: 'hidden',
      }, glowStyle]}
    >
      <BlurView
        intensity={20}
        tint="dark"
        style={{ padding: 16 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <GlitchText size={15} animated>
            {exerciseName}
          </GlitchText>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 'bold',
              fontFamily: FontFamilies.semiBold,
              color: isComplete ? Colors.neonGreen : Colors.textPrimary,
              letterSpacing: 1,
            }}
          >
            {done}/{target} {unit}
            {isComplete ? ' ✓' : ''}
          </Text>
        </View>

        <View style={{ height: 8, borderRadius: 9999, backgroundColor: Colors.barTrack, overflow: 'hidden', marginBottom: 14 }}>
          <Animated.View style={[fillStyle, { height: '100%', borderRadius: 9999, overflow: 'hidden' }]}>
            <LinearGradient
              colors={isComplete ? [Colors.neonGreenDark, Colors.neonGreen] : [Colors.neonCyan, Colors.neonPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

        <View style={{ alignItems: 'center' }}>
          {isComplete ? (
            <Animated.View
              style={[checkAnimatedStyle, {
                width: 56,
                height: 56,
                borderRadius: 9999,
                backgroundColor: 'rgba(20, 83, 45, 0.3)',
                borderWidth: 0.5,
                borderColor: 'rgba(34, 197, 94, 0.5)',
                alignItems: 'center',
                justifyContent: 'center',
              }]}
            >
              <Text style={{ color: Colors.neonGreen, fontSize: 22, fontFamily: FontFamilies.bold }}>✓</Text>
            </Animated.View>
          ) : (
            <Pressable
              onPress={handlePress}
              disabled={disabled}
            >
              <Animated.View
                style={[buttonAnimatedStyle, {
                  width: 56,
                  height: 56,
                  borderRadius: 9999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 0.5,
                  borderColor: disabled ? Colors.borderDark : Colors.neonPink,
                }, disabled ? {} : Shadows.neonPink]}
              >
                <LinearGradient
                  colors={disabled ? [Colors.disabledBg, Colors.disabledBg] : ['rgba(255, 0, 204, 0.3)', 'rgba(255, 0, 204, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' }}
                >
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      fontFamily: FontFamilies.bold,
                      color: disabled ? '#4b5563' : Colors.neonPink,
                      textShadowColor: disabled ? 'transparent' : Colors.neonPink,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    }}
                  >
                    +1
                  </Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          )}
        </View>

        {disabled && !isComplete && (
          <Animated.Text
            style={[cooldownStyle, {
              color: Colors.textMuted,
              fontSize: 11,
              textAlign: 'center',
              marginTop: 8,
              fontFamily: FontFamilies.medium,
              letterSpacing: 2,
            }]}
          >
            COOLDOWN ACTIVE
          </Animated.Text>
        )}
      </BlurView>
    </View>
  );
}
