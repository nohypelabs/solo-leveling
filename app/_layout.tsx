import '../global.css';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissionStore } from '@/stores/useMissionStore';

export default function RootLayout() {
  const resetDaily = useMissionStore((s) => s.resetDailyIfNeeded);

  useEffect(() => {
    resetDaily();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar style="light" />
      <Slot />
    </SafeAreaView>
  );
}
