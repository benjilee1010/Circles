import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/lib/colors';
import { FrequencyPicker } from '@/components/FrequencyPicker';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ReminderFrequency } from '@/lib/types';

export default function AddContactScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [frequency, setFrequency] = useState<ReminderFrequency>('1m');
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Not signed in', 'Please sign out and sign back in.'); return; }

    const birthdayDate = parseDateInput(birthday);
    setSaving(true);
    const { error } = await supabase.from('contacts').insert({
      user_id: user.id,
      name: name.trim(),
      birthday: birthdayDate,
      reminder_frequency: frequency,
      category: category ?? null,
    });
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.back();
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
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
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Add to circles</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 24 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.text,
  },
  saveBtn: {
    backgroundColor: Colors.text, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
