import { Tabs } from 'expo-router';
import { Colors } from '@/lib/colors';
import { Platform } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.text,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: Platform.OS === 'ios' ? 0 : 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'People',
          tabBarIcon: ({ color, size }) => <TabIcon emoji="👥" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon emoji="⚙️" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color, size }: { emoji: string; color: string; size: number }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: size - 4, color }}>{emoji}</Text>;
}
