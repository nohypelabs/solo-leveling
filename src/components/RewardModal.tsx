import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlitchText } from './GlitchText';
import { Confetti } from './Confetti';
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
  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      cardScale.value = withSpring(1, { damping: 10, stiffness: 150 });
      cardOpacity.value = withSpring(1, { damping: 12 });
    } else {
      cardScale.value = 0.8;
      cardOpacity.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  function handleClaim() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Confetti visible={visible} />
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          style={[
            cardStyle,
            {
              shadowColor: '#00f3ff',
              shadowOpacity: 0.4,
              shadowRadius: 16,
              backgroundColor: '#0a0a0a',
              borderWidth: 1,
              borderColor: 'rgba(0, 243, 255, 0.5)',
              borderRadius: 8,
              padding: 24,
              width: '100%',
              gap: 16,
            },
          ]}
        >
          <GlitchText
            className="text-center text-xl tracking-widest"
            animated
          >
            QUEST COMPLETE
          </GlitchText>

          {reward && (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Text style={{ color: '#e0e0e0', fontSize: 14 }}>Reward:</Text>
              <GlitchText variant="pink" className="text-lg" animated>
                {reward.description}
              </GlitchText>
              <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
                {reward.message}
              </Text>
            </View>
          )}

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ color: '#00f3ff', fontSize: 14, fontWeight: 'bold' }}>
              +{xpEarned} XP
            </Text>
            {streakBonus > 0 && (
              <Text style={{ color: '#ff00cc', fontSize: 12, fontWeight: 'bold' }}>
                Streak Bonus: +{streakBonus} XP
              </Text>
            )}
          </View>

          <Pressable
            onPress={handleClaim}
            style={{
              backgroundColor: 'rgba(0, 243, 255, 0.2)',
              borderWidth: 1,
              borderColor: '#00f3ff',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              shadowColor: '#00f3ff',
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <GlitchText className="text-base tracking-widest">
              CLAIM
            </GlitchText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
