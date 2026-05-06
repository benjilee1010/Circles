import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/PageContainer';

export default function ChangeEmailScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleUpdate() {
    if (!newEmail.trim()) {
      Alert.alert('Required', 'Please enter a new email address.');
      return;
    }
    if (newEmail.trim() === session?.user?.email) {
      Alert.alert('Same email', 'That is already your current email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageContainer>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Current email</Text>
            <View style={styles.card}>
              <View style={styles.currentRow}>
                <Text style={styles.currentEmail}>{session?.user?.email}</Text>
              </View>
            </View>
          </View>

          {sent ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Confirmation sent</Text>
              <Text style={styles.successBody}>
                We sent a confirmation link to {newEmail.trim()}. Click it to complete the email change.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>New email</Text>
              <View style={styles.card}>
                <TextInput
                  style={styles.input}
                  placeholder="New email address"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  autoFocus
                />
              </View>
              <Text style={styles.hint}>
                A confirmation link will be sent to your new address. Your email won't change until you click it.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>Send confirmation</Text>}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </PageContainer>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { padding: 20, gap: 20 },
    section: { gap: 10 },
    sectionLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    currentRow: { paddingHorizontal: 16, paddingVertical: 14 },
    currentEmail: { fontSize: 16, color: colors.text, fontWeight: '500' },
    input: {
      paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 16, color: colors.text, backgroundColor: colors.surface,
    },
    hint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    primaryBtn: {
      backgroundColor: colors.text, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    successBox: {
      backgroundColor: colors.okLight, borderRadius: 12,
      padding: 20, gap: 6,
    },
    successTitle: { fontSize: 16, fontWeight: '600', color: colors.ok },
    successBody: { fontSize: 14, color: colors.ok, lineHeight: 20 },
  });
}
