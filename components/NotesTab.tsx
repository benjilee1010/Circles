import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { format, subDays, parseISO, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConvoEntry {
  id: string;
  date: string; // yyyy-MM-dd
  text: string;
}

interface ProfileSection {
  id: string;
  label: string;
  content: string;
}

interface NotesData {
  conversations: ConvoEntry[];
  sections: ProfileSection[];
}

// ─── Pre-built prompts ────────────────────────────────────────────────────────

const PROMPT_OPTIONS = [
  { id: 'hobbies',     label: 'Hobbies' },
  { id: 'interests',   label: 'Interests & passions' },
  { id: 'remember',    label: 'Things to remember' },
  { id: 'dislikes',    label: 'Dislikes' },
  { id: 'food',        label: 'Food & drink' },
  { id: 'family',      label: 'Family & relationships' },
  { id: 'work',        label: 'Work & career' },
  { id: 'goals',       label: 'Goals & dreams' },
  { id: 'petpeeves',   label: 'Pet peeves' },
  { id: 'howwemet',    label: 'How we met' },
  { id: 'insidejokes', label: 'Inside jokes' },
  { id: 'favorites',   label: 'Favorite things' },
  { id: 'random',      label: 'Random notes' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNotes(raw: string | null): NotesData {
  if (!raw) return { conversations: [], sections: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'sections' in parsed) return parsed as NotesData;
  } catch {}
  return {
    conversations: [],
    sections: raw.trim() ? [{ id: 'random', label: 'Random notes', content: raw }] : [],
  };
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toDateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function parseDateInput(val: string): string | null {
  const cleaned = val.trim();
  // Accept MM/DD or MM/DD/YYYY
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (!m) return null;
  const month = m[1].padStart(2, '0');
  const day   = m[2].padStart(2, '0');
  const year  = m[3]
    ? (m[3].length === 2 ? '20' + m[3] : m[3])
    : new Date().getFullYear().toString();
  const candidate = `${year}-${month}-${day}`;
  // Validate it's a real date
  const d = new Date(candidate + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  return candidate;
}

function friendlyDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (isToday(d))     return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d, yyyy');
}

// ─── Date Picker Modal ────────────────────────────────────────────────────────

interface DatePickerProps {
  visible: boolean;
  existingDates: Set<string>;
  onPick: (dateStr: string) => void;
  onCancel: () => void;
  colors: ColorScheme;
  styles: ReturnType<typeof makeStyles>;
}

function DatePickerModal({ visible, existingDates, onPick, onCancel, colors, styles }: DatePickerProps) {
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCustomInput('');
      setCustomError('');
      setShowCustom(false);
    }
  }, [visible]);

  // Quick-pick: today + last 13 days = 14 options
  const quickDays = Array.from({ length: 14 }, (_, i) => subDays(new Date(), i));

  function handleQuickPick(d: Date) {
    onPick(toDateStr(d));
  }

  function handleCustomSubmit() {
    const parsed = parseDateInput(customInput);
    if (!parsed) {
      setCustomError('Enter a date like 4/20 or 4/20/2024');
      return;
    }
    onPick(parsed);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>When was this conversation?</Text>

          {/* Quick date grid */}
          <View style={styles.quickGrid}>
            {quickDays.map((d) => {
              const ds = toDateStr(d);
              const already = existingDates.has(ds);
              const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'EEE, MMM d');
              return (
                <TouchableOpacity
                  key={ds}
                  style={[styles.quickChip, already && styles.quickChipUsed]}
                  onPress={() => handleQuickPick(d)}
                >
                  <Text style={[styles.quickChipText, already && styles.quickChipTextUsed]}>
                    {label}
                  </Text>
                  {already && <Text style={styles.quickChipDot}> ·</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom date input */}
          {!showCustom ? (
            <TouchableOpacity style={styles.customToggle} onPress={() => setShowCustom(true)}>
              <Text style={styles.customToggleText}>Pick a different date…</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customRow}>
              <TextInput
                style={[styles.customInput, customError ? styles.customInputError : null]}
                placeholder="MM/DD or MM/DD/YYYY"
                placeholderTextColor={colors.textTertiary}
                value={customInput}
                onChangeText={(t) => { setCustomInput(t); setCustomError(''); }}
                keyboardType="numbers-and-punctuation"
                autoFocus
              />
              <TouchableOpacity style={styles.customGoBtn} onPress={handleCustomSubmit}>
                <Text style={styles.customGoBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
          {!!customError && <Text style={styles.customError}>{customError}</Text>}

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  contactId: string;
  contactName: string;
  initialNotes: string | null;
}

export function NotesTab({ contactId, contactName, initialNotes }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [data, setData] = useState<NotesData>(() => parseNotes(initialNotes));
  const [saving, setSaving] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'new' | string | null>(null);
  // 'new' = creating, or a convo id = changing that entry's date
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, View | null>>({});

  useEffect(() => {
    setData(parseNotes(initialNotes));
  }, [initialNotes]);

  function persist(next: NotesData) {
    setData(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await supabase.from('contacts').update({ notes: JSON.stringify(next) }).eq('id', contactId);
      setSaving(false);
    }, 600);
  }

  function jumpTo(sectionId: string) {
    const view = sectionRefs.current[sectionId];
    if (!view || !scrollRef.current) return;
    view.measureLayout(
      scrollRef.current as unknown as React.ElementRef<typeof View>,
      (_x, y) => scrollRef.current?.scrollTo({ y: y - 12, animated: true }),
      () => {},
    );
  }

  // ── Conversation notes ──────────────────────────────────────────────────────

  const existingColvoDates = new Set(data.conversations.map((c) => c.date));

  function handleDatePicked(dateStr: string) {
    if (datePickerMode === 'new') {
      const entry: ConvoEntry = { id: uid(), date: dateStr, text: '' };
      // Insert in chronological order (most recent first)
      const updated = [entry, ...data.conversations].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      persist({ ...data, conversations: updated });
    } else if (datePickerMode) {
      // Changing the date of an existing entry
      const updated = data.conversations
        .map((c) => c.id === datePickerMode ? { ...c, date: dateStr } : c)
        .sort((a, b) => b.date.localeCompare(a.date));
      persist({ ...data, conversations: updated });
    }
    setDatePickerMode(null);
  }

  function updateConvoText(id: string, text: string) {
    persist({ ...data, conversations: data.conversations.map((c) => c.id === id ? { ...c, text } : c) });
  }

  function deleteConvo(id: string) {
    Alert.alert('Delete entry', 'Remove this conversation note?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () =>
        persist({ ...data, conversations: data.conversations.filter((c) => c.id !== id) }),
      },
    ]);
  }

  // ── Profile sections ────────────────────────────────────────────────────────

  function addSection(prompt: { id: string; label: string }) {
    if (data.sections.find((s) => s.id === prompt.id)) return;
    persist({ ...data, sections: [...data.sections, { ...prompt, content: '' }] });
    setShowPrompts(false);
  }

  function addCustomSection() {
    persist({ ...data, sections: [...data.sections, { id: uid(), label: 'New section', content: '' }] });
    setShowPrompts(false);
  }

  function updateSection(id: string, field: 'label' | 'content', val: string) {
    persist({ ...data, sections: data.sections.map((s) => s.id === id ? { ...s, [field]: val } : s) });
  }

  function deleteSection(id: string) {
    Alert.alert('Delete section', 'Remove this section?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () =>
        persist({ ...data, sections: data.sections.filter((s) => s.id !== id) }),
      },
    ]);
  }

  const usedIds = new Set(data.sections.map((s) => s.id));
  const availablePrompts = PROMPT_OPTIONS.filter((p) => !usedIds.has(p.id));

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {saving && (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color={colors.textTertiary} />
            <Text style={styles.savingText}>Saving…</Text>
          </View>
        )}

        {/* ── Conversation Notes ──────────────────────────────────────── */}
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Conversation Notes</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setDatePickerMode('new')}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {data.conversations.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Tap "+ New" to log notes from a conversation — past or present.
            </Text>
          </View>
        )}

        {data.conversations.map((entry) => (
          <View key={entry.id} style={styles.convoCard}>
            <View style={styles.convoHeader}>
              {/* Tappable date badge — opens date picker to change it */}
              <TouchableOpacity
                style={styles.dateBadge}
                onPress={() => setDatePickerMode(entry.id)}
              >
                <Text style={styles.dateBadgeText}>{friendlyDate(entry.date)}</Text>
                <Text style={styles.dateBadgeEdit}> ✎</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => deleteConvo(entry.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteX}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.convoInput}
              multiline
              placeholder="What did you talk about? Anything worth remembering…"
              placeholderTextColor={colors.textTertiary}
              value={entry.text}
              onChangeText={(t) => updateConvoText(entry.id, t)}
              textAlignVertical="top"
            />
          </View>
        ))}

        {/* ── About section ──────────────────────────────────────────── */}
        <View style={[styles.blockHeader, { marginTop: 28 }]}>
          <Text style={styles.blockTitle}>About {contactName}</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowPrompts((v) => !v)}>
            <Text style={styles.addBtnText}>{showPrompts ? 'Cancel' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showPrompts && (
          <View style={styles.promptGrid}>
            {availablePrompts.map((p) => (
              <TouchableOpacity key={p.id} style={styles.promptChip} onPress={() => addSection(p)}>
                <Text style={styles.promptChipText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.promptChip, styles.promptChipCustom]} onPress={addCustomSection}>
              <Text style={styles.promptChipText}>Custom…</Text>
            </TouchableOpacity>
          </View>
        )}

        {data.sections.length >= 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.jumpNav}
            contentContainerStyle={styles.jumpNavContent}
          >
            {data.sections.map((s) => (
              <TouchableOpacity key={s.id} style={styles.jumpChip} onPress={() => jumpTo(s.id)}>
                <Text style={styles.jumpChipText}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {data.sections.length === 0 && !showPrompts && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Tap "+ Add" to build a profile — Hobbies, Interests, Things to Remember, and more.
            </Text>
          </View>
        )}

        {data.sections.map((section) => (
          <View
            key={section.id}
            ref={(r) => { sectionRefs.current[section.id] = r; }}
            style={styles.profileCard}
          >
            <View style={styles.profileCardHeader}>
              <TextInput
                style={styles.sectionLabelInput}
                value={section.label}
                onChangeText={(t) => updateSection(section.id, 'label', t)}
                placeholder="Section name"
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity
                onPress={() => deleteSection(section.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteX}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.profileInput}
              multiline
              placeholder={placeholderFor(section.id)}
              placeholderTextColor={colors.textTertiary}
              value={section.content}
              onChangeText={(t) => updateSection(section.id, 'content', t)}
              textAlignVertical="top"
            />
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date picker modal — outside ScrollView so it overlays correctly */}
      <DatePickerModal
        visible={datePickerMode !== null}
        existingDates={existingColvoDates}
        onPick={handleDatePicked}
        onCancel={() => setDatePickerMode(null)}
        colors={colors}
        styles={styles}
      />
    </>
  );
}

// ─── Placeholder text ─────────────────────────────────────────────────────────

function placeholderFor(id: string): string {
  const map: Record<string, string> = {
    hobbies:     'e.g. rock climbing, painting, building PCs…',
    interests:   'e.g. philosophy, sci-fi, personal finance…',
    remember:    'e.g. allergic to peanuts, prefers texts over calls…',
    dislikes:    'e.g. crowded places, spicy food, small talk…',
    food:        'e.g. loves sushi, vegetarian, obsessed with coffee…',
    family:      'e.g. two siblings, dog named Milo, close with mom…',
    work:        'e.g. product manager at a startup, wants to go freelance…',
    goals:       'e.g. run a marathon, move to Japan, start a business…',
    petpeeves:   'e.g. people being late, passive aggression…',
    howwemet:    "e.g. college roommates, met at Jake's party in 2022…",
    insidejokes: 'e.g. "the incident", running joke about pineapple pizza…',
    favorites:   'e.g. The Office, Mac DeMarco, thriller novels…',
    random:      'Anything else worth remembering…',
  };
  return map[id] ?? 'Write anything…';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    savingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    savingText: { fontSize: 12, color: colors.textTertiary },

    blockHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 10,
    },
    blockTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    addBtn: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    addBtnText: { fontSize: 13, fontWeight: '500', color: colors.text },

    emptyCard: {
      backgroundColor: colors.surfaceAlt, borderRadius: 12,
      padding: 16, marginBottom: 8,
    },
    emptyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

    // Jump nav
    jumpNav: { marginBottom: 12 },
    jumpNavContent: { gap: 8, paddingRight: 4 },
    jumpChip: {
      borderWidth: 1, borderColor: colors.accentDark, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 5,
      backgroundColor: colors.surfaceAlt,
    },
    jumpChipText: { fontSize: 12, fontWeight: '600', color: colors.accentDark },

    // Conversation cards
    convoCard: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      marginBottom: 10, overflow: 'hidden',
    },
    convoHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 14, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.surfaceAlt,
    },
    dateBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.text, borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 3,
    },
    dateBadgeText: { fontSize: 12, fontWeight: '600', color: colors.background },
    dateBadgeEdit: { fontSize: 11, color: colors.background, opacity: 0.65 },
    deleteX: { fontSize: 14, color: colors.textTertiary },
    convoInput: {
      fontSize: 15, lineHeight: 23, color: colors.text,
      padding: 14, minHeight: 90,
    },

    // Prompt chips
    promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    promptChip: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: colors.surface,
    },
    promptChipCustom: { borderStyle: 'dashed' },
    promptChipText: { fontSize: 13, color: colors.text },

    // Profile section cards
    profileCard: {
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      marginBottom: 10, overflow: 'hidden',
    },
    profileCardHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4,
    },
    sectionLabelInput: {
      flex: 1, fontSize: 12, fontWeight: '700',
      color: colors.textSecondary, letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 14, marginBottom: 2 },
    profileInput: {
      fontSize: 15, lineHeight: 23, color: colors.text,
      padding: 14, paddingTop: 10, minHeight: 70,
    },

    // Date picker modal
    modalBackdrop: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      padding: 24, paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 17, fontWeight: '700', color: colors.text,
      marginBottom: 18, textAlign: 'center',
    },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    quickChip: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: colors.surface,
    },
    quickChipUsed: { borderColor: colors.accentDark, backgroundColor: colors.surfaceAlt },
    quickChipText: { fontSize: 14, color: colors.text },
    quickChipTextUsed: { color: colors.accentDark },
    quickChipDot: { fontSize: 14, color: colors.accentDark },
    customToggle: { alignItems: 'center', paddingVertical: 10 },
    customToggleText: { fontSize: 14, color: colors.textSecondary, textDecorationLine: 'underline' },
    customRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 4 },
    customInput: {
      flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.text,
      backgroundColor: colors.surface,
    },
    customInputError: { borderColor: colors.overdue },
    customGoBtn: {
      backgroundColor: colors.text, borderRadius: 10,
      paddingHorizontal: 18, paddingVertical: 11,
    },
    customGoBtnText: { color: colors.background, fontWeight: '600', fontSize: 15 },
    customError: { fontSize: 13, color: colors.overdue, marginBottom: 8, marginLeft: 2 },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelBtnText: { fontSize: 15, color: colors.textSecondary },
  });
}
