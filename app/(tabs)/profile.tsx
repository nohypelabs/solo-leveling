import React from 'react';
import { View, Text, Pressable, ScrollView, Switch, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore, type StatName } from '@/stores/useProfileStore';
import { useMissionStore } from '@/stores/useMissionStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { XPBar } from '@/components/XPBar';
import { GlitchText } from '@/components/GlitchText';
import { Colors, FontFamilies, Shadows } from '@/constants/theme';
import { hapticAllocate, hapticTap } from '@/services/HapticFeedbackService';
import { scheduleDailyMissionReminder, initNotifications } from '@/services/NotificationService';

const STAT_CONFIG: {
  key: StatName;
  label: string;
  icon: string;
  color: string;
  hex: string;
}[] = [
  { key: 'strength', label: 'STRENGTH', icon: '⚔️', color: 'bg-red-500', hex: '#ef4444' },
  { key: 'endurance', label: 'ENDURANCE', icon: '🛡️', color: 'bg-blue-500', hex: '#3b82f6' },
  { key: 'recovery', label: 'RECOVERY', icon: '💚', color: 'bg-green-500', hex: '#22c55e' },
  { key: 'flexibility', label: 'FLEXIBILITY', icon: '🌀', color: 'bg-purple-500', hex: '#a855f7' },
];

function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

export default function ProfileScreen() {
  const profile = useProfileStore();
  const mission = useMissionStore();
  const notif = useNotificationStore();

  function handleAllocate(stat: StatName) {
    if (profile.unallocatedPoints <= 0) return;
    hapticAllocate();
    profile.allocatePoint(stat);
  }

  const canAllocate = profile.unallocatedPoints > 0;

  async function handleToggleNotif(value: boolean) {
    if (value) {
      await initNotifications();
    }
    notif.setEnabled(value);
    if (value) {
      await scheduleDailyMissionReminder();
    }
  }

  function handleMorningTime(advance: boolean) {
    hapticTap();
    let { morningHour, morningMinute } = notif;
    if (advance) {
      morningMinute += 30;
      if (morningMinute >= 60) {
        morningMinute = 0;
        morningHour = (morningHour + 1) % 24;
      }
    } else {
      morningMinute -= 30;
      if (morningMinute < 0) {
        morningMinute = 30;
        morningHour = (morningHour - 1 + 24) % 24;
      }
    }
    notif.setMorningTime(morningHour, morningMinute);
    scheduleDailyMissionReminder();
  }

  function handleEveningTime(advance: boolean) {
    hapticTap();
    let { eveningHour, eveningMinute } = notif;
    if (advance) {
      eveningMinute += 30;
      if (eveningMinute >= 60) {
        eveningMinute = 0;
        eveningHour = (eveningHour + 1) % 24;
      }
    } else {
      eveningMinute -= 30;
      if (eveningMinute < 0) {
        eveningMinute = 30;
        eveningHour = (eveningHour - 1 + 24) % 24;
      }
    }
    notif.setEveningTime(eveningHour, eveningMinute);
    scheduleDailyMissionReminder();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ gap: 14, paddingBottom: 24, paddingHorizontal: 16, paddingTop: 12 }}
    >
      {/* Profile Header Card */}
      <View style={[{
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        borderRadius: 12,
        overflow: 'hidden',
      }, Shadows.neonCyan]}>
        <BlurView intensity={25} tint="dark" style={{ padding: 20, gap: 14 }}>
          <GlitchText size={13} center>
            BUILDER PROFILE
          </GlitchText>

          <View style={{ alignItems: 'center', gap: 4 }}>
            <GlitchText variant="pink" size={32}>
              Lv. {profile.level}
            </GlitchText>
            <XPBar current={profile.currentXP} />
            <Text style={{
              color: Colors.textMuted,
              fontSize: 12,
              fontFamily: FontFamilies.light,
              letterSpacing: 1,
              marginTop: 2,
            }}>
              Total XP: {profile.totalXP}
            </Text>
          </View>

          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Text style={{ color: Colors.textPrimary, fontSize: 14, fontFamily: FontFamilies.medium }}>
              🔥 Streak
            </Text>
            <GlitchText variant="pink" size={20}>
              {mission.streakDays} days
            </GlitchText>
          </View>
        </BlurView>
      </View>

      {/* Status Points Card */}
      <View style={[{
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        borderRadius: 12,
        overflow: 'hidden',
      }, Shadows.neonCyan]}>
        <BlurView intensity={25} tint="dark" style={{ padding: 20, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <GlitchText variant="pink" size={13}>
              STATUS POINTS
            </GlitchText>
            <Text
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: FontFamilies.semiBold,
                color: canAllocate ? Colors.neonCyan : Colors.textMuted,
                letterSpacing: 1,
                textShadowColor: canAllocate ? Colors.neonCyan : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: canAllocate ? 6 : 0,
              }}
            >
              Unallocated: {profile.unallocatedPoints}
            </Text>
          </View>

          {STAT_CONFIG.map((stat) => (
            <View
              key={stat.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: 0.5,
                borderBottomColor: 'rgba(0, 243, 255, 0.08)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Text style={{ fontSize: 20 }}>{stat.icon}</Text>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: 13,
                  fontWeight: 'bold',
                  fontFamily: FontFamilies.semiBold,
                  letterSpacing: 1,
                }}>
                  {stat.label}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 96,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor: Colors.barTrack,
                  overflow: 'hidden',
                }}>
                  <View
                    style={{
                      height: '100%',
                      borderRadius: 9999,
                      backgroundColor: stat.hex,
                      width: `${Math.min((profile[stat.key] / 50) * 100, 100)}%`,
                    }}
                  />
                </View>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: 14,
                  fontWeight: 'bold',
                  fontFamily: FontFamilies.semiBold,
                  width: 32,
                  textAlign: 'right',
                }}>
                  {profile[stat.key]}
                </Text>
                <Pressable
                  onPress={() => handleAllocate(stat.key)}
                  disabled={!canAllocate}
                  style={{ borderRadius: 9999, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={
                      canAllocate
                        ? ['rgba(0, 243, 255, 0.25)', 'rgba(0, 243, 255, 0.1)']
                        : [Colors.disabledBg, Colors.disabledBg]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 0.5,
                      borderColor: canAllocate ? Colors.neonCyan : 'rgba(55, 65, 81, 0.3)',
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontFamily: FontFamilies.bold,
                        color: canAllocate ? Colors.neonCyan : '#374151',
                        textShadowColor: canAllocate ? Colors.neonCyan : 'transparent',
                        textShadowOffset: { width: 0, height: 0 },
                        textShadowRadius: canAllocate ? 6 : 0,
                        fontSize: 16,
                      }}
                    >
                      +
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          ))}
        </BlurView>
      </View>

      {/* Notification Settings Card */}
      <View style={[{
        backgroundColor: Colors.card,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 243, 255, 0.3)',
        borderRadius: 12,
        overflow: 'hidden',
      }, Shadows.neonCyan]}>
        <BlurView intensity={25} tint="dark" style={{ padding: 20, gap: 14 }}>
          <GlitchText variant="pink" size={13}>
            NOTIFICATION SETTINGS
          </GlitchText>

          {/* Enable toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{
              color: Colors.textPrimary,
              fontSize: 13,
              fontFamily: FontFamilies.medium,
              letterSpacing: 1,
            }}>
              Enable Notifications
            </Text>
            <Switch
              value={notif.enabled}
              onValueChange={handleToggleNotif}
              trackColor={{ false: '#374151', true: 'rgba(0, 243, 255, 0.3)' }}
              thumbColor={notif.enabled ? Colors.neonCyan : '#6b7280'}
            />
          </View>

          {notif.enabled && (
            <>
              {/* Morning time */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 6,
                borderTopWidth: 0.5,
                borderTopColor: 'rgba(0, 243, 255, 0.08)',
              }}>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: 12,
                  fontFamily: FontFamilies.medium,
                  letterSpacing: 1,
                }}>
                  Morning Reminder
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    onPress={() => handleMorningTime(false)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    }}
                  >
                    <Text style={{ color: Colors.neonCyan, fontSize: 14, fontFamily: FontFamilies.bold }}>-</Text>
                  </Pressable>
                  <Text style={{
                    color: Colors.neonCyan,
                    fontSize: 14,
                    fontFamily: FontFamilies.semiBold,
                    letterSpacing: 1,
                    minWidth: 44,
                    textAlign: 'center',
                  }}>
                    {padTime(notif.morningHour)}:{padTime(notif.morningMinute)}
                  </Text>
                  <Pressable
                    onPress={() => handleMorningTime(true)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    }}
                  >
                    <Text style={{ color: Colors.neonCyan, fontSize: 14, fontFamily: FontFamilies.bold }}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Evening time */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{
                  color: Colors.textPrimary,
                  fontSize: 12,
                  fontFamily: FontFamilies.medium,
                  letterSpacing: 1,
                }}>
                  Evening Reminder
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable
                    onPress={() => handleEveningTime(false)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    }}
                  >
                    <Text style={{ color: Colors.neonCyan, fontSize: 14, fontFamily: FontFamilies.bold }}>-</Text>
                  </Pressable>
                  <Text style={{
                    color: Colors.neonCyan,
                    fontSize: 14,
                    fontFamily: FontFamilies.semiBold,
                    letterSpacing: 1,
                    minWidth: 44,
                    textAlign: 'center',
                  }}>
                    {padTime(notif.eveningHour)}:{padTime(notif.eveningMinute)}
                  </Text>
                  <Pressable
                    onPress={() => handleEveningTime(true)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      borderWidth: 0.5,
                      borderColor: 'rgba(0, 243, 255, 0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    }}
                  >
                    <Text style={{ color: Colors.neonCyan, fontSize: 14, fontFamily: FontFamilies.bold }}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Hardcore mode */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 6,
                borderTopWidth: 0.5,
                borderTopColor: 'rgba(0, 243, 255, 0.08)',
              }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{
                    color: Colors.textPrimary,
                    fontSize: 12,
                    fontFamily: FontFamilies.medium,
                    letterSpacing: 1,
                  }}>
                    Hardcore Mode
                  </Text>
                  <Text style={{
                    color: Colors.textMuted,
                    fontSize: 10,
                    fontFamily: FontFamilies.light,
                    letterSpacing: 0.5,
                    marginTop: 2,
                  }}>
                    Remind every 30 min if incomplete
                  </Text>
                </View>
                <Switch
                  value={notif.hardcoreMode}
                  onValueChange={(v) => {
                    hapticTap();
                    notif.setHardcoreMode(v);
                    scheduleDailyMissionReminder();
                  }}
                  trackColor={{ false: '#374151', true: 'rgba(255, 0, 204, 0.3)' }}
                  thumbColor={notif.hardcoreMode ? Colors.neonPink : '#6b7280'}
                />
              </View>
            </>
          )}
        </BlurView>
      </View>
    </ScrollView>
  );
}
