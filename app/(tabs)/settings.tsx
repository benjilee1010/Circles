import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/lib/colors';

export default function SettingsScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Signed in as</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{session?.user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={loading}>
          {loading
            ? <ActivityIndicator color={Colors.overdue} />
            : <Text style={styles.signOutText}>Sign out</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Circles · Stay close to the people who matter.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textTertiary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLabel: { fontSize: 15, color: Colors.textSecondary },
  rowValue: { fontSize: 15, color: Colors.text, fontWeight: '500', maxWidth: '55%' },
  signOutBtn: {
    backgroundColor: Colors.overdueLight, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: Colors.overdue },
  footer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 32, alignItems: 'center' },
  footerText: { fontSize: 12, color: Colors.textTertiary },
});
