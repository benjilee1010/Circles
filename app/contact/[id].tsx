import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { useContact } from '@/hooks/useContact';
import { frequencyLabel } from '@/lib/frequencies';
import { HangoutCalendar } from '@/components/HangoutCalendar';
import { NotesTab } from '@/components/NotesTab';
import { ContactAvatar } from '@/components/ContactAvatar';
import { useAuth } from '@/context/AuthContext';
import { PageContainer } from '@/components/PageContainer';

type Tab = 'overview' | 'notes' | 'calendar';

export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { contact, importantDates, interactions, loading, refresh } = useContact(id);
  const [tab, setTab] = useState<Tab>('overview');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (contact) setAvatarUrl(contact.avatar_url ?? null);
  }, [contact]);


  async function logHangout(date: string) {
    const existing = interactions.find((i) => i.date === date);
    if (existing) {
      if (Platform.OS === 'web') {
        // eslint-disable-next-line no-alert
        const confirmed = window.confirm(`Remove the hangout on ${format(parseISO(date), 'MMM d')}?`);
        if (confirmed) {
          await supabase.from('interactions').delete().eq('id', existing.id);
          refresh();
        }
      } else {
        Alert.alert('Remove log', `Remove the hangout on ${format(parseISO(date), 'MMM d')}?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove', style: 'destructive', onPress: async () => {
              await supabase.from('interactions').delete().eq('id', existing.id);
              refresh();
            },
          },
        ]);
      }
    } else {
      await supabase.from('interactions').insert({ contact_id: id, date });
      refresh();
    }
  }

  async function handleDelete() {
    Alert.alert('Remove person', `Remove ${contact?.name} from your circles?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('contacts').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (loading || !contact) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.textTertiary} />
      </SafeAreaView>
    );
  }

  const loggedDates = new Set(interactions.map((i) => i.date));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Custom back button — always visible, always says Back */}
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>
      <PageContainer>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <ContactAvatar
            contactId={id}
            userId={session?.user?.id ?? ''}
            name={contact.name}
            avatarUrl={avatarUrl}
            size={56}
            editable
            onUpdated={setAvatarUrl}
          />
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{contact.name}</Text>
            <Text style={styles.profileSub}>{frequencyLabel(contact.reminder_frequency)}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push({ pathname: '/contact/edit', params: { id } })} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['overview', 'notes', 'calendar'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'overview' && (
          <ScrollView contentContainerStyle={styles.tabContent}>
            {/* Last contact */}
            <View style={styles.infoCard}>
              <InfoRow label="Last contact" value={contact.last_contacted_at
                ? format(parseISO(contact.last_contacted_at), 'MMM d, yyyy')
                : 'Never'} styles={styles} />
              {contact.birthday && (
                <InfoRow label="Birthday" value={format(parseISO(contact.birthday), 'MMM d')} divider styles={styles} />
              )}
              {importantDates.map((d, i) => (
                <InfoRow key={d.id} label={d.label} value={format(parseISO(d.date), 'MMM d')} divider styles={styles} />
              ))}
            </View>

            {/* Log hangout today button */}
            <TouchableOpacity
              style={styles.logBtn}
              onPress={() => logHangout(format(new Date(), 'yyyy-MM-dd'))}
            >
              <Text style={styles.logBtnText}>
                {loggedDates.has(format(new Date(), 'yyyy-MM-dd')) ? '✓ Logged today' : 'Log hangout today'}
              </Text>
            </TouchableOpacity>

            {/* Recent interactions */}
            {interactions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Recent hangouts</Text>
                <View style={styles.infoCard}>
                  {interactions.slice(0, 10).map((i, idx) => (
                    <InfoRow
                      key={i.id}
                      label={format(parseISO(i.date), 'MMM d, yyyy')}
                      value={i.note ?? ''}
                      divider={idx > 0}
                      styles={styles}
                    />
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Remove from circles</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {tab === 'notes' && (
          <NotesTab
            contactId={id}
            contactName={contact.name}
            initialNotes={contact.notes}
          />
        )}

        {tab === 'calendar' && (
          <HangoutCalendar
            loggedDates={loggedDates}
            onDayPress={logHangout}
            contactName={contact.name}
            lastContactedAt={contact.last_contacted_at}
          />
        )}
      </KeyboardAvoidingView>
      </PageContainer>
    </SafeAreaView>
  );
}

function InfoRow({
  label, value, divider, styles,
}: {
  label: string;
  value: string;
  divider?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <>
      {divider && <View style={styles.infoSep} />}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    backRow: { paddingHorizontal: 16, paddingVertical: 10 },
    backBtn: { alignSelf: 'flex-start', padding: 4 },
    backText: { fontSize: 17, color: colors.text, fontWeight: '400' },
    profileHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16, gap: 14,
    },
    profileMeta: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: '700', color: colors.text },
    profileSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    editBtn: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    editBtnText: { fontSize: 13, fontWeight: '500', color: colors.text },
    tabBar: {
      flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
      paddingHorizontal: 20,
    },
    tabBtn: { paddingVertical: 12, paddingHorizontal: 4, marginRight: 20 },
    tabBtnActive: { borderBottomWidth: 2, borderBottomColor: colors.text },
    tabLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    tabLabelActive: { color: colors.text },
    tabContent: { padding: 20, gap: 12 },
    infoCard: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    infoRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 13,
    },
    infoLabel: { fontSize: 15, color: colors.textSecondary },
    infoValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
    infoSep: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
    logBtn: {
      backgroundColor: colors.text, borderRadius: 12,
      paddingVertical: 16, alignItems: 'center',
    },
    logBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
    sectionLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4,
    },
    deleteBtn: { marginTop: 24, alignItems: 'center' },
    deleteBtnText: { fontSize: 14, color: colors.overdue },
  });
}
