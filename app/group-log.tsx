import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, SafeAreaView, Alert, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth,
} from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { useContacts } from '@/hooks/useContacts';
import { frequencyLabel } from '@/lib/frequencies';
import { ContactAvatar } from '@/components/ContactAvatar';

function toDateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }
const todayStr = toDateStr(new Date());

// ─── Calendar picker ──────────────────────────────────────────────────────────

const CAL_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function CalPicker({ visible, onPick, onCancel, colors }: {
  visible: boolean;
  onPick: (d: string) => void;
  onCancel: () => void;
  colors: ColorScheme;
}) {
  const cs = React.useMemo(() => makeCalStyles(colors), [colors]);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));

  React.useEffect(() => {
    if (visible) setViewMonth(startOfMonth(new Date()));
  }, [visible]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd   = endOfMonth(viewMonth);
  const gridStart  = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd    = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(cursor); cursor = addDays(cursor, 1); }
    weeks.push(week);
  }

  const canFwd = !isSameMonth(viewMonth, today);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={cs.backdrop} onPress={onCancel}>
        <Pressable style={cs.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={cs.title}>Pick a date</Text>

          <View style={cs.nav}>
            <TouchableOpacity onPress={() => setViewMonth(subMonths(viewMonth, 1))} style={cs.navBtn}>
              <Text style={cs.arrow}>‹</Text>
            </TouchableOpacity>
            <Text style={cs.monthLabel}>{format(viewMonth, 'MMMM yyyy')}</Text>
            <TouchableOpacity
              onPress={() => { if (canFwd) setViewMonth(addMonths(viewMonth, 1)); }}
              style={cs.navBtn}
              disabled={!canFwd}
            >
              <Text style={[cs.arrow, !canFwd && cs.arrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={cs.dayHdrRow}>
            {CAL_DAY_LABELS.map((d, i) => (
              <Text key={i} style={cs.dayHdr}>{d}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={cs.week}>
              {week.map((day, di) => {
                const ds = toDateStr(day);
                const inMon    = isSameMonth(day, viewMonth);
                const isToday_ = ds === todayStr;
                const isFut    = ds > todayStr;
                const disabled = !inMon || isFut;
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      cs.day,
                      isToday_ && cs.dayToday,
                      disabled && cs.dayDisabled,
                    ]}
                    onPress={() => { if (!disabled) onPick(ds); }}
                    disabled={disabled}
                  >
                    <Text style={[
                      cs.dayNum,
                      isToday_ && cs.dayNumToday,
                      disabled && cs.dayNumDisabled,
                    ]}>
                      {inMon ? format(day, 'd') : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <TouchableOpacity style={cs.cancelBtn} onPress={onCancel}>
            <Text style={cs.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeCalStyles(colors: ColorScheme) {
  return StyleSheet.create({
    backdrop:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    sheet:           { backgroundColor: colors.background, borderRadius: 20, padding: 20, paddingBottom: 28, maxWidth: 420, width: '100%' },
    title:           { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 16 },
    nav:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    navBtn:          { padding: 8 },
    arrow:           { fontSize: 26, fontWeight: '300', color: colors.text },
    arrowDisabled:   { color: colors.textTertiary },
    monthLabel:      { fontSize: 15, fontWeight: '600', color: colors.text },
    dayHdrRow:       { flexDirection: 'row', marginBottom: 4 },
    dayHdr:          { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.4 },
    week:            { flexDirection: 'row', marginBottom: 4 },
    day:             { flex: 1, aspectRatio: 1, borderRadius: 10, margin: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
    dayToday:        { borderWidth: 1.5, borderColor: colors.text },
    dayDisabled:     { backgroundColor: 'transparent' },
    dayNum:          { fontSize: 14, fontWeight: '500', color: colors.text },
    dayNumToday:     { fontWeight: '700' },
    dayNumDisabled:  { color: colors.textTertiary },
    cancelBtn:       { alignItems: 'center', paddingVertical: 14 },
    cancelBtnText:   { fontSize: 15, color: colors.textSecondary },
  });
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GroupLogScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { contacts, loading } = useContacts();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [type, setType]   = useState<'hung_out' | 'kept_in_touch'>('hung_out');
  const [date, setDate]   = useState(todayStr);
  const [showCal, setShowCal] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = contacts.filter((c) =>
    !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function friendlyDate() {
    const yest = toDateStr(new Date(Date.now() - 86_400_000));
    if (date === todayStr) return 'Today';
    if (date === yest)     return 'Yesterday';
    return format(new Date(date + 'T12:00:00'), 'MMM d, yyyy');
  }

  async function handleLog() {
    if (selectedIds.size === 0) { Alert.alert('Select at least one person'); return; }
    setSaving(true);
    const rows = [...selectedIds].map((contact_id) => ({ contact_id, date, type }));
    const { error } = await supabase.from('interactions').insert(rows);
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>Crcls</Text>
          <Text style={styles.brandVer}>version 1.2.1  Made by Hoyeon Lee</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.screenTitle}>Group Hangout</Text>

        {/* Type toggle */}
        <View style={styles.typeBar}>
          {(['hung_out', 'kept_in_touch'] as const).map((val) => {
            const label = val === 'hung_out' ? 'Hung out' : 'Kept in touch';
            const active = type === val;
            return (
              <TouchableOpacity
                key={val}
                style={[
                  styles.typeBtn,
                  active && (val === 'hung_out' ? styles.typeBtnGreen : styles.typeBtnDark),
                ]}
                onPress={() => setType(val)}
              >
                <Text style={[
                  styles.typeBtnText,
                  active && (val === 'hung_out' ? styles.typeBtnTextGreen : styles.typeBtnTextDark),
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date row */}
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowCal(true)}>
          <Text style={styles.dateLabel}>Date</Text>
          <Text style={styles.dateVal}>{friendlyDate()} ›</Text>
        </TouchableOpacity>

        {/* Search */}
        <TextInput
          style={styles.search}
          placeholder="Search people…"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />

        {/* Contact list */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {loading && <ActivityIndicator color={colors.textTertiary} style={{ marginTop: 24 }} />}
          {filtered.map((c, i) => {
            const sel = selectedIds.has(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.contactRow, i > 0 && styles.contactSep]}
                onPress={() => toggle(c.id)}
              >
                <ContactAvatar
                  contactId={c.id} userId={c.user_id}
                  name={c.name} avatarUrl={c.avatar_url}
                  size={40} editable={false}
                />
                <View style={styles.contactMeta}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactSub} numberOfLines={1}>
                    {c.category ? `${c.category} · ` : ''}{frequencyLabel(c.reminder_frequency)}
                  </Text>
                </View>
                <View style={[styles.check, sel && styles.checkSel]}>
                  {sel && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Log button */}
        <TouchableOpacity
          style={[styles.logBtn, selectedIds.size === 0 && styles.logBtnOff]}
          onPress={handleLog}
          disabled={saving || selectedIds.size === 0}
        >
          {saving
            ? <ActivityIndicator color={colors.background} />
            : <Text style={[styles.logBtnText, selectedIds.size === 0 && styles.logBtnTextOff]}>
                {selectedIds.size === 0
                  ? 'Select people to log'
                  : `Log for ${selectedIds.size} ${selectedIds.size === 1 ? 'person' : 'people'}`}
              </Text>}
        </TouchableOpacity>
      </View>

      <CalPicker
        visible={showCal}
        colors={colors}
        onPick={(d) => { setDate(d); setShowCal(false); }}
        onCancel={() => setShowCal(false)}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safe:      { flex: 1, backgroundColor: colors.background },
    header:    { flexDirection: 'column', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
    brandRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
    brand:     { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
    brandVer:  { fontSize: 11, color: colors.textTertiary, fontWeight: '400' },
    backBtn:   { padding: 4 },
    backText:  { fontSize: 17, color: colors.text, fontWeight: '400' },

    body:        { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
    screenTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },

    typeBar:          { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 3, marginBottom: 12 },
    typeBtn:          { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8 },
    typeBtnGreen:     { backgroundColor: colors.ok },
    typeBtnDark:      { backgroundColor: colors.text },
    typeBtnText:      { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    typeBtnTextGreen: { color: '#FFFFFF', fontWeight: '600' },
    typeBtnTextDark:  { color: colors.background, fontWeight: '600' },

    dateRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12 },
    dateLabel: { fontSize: 15, color: colors.textSecondary },
    dateVal:   { fontSize: 15, fontWeight: '600', color: colors.text },

    search: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: colors.text, marginBottom: 8 },

    list:        { flex: 1 },
    contactRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
    contactSep:  { borderTopWidth: 1, borderTopColor: colors.border },
    contactMeta: { flex: 1 },
    contactName: { fontSize: 15, fontWeight: '500', color: colors.text },
    contactSub:  { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
    check:       { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    checkSel:    { backgroundColor: colors.ok, borderColor: colors.ok },
    checkMark:   { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },

    logBtn:        { backgroundColor: colors.text, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, marginBottom: 8 },
    logBtnOff:     { backgroundColor: colors.surfaceAlt },
    logBtnText:    { fontSize: 16, fontWeight: '600', color: colors.background },
    logBtnTextOff: { color: colors.textTertiary },
  });
}
