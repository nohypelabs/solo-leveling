import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useProfileStore } from '@/stores/useProfileStore';
import { useMissionStore, MISSION_TARGETS } from '@/stores/useMissionStore';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { useGyroscopeHologram } from '@/hooks/useGyroscopeHologram';
import { XPBar } from './XPBar';
import { GlitchText } from './GlitchText';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticLevelUp } from '@/services/HapticFeedbackService';

const STATS = [
  { key: 'strength' as const, label: 'STR', icon: '⚔️' },
  { key: 'endurance' as const, label: 'END', icon: '🛡️' },
  { key: 'recovery' as const, label: 'REC', icon: '💚' },
  { key: 'flexibility' as const, label: 'FLX', icon: '🌀' },
] as const;

export function StatusWindow() {
  const profile = useProfileStore();
  const mission = useMissionStore();
  const cooldown = useCooldownStore();

  const prevLevel = useRef(profile.level);
  const [triggerGlitch, setTriggerGlitch] = React.useState(false);

  const { animatedStyle: hologramStyle } = useGyroscopeHologram();

  const flashOpacity = useSharedValue(0);
  const levelScale = useSharedValue(1);

  useEffect(() => {
    if (profile.level > prevLevel.current) {
      prevLevel.current = profile.level;

      flashOpacity.value = withSequence(
        withTiming(0.5, { duration: 100 }),
        withTiming(0, { duration: 400 }),
      );

      levelScale.value = withSequence(
        withSpring(1.4, { damping: 6 }),
        withSpring(1, { damping: 8 }),
      );

      setTriggerGlitch(true);
      const timeout = setTimeout(() => setTriggerGlitch(false), 1000);

      hapticLevelUp();

      return () => clearTimeout(timeout);
    }
  }, [profile.level]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const levelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: levelScale.value }],
  }));

  const missions = [
    {
      name: 'PUSH-UP',
      done: mission.pushUpDone,
      target: MISSION_TARGETS.pushUp,
      blocked: cooldown.isGroupOnCooldown('chest'),
    },
    {
      name: 'PULL-UP',
      done: mission.pullUpDone,
      target: MISSION_TARGETS.pullUp,
      blocked: cooldown.isGroupOnCooldown('back'),
    },
    {
      name: 'SIT-UP',
      done: mission.sitUpDone,
      target: MISSION_TARGETS.sitUp,
      blocked: cooldown.isGroupOnCooldown('core'),
    },
    {
      name: 'SIDE PLANK',
      done: mission.plankSecondsDone,
      target: MISSION_TARGETS.plank,
      blocked: cooldown.isGroupOnCooldown('core'),
    },
  ];

  return (
    <View style={{ position: 'relative' }}>
      {/* Flash overlay */}
      <Animated.View
        style={[flashStyle, {
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#ffffff',
          zIndex: 10,
          borderRadius: 12,
          pointerEvents: 'none',
        }]}
      />

      {/* Hologram Card with gyroscope 3D */}
      <Animated.View
        style={[
          hologramStyle,
          {
            backgroundColor: Colors.card,
            borderWidth: 0.5,
            borderColor: 'rgba(0, 243, 255, 0.3)',
            borderRadius: 12,
            overflow: 'hidden',
          },
          Shadows.neonCyanStrong,
        ]}
      >
        <BlurView intensity={25} tint="dark" style={{ padding: 20, gap: 14 }}>
          <GlitchText
            size={13}
            animated
            triggerGlitch={triggerGlitch}
            center
          >
            SYSTEM WINDOW
          </GlitchText>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <Animated.View style={[levelStyle]}>
              <GlitchText variant="pink" size={36} triggerGlitch={triggerGlitch}>
                Lv. {profile.level}
              </GlitchText>
            </Animated.View>
            <XPBar current={profile.currentXP} />
          </View>

          {/* Stats Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
            {STATS.map((stat) => (
              <View
                key={stat.key}
                style={[{
                  backgroundColor: 'rgba(0, 243, 255, 0.05)',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0, 243, 255, 0.2)',
                  borderRadius: 10,
                  padding: 12,
                  alignItems: 'center',
                  width: '48%',
                }, Shadows.neonCyan]}
              >
                <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
                <Text style={{
                  color: Colors.textSecondary,
                  fontSize: 10,
                  fontFamily: FontFamilies.medium,
                  letterSpacing: 2,
                  marginTop: 2,
                }}>
                  {stat.label}
                </Text>
                <GlitchText size={22} animated>
                  {profile[stat.key]}
                </GlitchText>
              </View>
            ))}
          </View>

          {/* Today's Missions */}
          <View style={{ marginTop: 8, gap: 6 }}>
            <GlitchText variant="pink" size={11}>
              TODAY&apos;S MISSIONS
            </GlitchText>
            {missions.map((m) => {
              const isComplete = m.done >= m.target;
              const color = isComplete
                ? Colors.neonGreen
                : m.blocked
                  ? Colors.textMuted
                  : Colors.textPrimary;
              return (
                <View key={m.name} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 3,
                  borderBottomWidth: 0.5,
                  borderBottomColor: 'rgba(0, 243, 255, 0.08)',
                }}>
                  <Text style={{
                    fontSize: 12,
                    color,
                    fontFamily: FontFamilies.medium,
                    letterSpacing: 1,
                  }}>
                    {m.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color,
                    fontFamily: FontFamilies.semiBold,
                    letterSpacing: 1,
                  }}>
                    {m.done}/{m.target}
                    {m.name === 'SIDE PLANK' ? 's' : ''}
                    {isComplete ? ' ✓' : m.blocked ? ' ⏳' : ''}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Streak Box */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            paddingTop: 10,
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0, 243, 255, 0.15)',
          }}>
            <Text style={{ color: Colors.textPrimary, fontSize: 13, fontFamily: FontFamilies.medium }}>
              🔥 Streak
            </Text>
            <GlitchText size={16} animated>
              {mission.streakDays} days
            </GlitchText>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}
