import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GlitchText } from './GlitchText';
import { Confetti } from './Confetti';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticQuestComplete } from '@/services/HapticFeedbackService';
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
    hapticQuestComplete();
    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Confetti visible={visible} />
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Animated.View
          style={[
            cardStyle,
            {
              backgroundColor: Colors.card,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 243, 255, 0.5)',
              borderRadius: 12,
              overflow: 'hidden',
              width: '100%',
            },
            Shadows.neonCyanStrong,
          ]}
        >
          <BlurView intensity={30} tint="dark" style={{ padding: 28, gap: 18 }}>
            <GlitchText size={20} animated center>
              QUEST COMPLETE
            </GlitchText>

            {reward && (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: 14,
                  fontFamily: FontFamilies.medium,
                  letterSpacing: 1,
                }}>
                  Reward:
                </Text>
                <GlitchText variant="pink" size={18} animated>
                  {reward.description}
                </GlitchText>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: 12,
                  textAlign: 'center',
                  fontFamily: FontFamilies.light,
                  letterSpacing: 0.5,
                }}>
                  {reward.message}
                </Text>
              </View>
            )}

            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{
                color: Colors.neonCyan,
                fontSize: 16,
                fontWeight: 'bold',
                fontFamily: FontFamilies.bold,
                textShadowColor: Colors.neonCyan,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
                letterSpacing: 2,
              }}>
                +{xpEarned} XP
              </Text>
              {streakBonus > 0 && (
                <Text style={{
                  color: Colors.neonPink,
                  fontSize: 13,
                  fontWeight: 'bold',
                  fontFamily: FontFamilies.semiBold,
                  textShadowColor: Colors.neonPink,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                  letterSpacing: 1,
                }}>
                  Streak Bonus: +{streakBonus} XP
                </Text>
              )}
            </View>

            <Pressable
              onPress={handleClaim}
              style={{ borderRadius: 10, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={['rgba(0, 243, 255, 0.25)', 'rgba(0, 243, 255, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 14,
                  alignItems: 'center',
                  borderWidth: 0.5,
                  borderColor: Colors.neonCyan,
                  borderRadius: 10,
                }}
              >
                <GlitchText size={15}>
                  CLAIM
                </GlitchText>
              </LinearGradient>
            </Pressable>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}
