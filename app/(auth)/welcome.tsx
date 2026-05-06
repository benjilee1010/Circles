import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';

const FEATURES = [
  {
    emoji: '📅',
    title: 'Log hangout dates',
    body: 'Record every time you spend time with someone so you never lose track.',
  },
  {
    emoji: '📝',
    title: 'Keep conversation notes',
    body: 'Remember what you talked about, their interests, and the things that matter.',
  },
  {
    emoji: '🔔',
    title: 'Get reminded to reach out',
    body: 'Set a check-in frequency for each person and get notified when it\'s been too long.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>

        {/* Wordmark */}
        <View style={styles.hero}>
          <Text style={styles.wordmark}>Crcls</Text>
          <Text style={styles.tagline}>Stay close to the people who matter.</Text>
        </View>

        {/* Feature list */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <View style={styles.featureMeta}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.primaryBtnText}>Create account</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.secondaryBtnText}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    inner: {
      flex: 1, justifyContent: 'center',
      paddingHorizontal: 32, paddingVertical: 40,
      maxWidth: 480, width: '100%', alignSelf: 'center',
    },

    hero: { marginBottom: 48, alignItems: 'center' },
    wordmark: {
      fontSize: 44, fontWeight: '700', color: colors.text,
      letterSpacing: -1.5, marginBottom: 10,
    },
    tagline: {
      fontSize: 16, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 24,
    },

    features: { gap: 24, marginBottom: 48 },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
    featureEmoji: { fontSize: 26, lineHeight: 32 },
    featureMeta: { flex: 1 },
    featureTitle: {
      fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3,
    },
    featureBody: {
      fontSize: 14, color: colors.textSecondary, lineHeight: 20,
    },

    ctas: { gap: 12 },
    primaryBtn: {
      backgroundColor: colors.text, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
    },
    primaryBtnText: { color: colors.background, fontSize: 16, fontWeight: '600' },
    secondaryBtn: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
      backgroundColor: colors.surface,
    },
    secondaryBtnText: { color: colors.text, fontSize: 16, fontWeight: '500' },
  });
}
