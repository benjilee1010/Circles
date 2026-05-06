import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors } from '@/lib/colors';
import { requestNotificationPermission, scheduleContactReminders } from '@/lib/notifications';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (session && Platform.OS !== 'web') {
      requestNotificationPermission().then((granted) => {
        if (granted) scheduleContactReminders();
      });
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="contact/[id]"
        options={{
          headerShown: true,
          headerBackTitle: '',
          headerTintColor: Colors.text,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          title: '',
        }}
      />
      <Stack.Screen
        name="contact/add"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTintColor: Colors.text,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          title: 'New Person',
        }}
      />
      <Stack.Screen
        name="contact/edit"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTintColor: Colors.text,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          title: 'Edit',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
