import '../global.css';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { storage } from '@/lib/mmkv';
import { useProfileStore } from '@/stores/useProfileStore';
import { useMissionStore } from '@/stores/useMissionStore';
import { useCooldownStore } from '@/stores/useCooldownStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    storage.hydrate().then(() => {
      useProfileStore.getState().rehydrate();
      useCooldownStore.getState().rehydrate();
      useMissionStore.getState().rehydrate();
      useMissionStore.getState().resetDailyIfNeeded();
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00f3ff" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaView>
  );
}
