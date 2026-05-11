import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { PageContainer } from '@/components/PageContainer';

// Fully custom toggle — bypasses RN Web's Switch which ignores trackColor on web
function MonoToggle({ value, onPress, colors }: { value: boolean; onPress: () => void; colors: ColorScheme }) {
  const anim = React.useRef(new Animated.Value(value ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [value]);
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        width: 51, height: 31, borderRadius: 16,
        backgroundColor: value ? colors.text : colors.border,
        justifyContent: 'center',
      }}
    >
      <Animated.View style={{
        width: 27, height: 27, borderRadius: 14,
        backgroundColor: '#FFFFFF',
        position: 'absolute',
        transform: [{ translateX: tx }],
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { session } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (!confirmed) return;
      setLoading(true);
      await supabase.auth.signOut();
      setLoading(false);
    } else {
      Alert.alert('Sign out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out', style: 'destructive', onPress: async () => {
            setLoading(true);
            await supabase.auth.signOut();
            setLoading(false);
          },
        },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Crcls</Text>
          <Text style={styles.brandVersion}>version 1.2.1  Made by Hoyeon Lee</Text>
        </View>
      </View>

      <PageContainer>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Signed in as</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{session?.user?.email ?? 'No email on file'}</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark mode</Text>
            <MonoToggle value={isDark} onPress={toggleTheme} colors={colors} />
          </View>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/settings/change-email')}>
            <Text style={styles.rowLabel}>Change email</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.cardDivider} />
          <TouchableOpacity style={styles.row} onPress={() => router.push('/settings/change-password')}>
            <Text style={styles.rowLabel}>Change password</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.overdue} />
            : <Text style={styles.signOutText}>Sign out</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Crcls · Stay close to the people who matter.</Text>
      </View>
      </PageContainer>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
    brandRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 6 },
    brand: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
    brandVersion: { fontSize: 11, color: colors.textTertiary, fontWeight: '400' },
    title: { fontSize: 20, fontWeight: '600', color: colors.textSecondary, letterSpacing: -0.3 },
    section: { paddingHorizontal: 20, marginTop: 24 },
    sectionLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
    },
    card: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    row: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    },
    rowLabel: { fontSize: 15, color: colors.textSecondary },
    rowValue: { fontSize: 15, color: colors.text, fontWeight: '500', maxWidth: '55%' },
    rowChevron: { fontSize: 20, color: colors.textTertiary },
    cardDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    signOutBtn: {
      backgroundColor: colors.overdueLight, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
    },
    signOutText: { fontSize: 15, fontWeight: '600', color: colors.overdue },
    footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 32, alignItems: 'center' },
    footerText: { fontSize: 12, color: colors.textTertiary },
  });
}
