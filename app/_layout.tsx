import 'react-native-url-polyfill/auto';
import { useEffect, useRef } from 'react';
import React from 'react';
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
  const notificationsScheduled = useRef(false);

  // Auth redirect
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  // Schedule notifications once per session, not on every navigation
  useEffect(() => {
    if (!session || Platform.OS === 'web') return;
    if (notificationsScheduled.current) return;
    notificationsScheduled.current = true;
    requestNotificationPermission().then((granted) => {
      if (granted) scheduleContactReminders();
    });
  }, [session]);

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

// Inject global web styles (scrollbar + hover effects) once at startup
function useWebStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const style = document.createElement('style');
    style.textContent = `
      /* ── Scrollbar ── */
      * {
        scrollbar-width: thin;
        scrollbar-color: rgba(128,128,128,0.25) transparent;
      }
      ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(128,128,128,0.25);
        border-radius: 99px;
        transition: background 0.2s;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(128,128,128,0.5);
      }
      ::-webkit-scrollbar-corner {
        background: transparent;
      }

      /* ── Button hover highlights ──
         RN Web sets opacity:1 inline, so we use filter:brightness()
         which is a separate property and can't be blocked.
         Target both role="button" and tabindex="0" since RN Web
         applies both to interactive elements. */
      [role="button"],
      [tabindex="0"] {
        filter: brightness(1) !important;
        transition: filter 0.15s ease !important;
      }
      [role="button"]:hover,
      [tabindex="0"]:hover {
        filter: brightness(1.4) !important;
        cursor: pointer;
      }
      [role="button"]:active,
      [tabindex="0"]:active {
        filter: brightness(0.7) !important;
      }

      /* ── Input / textarea hover ── */
      input,
      textarea {
        transition: filter 0.15s ease !important;
      }
      input:hover,
      textarea:hover {
        filter: brightness(1.25) !important;
      }
      input:focus,
      textarea:focus {
        filter: brightness(1.35) !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
}

export default function RootLayout() {
  useWebStyles();
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
