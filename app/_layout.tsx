import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { Colors } from '@/lib/colors';
import { requestNotificationPermission, scheduleContactReminders } from '@/lib/notifications';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (session && Platform.OS !== 'web') {
      requestNotificationPermission().then((granted) => {
        if (granted) scheduleContactReminders();
      });
    }
  }, [session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="contact/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="contact/add"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          title: 'New Person',
        }}
      />
      <Stack.Screen
        name="contact/edit"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="settings/change-password"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          title: 'Change Password',
        }}
      />
      <Stack.Screen
        name="settings/change-email"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          title: 'Change Email',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
