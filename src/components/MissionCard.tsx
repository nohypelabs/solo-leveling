import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { GlitchText } from './GlitchText';

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
    onIncrement();
  }

  const borderColor = isComplete
    ? 'rgba(34, 197, 94, 0.5)'
    : disabled
      ? 'rgba(55, 65, 81, 0.3)'
      : 'rgba(0, 243, 255, 0.2)';

  const glowStyle = isComplete
    ? { shadowColor: '#22c55e', shadowOpacity: 0.3, shadowRadius: 8 }
    : disabled
      ? {}
      : { shadowColor: '#00f3ff', shadowOpacity: 0.2, shadowRadius: 6 };

  return (
    <View
      style={[{
        backgroundColor: 'rgba(17, 24, 39, 0.5)',
        borderWidth: 1,
        borderColor,
        borderRadius: 8,
        padding: 12,
      }, glowStyle]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <GlitchText className="text-sm tracking-wider" animated>
          {exerciseName}
        </GlitchText>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: isComplete ? '#4ade80' : '#e0e0e0',
          }}
        >
          {done}/{target} {unit}
          {isComplete ? ' ✓' : ''}
        </Text>
      </View>

      <View style={{ height: 8, borderRadius: 9999, backgroundColor: '#1f2937', overflow: 'hidden', marginBottom: 12 }}>
        <Animated.View
          style={[fillStyle, {
            height: '100%',
            borderRadius: 9999,
            backgroundColor: isComplete ? '#22c55e' : '#00f3ff',
          }]}
        />
      </View>

      <View style={{ alignItems: 'center' }}>
        {isComplete ? (
          <Animated.View
            style={[checkAnimatedStyle, {
              width: 56,
              height: 56,
              borderRadius: 9999,
              backgroundColor: 'rgba(20, 83, 45, 0.3)',
              borderWidth: 1,
              borderColor: 'rgba(34, 197, 94, 0.5)',
              alignItems: 'center',
              justifyContent: 'center',
            }]}
          >
            <Text style={{ color: '#4ade80', fontSize: 20 }}>✓</Text>
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
                borderWidth: 1,
                backgroundColor: disabled
                  ? '#1f2937'
                  : 'rgba(255, 0, 204, 0.2)',
                borderColor: disabled
                  ? 'rgba(55, 65, 81, 0.3)'
                  : '#ff00cc',
              }]}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: disabled ? '#4b5563' : '#ff00cc',
                }}
              >
                +1
              </Text>
            </Animated.View>
          </Pressable>
        )}
      </View>

      {disabled && !isComplete && (
        <Animated.Text
          style={[cooldownStyle, { color: '#4b5563', fontSize: 12, textAlign: 'center', marginTop: 8 }]}
        >
          COOLDOWN ACTIVE
        </Animated.Text>
      )}
    </View>
  );
}
