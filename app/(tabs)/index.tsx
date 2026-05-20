import React from 'react';
import { ScrollView, View } from 'react-native';
import { StatusWindow } from '@/components/StatusWindow';
import { CooldownTimer } from '@/components/CooldownTimer';
import { useCooldownStore } from '@/stores/useCooldownStore';

export default function HomeScreen() {
  const isCooldown = useCooldownStore((s) => s.isAnyOnCooldown);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
      contentContainerStyle={{ gap: 12, paddingBottom: 20, paddingHorizontal: 16, paddingTop: 8 }}
    >
      <StatusWindow />
      {isCooldown() && <CooldownTimer />}
    </ScrollView>
  );
}
