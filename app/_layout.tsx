import '../global.css';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, View, ActivityIndicator, Text } from 'react-native';
import { useFonts, Rajdhani_300Light, Rajdhani_400Regular, Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { storage } from '@/lib/mmkv';
import { useProfileStore } from '@/stores/useProfileStore';
import { useMissionStore } from '@/stores/useMissionStore';
import { useCooldownStore } from '@/stores/useCooldownStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { initNotifications, scheduleDailyMissionReminder } from '@/services/NotificationService';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const [storeReady, setStoreReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Rajdhani_300Light,
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  useEffect(() => {
    storage.hydrate().then(() => {
      useProfileStore.getState().rehydrate();
      useCooldownStore.getState().rehydrate();
      useMissionStore.getState().rehydrate();
      useMissionStore.getState().resetDailyIfNeeded();
      useNotificationStore.getState().rehydrate();
      initNotifications().then(() => {
        const notifSettings = useNotificationStore.getState();
        if (notifSettings.enabled) {
          scheduleDailyMissionReminder();
        }
      });
      setStoreReady(true);
    });
  }, []);

  const ready = storeReady && (fontsLoaded || fontError);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.neonCyan} size="large" />
        <Text style={{ color: Colors.neonCyan, marginTop: 12, fontSize: 14, letterSpacing: 4 }}>
          LOADING SYSTEM...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaView>
  );
}
