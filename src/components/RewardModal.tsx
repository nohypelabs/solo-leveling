import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlitchText } from './GlitchText';
import type { Reward } from '@/utils/rewards';

interface RewardModalProps {
  visible: boolean;
  reward: Reward | null;
  xpEarned: number;
  streakBonus: number;
  onDismiss: () => void;
}

export function RewardModal({
  visible,
  reward,
  xpEarned,
  streakBonus,
  onDismiss,
}: RewardModalProps) {
  function handleClaim() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="bg-sl-bg border border-sl-cyan/50 rounded-lg p-6 w-full gap-4">
          <GlitchText className="text-center text-xl tracking-widest">
            QUEST COMPLETE
          </GlitchText>

          {reward && (
            <View className="items-center gap-2">
              <Text className="text-sl-text text-sm">Reward:</Text>
              <GlitchText variant="pink" className="text-lg">
                {reward.description}
              </GlitchText>
              <Text className="text-gray-400 text-xs text-center">
                {reward.message}
              </Text>
            </View>
          )}

          <View className="items-center gap-1">
            <Text className="text-sl-cyan text-sm font-bold">
              +{xpEarned} XP
            </Text>
            {streakBonus > 0 && (
              <Text className="text-sl-pink text-xs font-bold">
                Streak Bonus: +{streakBonus} XP
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleClaim}
            className="bg-sl-cyan/20 border border-sl-cyan rounded-lg py-3 items-center active:bg-sl-cyan/40"
          >
            <GlitchText className="text-base tracking-widest">CLAIM</GlitchText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
