import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>Crcls</Text>
          <Text style={styles.tagline}>Stay close to the people who matter.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign in</Text>}
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.switchRow}>
            <Text style={styles.switchText}>
              Don't have an account? <Text style={styles.switchLink}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, alignItems: 'center' },
    form: { gap: 12, width: '100%', maxWidth: 400 },
    header: { marginBottom: 48, alignItems: 'center', width: '100%', maxWidth: 400 },
    wordmark: { fontSize: 36, fontWeight: '700', color: colors.text, letterSpacing: -1 },
    tagline: { fontSize: 15, color: colors.textSecondary, marginTop: 8 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.text,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    switchRow: { marginTop: 32, alignItems: 'center' },
    switchText: { fontSize: 14, color: colors.textSecondary },
    switchLink: { color: colors.text, fontWeight: '600' },
  });
}
