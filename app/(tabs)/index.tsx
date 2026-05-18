import React from 'react';
import { ScrollView, View } from 'react-native';
import { StatusWindow } from '@/components/StatusWindow';
import { CooldownTimer } from '@/components/CooldownTimer';
import { useCooldownStore } from '@/stores/useCooldownStore';

export default function HomeScreen() {
  const isCooldown = useCooldownStore((s) => s.isAnyOnCooldown);

  return (
    <ScrollView
      className="flex-1 bg-sl-bg px-4 pt-2"
      contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
    >
      <StatusWindow />
      {isCooldown() && <CooldownTimer />}
    </ScrollView>
  );
}
