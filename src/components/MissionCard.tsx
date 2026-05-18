import React from 'react';
import { View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
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

  function handlePress() {
    if (disabled || isComplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onIncrement();
  }

  return (
    <View
      className={`bg-gray-900/50 border rounded-lg p-3 ${
        isComplete
          ? 'border-green-500/50'
          : disabled
            ? 'border-gray-700/30 opacity-50'
            : 'border-sl-cyan/20'
      }`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <GlitchText className="text-sm tracking-wider">
          {exerciseName}
        </GlitchText>
        <Text
          className={`text-xs font-bold ${
            isComplete ? 'text-green-400' : 'text-sl-text'
          }`}
        >
          {done}/{target} {unit}
          {isComplete ? ' ✓' : ''}
        </Text>
      </View>

      <View className="h-2 rounded-full bg-gray-800 overflow-hidden mb-3">
        <View
          className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-sl-cyan'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="items-center">
        {isComplete ? (
          <View className="w-14 h-14 rounded-full bg-green-900/30 border border-green-500/50 items-center justify-center">
            <Text className="text-green-400 text-xl">✓</Text>
          </View>
        ) : (
          <Pressable
            onPress={handlePress}
            disabled={disabled}
            className={`w-14 h-14 rounded-full items-center justify-center ${
              disabled
                ? 'bg-gray-800 border border-gray-700/30'
                : 'bg-sl-pink/20 border border-sl-pink active:bg-sl-pink/40'
            }`}
          >
            <Text
              className={`text-2xl font-bold ${disabled ? 'text-gray-600' : 'text-sl-pink'}`}
            >
              +1
            </Text>
          </Pressable>
        )}
      </View>

      {disabled && !isComplete && (
        <Text className="text-gray-600 text-xs text-center mt-2">
          COOLDOWN ACTIVE
        </Text>
      )}
    </View>
  );
}
