import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StatusWindow } from '@/components/StatusWindow';
import { CooldownTimer } from '@/components/CooldownTimer';
import { GlitchText } from '@/components/GlitchText';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { LOCATION_MISSIONS, getAllProgress, startMission, type LocationMissionProgress } from '@/services/LocationMissionService';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticTap } from '@/services/HapticFeedbackService';

export default function HomeScreen() {
  const isCooldown = useCooldownStore((s) => s.isAnyOnCooldown);
  const profile = useProfileStore();
  const [locationProgress, setLocationProgress] = useState<Record<string, LocationMissionProgress>>({});

  useEffect(() => {
    setLocationProgress(getAllProgress());
  }, []);

  function handleStartBonusMission(id: string) {
    hapticTap();
    startMission(id);
    setLocationProgress(getAllProgress());
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ gap: 12, paddingBottom: 24, paddingHorizontal: 16, paddingTop: 12 }}
    >
      <StatusBar style="light" />
      <StatusWindow />
      {isCooldown() && <CooldownTimer />}

      {/* Bonus Location Missions */}
      <View style={[{
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        borderRadius: 12,
        overflow: 'hidden',
      }, Shadows.neonCyan]}>
        <BlurView intensity={25} tint="dark" style={{ padding: 16, gap: 12 }}>
          <GlitchText variant="pink" size={12}>
            BONUS RAIDS
          </GlitchText>
          <Text style={{
            color: Colors.textMuted,
            fontSize: 10,
            fontFamily: FontFamilies.light,
            letterSpacing: 0.5,
          }}>
            Location-based bonus missions. Move to earn extra XP!
          </Text>

          {LOCATION_MISSIONS.map((mission) => {
            const progress = locationProgress[mission.id];
            const isCompleted = progress?.completed;
            const isActive = progress && !progress.completed;
            const distancePct = progress
              ? Math.min((progress.distanceTraveled / mission.targetDistance) * 100, 100)
              : 0;

            return (
              <View
                key={mission.id}
                style={{
                  backgroundColor: 'rgba(0, 243, 255, 0.03)',
                  borderWidth: 0.5,
                  borderColor: isCompleted
                    ? 'rgba(34, 197, 94, 0.3)'
                    : isActive
                      ? 'rgba(0, 243, 255, 0.2)'
                      : 'rgba(55, 65, 81, 0.2)',
                  borderRadius: 8,
                  padding: 12,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{
                      color: isCompleted ? Colors.neonGreen : Colors.textPrimary,
                      fontSize: 12,
                      fontFamily: FontFamilies.semiBold,
                      letterSpacing: 1,
                    }}>
                      {mission.title}
                    </Text>
                    <Text style={{
                      color: Colors.textMuted,
                      fontSize: 10,
                      fontFamily: FontFamilies.light,
                      marginTop: 2,
                    }}>
                      {mission.description}
                    </Text>
                  </View>
                  <Text style={{
                    color: Colors.neonCyan,
                    fontSize: 12,
                    fontFamily: FontFamilies.bold,
                    letterSpacing: 1,
                    textShadowColor: Colors.neonCyan,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 4,
                  }}>
                    +{mission.xpReward} XP
                  </Text>
                </View>

                {(isActive || isCompleted) && (
                  <View style={{ height: 6, borderRadius: 9999, backgroundColor: Colors.barTrack, overflow: 'hidden' }}>
                    <View style={{
                      height: '100%',
                      borderRadius: 9999,
                      overflow: 'hidden',
                      width: `${distancePct}%`,
                    }}>
                      <LinearGradient
                        colors={isCompleted ? [Colors.neonGreenDark, Colors.neonGreen] : [Colors.neonCyan, Colors.neonPink]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}

                {!isActive && !isCompleted && (
                  <Pressable
                    onPress={() => handleStartBonusMission(mission.id)}
                    style={{
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      backgroundColor: 'rgba(0, 243, 255, 0.08)',
                    }}
                  >
                    <Text style={{
                      color: Colors.neonCyan,
                      fontSize: 11,
                      fontFamily: FontFamilies.semiBold,
                      letterSpacing: 2,
                    }}>
                      START RAID
                    </Text>
                  </Pressable>
                )}

                {isCompleted && (
                  <Text style={{
                    color: Colors.neonGreen,
                    fontSize: 10,
                    fontFamily: FontFamilies.semiBold,
                    letterSpacing: 1,
                    textAlign: 'center',
                  }}>
                    ✓ RAID COMPLETE — {mission.rewardName}
                  </Text>
                )}
              </View>
            );
          })}
        </BlurView>
      </View>
    </ScrollView>
  );
}
