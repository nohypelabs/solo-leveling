import React from 'react';
import { View, Text } from 'react-native';

interface XPBarProps {
  current: number;
  max?: number;
  showLabel?: boolean;
}

export function XPBar({ current, max = 100, showLabel = true }: XPBarProps) {
  const progress = Math.min(current / max, 1);

  return (
    <View className="w-full">
      <View className="h-4 rounded-full bg-gray-800 border border-sl-cyan/30 overflow-hidden">
        <View
          className="h-full rounded-full bg-sl-cyan"
          style={{ width: `${progress * 100}%` }}
        />
      </View>
      {showLabel && (
        <Text className="text-sl-text text-xs mt-1 text-center font-bold">
          {current} / {max} XP
        </Text>
      )}
    </View>
  );
}
