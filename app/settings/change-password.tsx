import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { PageContainer } from '@/components/PageContainer';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  async function handleSendReset() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    setSendingEmail(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    setSendingEmail(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEmailSent(true);
    }
  }

  async function handleUpdate() {
    if (!newPassword || !confirm) {
      Alert.alert('Required', 'Please fill in both fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too short', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Done', 'Your password has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageContainer>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Set new password</Text>
            <View style={styles.card}>
              <TextInput
                style={[styles.input, styles.inputTop]}
                placeholder="New password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <View style={styles.inputDivider} />
              <TextInput
                style={[styles.input, styles.inputBottom]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                value={confirm}
                onChangeText={setConfirm}
              />
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Update password</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reset via email</Text>
            <Text style={styles.hint}>
              We'll send a reset link to your email address. Use it to set a new password.
            </Text>
            {emailSent ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>Reset email sent — check your inbox.</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleSendReset} disabled={sendingEmail}>
                {sendingEmail
                  ? <ActivityIndicator color={colors.text} />
                  : <Text style={styles.secondaryBtnText}>Send reset email</Text>}
              </TouchableOpacity>
            )}
          </View>

        </ScrollView>
      </PageContainer>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { padding: 20, gap: 8 },
    section: { gap: 10 },
    sectionLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    input: {
      paddingHorizontal: 16, paddingVertical: 14,
      fontSize: 16, color: colors.text, backgroundColor: colors.surface,
    },
    inputTop: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    inputBottom: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
    inputDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    primaryBtn: {
      backgroundColor: colors.text, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    dividerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontSize: 13, color: colors.textTertiary },
    hint: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    secondaryBtn: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center', backgroundColor: colors.surface,
    },
    secondaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
    successBox: {
      backgroundColor: colors.okLight, borderRadius: 12,
      paddingVertical: 14, paddingHorizontal: 16,
    },
    successText: { fontSize: 14, color: colors.ok, fontWeight: '500' },
  });
}
