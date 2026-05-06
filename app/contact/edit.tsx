import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';
import { FrequencyPicker } from '@/components/FrequencyPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ContactAvatar } from '@/components/ContactAvatar';
import { useAuth } from '@/context/AuthContext';
import { Contact, ImportantDate, ReminderFrequency } from '@/lib/types';
import { PageContainer } from '@/components/PageContainer';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [contact, setContact] = useState<Contact | null>(null);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [frequency, setFrequency] = useState<ReminderFrequency>('1m');
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: d }] = await Promise.all([
        supabase.from('contacts').select('*').eq('id', id).single(),
        supabase.from('important_dates').select('*').eq('contact_id', id),
      ]);
      if (c) {
        const ct = c as Contact;
        setContact(ct);
        setName(ct.name);
        setBirthday(ct.birthday ? format(parseISO(ct.birthday), 'MM/dd/yyyy') : '');
        setFrequency(ct.reminder_frequency);
        setAvatarUrl(ct.avatar_url ?? null);
        setCategory(ct.category ?? null);
      }
      if (d) setImportantDates(d as ImportantDate[]);
      setLoading(false);
    })();
  }, [id]);

  function parseDateInput(val: string): string | null {
    if (!val.trim()) return null;
    const cleaned = val.trim();
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (!match) return null;
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = match[3]
      ? (match[3].length === 2 ? '20' + match[3] : match[3])
      : new Date().getFullYear().toString();
    return `${year}-${month}-${day}`;
  }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    const birthdayDate = parseDateInput(birthday);
    const { error } = await supabase.from('contacts').update({
      name: name.trim(),
      birthday: birthdayDate,
      reminder_frequency: frequency,
    }).eq('id', id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  }

  function updateDate(idx: number, field: 'label' | 'date', val: string) {
    setImportantDates((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: val } : d));
  }

  async function saveImportantDates() {
    // Upsert all dates
    for (const d of importantDates) {
      const parsed = parseDateInput(d.date);
      if (!parsed || !d.label.trim()) continue;
      if (d.id.startsWith('new-')) {
        await supabase.from('important_dates').insert({ contact_id: id, label: d.label, date: parsed });
      } else {
        await supabase.from('important_dates').update({ label: d.label, date: parsed }).eq('id', d.id);
      }
    }
  }

  async function removeDate(idx: number) {
    const d = importantDates[idx];
    if (!d.id.startsWith('new-')) {
      await supabase.from('important_dates').delete().eq('id', d.id);
    }
    setImportantDates((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveAll() {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setSaving(true);
    const birthdayDate = parseDateInput(birthday);
    const [{ error }] = await Promise.all([
      supabase.from('contacts').update({ name: name.trim(), birthday: birthdayDate, reminder_frequency: frequency, category: category ?? null }).eq('id', id),
      saveImportantDates(),
    ]);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.textTertiary} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <PageContainer>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          {/* Avatar */}
          <View style={styles.avatarRow}>
            <ContactAvatar
              contactId={id}
              userId={session?.user?.id ?? ''}
              name={name || contact?.name || '?'}
              avatarUrl={avatarUrl}
              size={80}
              editable
              onUpdated={setAvatarUrl}
            />
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Birthday</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD or MM/DD/YYYY"
              placeholderTextColor={Colors.textTertiary}
              value={birthday}
              onChangeText={setBirthday}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <CategoryPicker value={category} onChange={setCategory} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Check in every</Text>
            <FrequencyPicker value={frequency} onChange={setFrequency} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Important dates</Text>
            {importantDates.map((d, i) => (
              <View key={d.id} style={styles.dateRow}>
                <TextInput
                  style={[styles.input, styles.dateLabelInput]}
                  placeholder="Label"
                  placeholderTextColor={Colors.textTertiary}
                  value={d.label}
                  onChangeText={(v) => updateDate(i, 'label', v)}
                />
                <TextInput
                  style={[styles.input, styles.dateValueInput]}
                  placeholder="MM/DD"
                  placeholderTextColor={Colors.textTertiary}
                  value={d.date.includes('-') ? format(parseISO(d.date), 'MM/dd') : d.date}
                  onChangeText={(v) => updateDate(i, 'date', v)}
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity onPress={() => removeDate(i)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addDateBtn}
              onPress={() => setImportantDates((prev) => [...prev, { id: `new-${Date.now()}`, contact_id: id, label: '', date: '' }])}
            >
              <Text style={styles.addDateBtnText}>+ Add date</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAll} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>
      </PageContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 24 },
  form: { gap: 16 },
  avatarRow: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  avatarHint: { fontSize: 12, color: Colors.textTertiary },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text,
  },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  dateLabelInput: { flex: 2 },
  dateValueInput: { flex: 1 },
  removeBtn: { padding: 8 },
  removeBtnText: { fontSize: 14, color: Colors.textTertiary },
  addDateBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 12, borderStyle: 'dashed',
    paddingVertical: 12, alignItems: 'center',
  },
  addDateBtnText: { fontSize: 14, color: Colors.textSecondary },
  saveBtn: {
    backgroundColor: Colors.text, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
