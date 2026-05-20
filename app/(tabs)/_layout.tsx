import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamilies } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0, 243, 255, 0.15)',
        },
        headerTintColor: Colors.neonCyan,
        headerTitleStyle: {
          fontFamily: FontFamilies.bold,
          letterSpacing: 3,
          fontSize: 13,
          textShadowColor: Colors.neonCyan,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 4,
        },
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0, 243, 255, 0.2)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.neonCyan,
        tabBarInactiveTintColor: '#a0a0a0',
        tabBarLabelStyle: {
          fontFamily: FontFamilies.semiBold,
          fontSize: 10,
          letterSpacing: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SYSTEM WINDOW',
          tabBarLabel: 'Status',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mission"
        options={{
          title: 'MISSIONS',
          tabBarLabel: 'Missions',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'barbell' : 'barbell-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
