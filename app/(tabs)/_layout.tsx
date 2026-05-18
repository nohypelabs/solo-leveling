import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#00f3ff',
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#00f3ff33',
        },
        tabBarActiveTintColor: '#00f3ff',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'System Window', tabBarLabel: 'Status' }}
      />
      <Tabs.Screen
        name="mission"
        options={{ title: 'Missions', tabBarLabel: 'Missions' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarLabel: 'Profile' }}
      />
    </Tabs>
  );
}
