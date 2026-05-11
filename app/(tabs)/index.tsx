import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  RefreshControl, SafeAreaView, Pressable, ScrollView, TextInput,
  Modal, ActivityIndicator,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { useContacts } from '@/hooks/useContacts';
import { useCategories } from '@/hooks/useCategories';
import { ContactWithMeta } from '@/lib/types';
import { frequencyLabel } from '@/lib/frequencies';
import { ContactAvatar } from '@/components/ContactAvatar';
import { PageContainer } from '@/components/PageContainer';
import { supabase } from '@/lib/supabase';

type Section = { title: string; data: ContactWithMeta[] };

export default function PeopleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { contacts, loading, refresh } = useContacts();
  const { allCategories, refresh: refreshCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showLogToday, setShowLogToday] = useState(false);

  useFocusEffect(useCallback(() => {
    refresh();
    refreshCategories();
  }, []));

  const logTodayInteraction = useCallback(async (contactId: string, type: 'hung_out' | 'kept_in_touch') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data: existing } = await supabase
      .from('interactions').select('id')
      .eq('contact_id', contactId).eq('date', today).eq('type', type)
      .maybeSingle();
    if (existing) {
      await supabase.from('interactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('interactions').insert({ contact_id: contactId, date: today, type });
    }
    refresh();
  }, [refresh]);

  const countFor = (cat: string) => contacts.filter((c) => c.category === cat).length;
  const uncategorizedCount = contacts.filter((c) => !c.category).length;

  function sorted(list: ContactWithMeta[]): ContactWithMeta[] {
    return [...list].sort((a, b) => {
      const aDays = a.days_since_contact ?? 9999;
      const bDays = b.days_since_contact ?? 9999;
      return aDays - bDays; // most recent first
    });
  }

  // Build grouped sections
  const sections: Section[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (c: ContactWithMeta) => !q || c.name.toLowerCase().includes(q);

    if (selectedCategory === '__none__') {
      const data = sorted(contacts.filter((c) => !c.category && match(c)));
      return data.length ? [{ title: '', data }] : [];
    }
    if (selectedCategory) {
      const data = sorted(contacts.filter((c) => c.category === selectedCategory && match(c)));
      return data.length ? [{ title: '', data }] : [];
    }

    const result: Section[] = [];
    for (const cat of allCategories) {
      const data = sorted(contacts.filter((c) => c.category === cat && match(c)));
      if (data.length) result.push({ title: cat, data });
    }
    const uncat = sorted(contacts.filter((c) => !c.category && match(c)));
    if (uncat.length) result.push({ title: 'Uncategorized', data: uncat });
    return result;
  }, [contacts, allCategories, selectedCategory, query]);

  const renderItem = useCallback(({ item }: { item: ContactWithMeta }) => (
    <ContactRow
      contact={item}
      onPress={() => router.push(`/contact/${item.id}`)}
      onLog={logTodayInteraction}
      colors={colors}
      styles={styles}
    />
  ), [router, colors, styles, logTodayInteraction]);

  const renderSectionHeader = useCallback(({ section }: { section: Section }) => {
    if (!section.title) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionLine} />
      </View>
    );
  }, [styles]);

  const isEmpty = !loading && contacts.length > 0 && sections.length === 0;
  const isFirstLoad = !loading && contacts.length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Crcls</Text>
        <Text style={styles.version}>version 1.1.17  Made by Hoyeon Lee</Text>
      </View>

      <PageContainer>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.groupBtn} onPress={() => router.push('/group-log')}>
            <Text style={styles.groupBtnText}>Group</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/contact/add')}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Log today button */}
        {contacts.length > 0 && (
          <TouchableOpacity style={styles.logTodayBtn} onPress={() => setShowLogToday(true)}>
            <Text style={styles.logTodayBtnText}>Log today</Text>
          </TouchableOpacity>
        )}


        {/* Category filter chips */}
        {contacts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterBar}
            contentContainerStyle={styles.filterBarContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === null && styles.filterChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.filterChipText, selectedCategory === null && styles.filterChipTextActive]}>All</Text>
              <Text style={[styles.filterChipCount, selectedCategory === null && styles.filterChipCountActive]}>
                {contacts.length}
              </Text>
            </TouchableOpacity>

            {allCategories.filter((cat) => countFor(cat) > 0).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                <Text style={[styles.filterChipCount, selectedCategory === cat && styles.filterChipCountActive]}>
                  {countFor(cat)}
                </Text>
              </TouchableOpacity>
            ))}

            {uncategorizedCount > 0 && (
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === '__none__' && styles.filterChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === '__none__' ? null : '__none__')}
              >
                <Text style={[styles.filterChipText, selectedCategory === '__none__' && styles.filterChipTextActive]}>
                  Uncategorized
                </Text>
                <Text style={[styles.filterChipCount, selectedCategory === '__none__' && styles.filterChipCountActive]}>
                  {uncategorizedCount}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Grouped list */}
        <SectionList
          sections={sections}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textTertiary} />}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          SectionSeparatorComponent={() => <View style={styles.sectionSep} />}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            !loading ? (
              isFirstLoad ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>Your circles are empty</Text>
                  <Text style={styles.emptyBody}>Add the people you want to stay close with.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/contact/add')}>
                    <Text style={styles.emptyBtnText}>Add someone</Text>
                  </TouchableOpacity>
                </View>
              ) : isEmpty ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No results</Text>
                  <Text style={styles.emptyBody}>
                    {query.trim() ? `Nobody matches "${query}".` : 'No one in this category yet.'}
                  </Text>
                </View>
              ) : null
            ) : null
          }
        />
      </PageContainer>

      <LogTodayModal
        visible={showLogToday}
        contacts={contacts}
        colors={colors}
        onClose={() => setShowLogToday(false)}
        onSave={async (selections) => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const rows = Object.entries(selections)
            .filter(([, t]) => t !== null)
            .map(([contact_id, type]) => ({ contact_id, date: today, type: type! }));
          if (rows.length > 0) {
            await supabase.from('interactions').insert(rows);
            refresh();
          }
        }}
      />
    </SafeAreaView>
  );
}

// ─── Log Today Modal ──────────────────────────────────────────────────────────

type LogType = 'hung_out' | 'kept_in_touch';

function LogTodayModal({ visible, contacts, colors, onClose, onSave }: {
  visible: boolean;
  contacts: ContactWithMeta[];
  colors: ColorScheme;
  onClose: () => void;
  onSave: (s: Record<string, LogType | null>) => Promise<void>;
}) {
  const styles = React.useMemo(() => makeModalStyles(colors), [colors]);
  const [selections, setSelections] = useState<Record<string, LogType | null>>({});
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset when modal opens
  React.useEffect(() => {
    if (visible) { setSelections({}); setQuery(''); }
  }, [visible]);

  const filtered = contacts.filter((c) =>
    !query.trim() || c.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  function toggle(id: string, type: LogType) {
    setSelections((prev) => ({ ...prev, [id]: prev[id] === type ? null : type }));
  }

  const count = Object.values(selections).filter(Boolean).length;

  async function handleSave() {
    setSaving(true);
    await onSave(selections);
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>Log today</Text>

          <TextInput
            style={styles.search}
            placeholder="Search…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {filtered.map((c, i) => {
              const sel = selections[c.id] ?? null;
              return (
                <View key={c.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <Text style={styles.name} numberOfLines={1}>{c.name}</Text>
                  <View style={styles.chips}>
                    <TouchableOpacity
                      style={[styles.chip, sel === 'hung_out' && styles.chipGreen]}
                      onPress={() => toggle(c.id, 'hung_out')}
                    >
                      <Text style={[styles.chipText, sel === 'hung_out' && styles.chipTextGreen]}>
                        Hung out
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.chip, sel === 'kept_in_touch' && styles.chipDark]}
                      onPress={() => toggle(c.id, 'kept_in_touch')}
                    >
                      <Text style={[styles.chipText, sel === 'kept_in_touch' && styles.chipTextDark]}>
                        Kept in touch
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            <View style={{ height: 8 }} />
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, count === 0 && styles.saveBtnOff]}
            onPress={handleSave}
            disabled={saving || count === 0}
          >
            {saving
              ? <ActivityIndicator color={colors.background} />
              : <Text style={[styles.saveBtnText, count === 0 && styles.saveBtnTextOff]}>
                  {count === 0 ? 'Select interactions to save' : `Save ${count} ${count === 1 ? 'entry' : 'entries'}`}
                </Text>}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeModalStyles(colors: ColorScheme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
      maxHeight: '80%',
    },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 14, textAlign: 'center' },
    search: {
      backgroundColor: colors.surfaceAlt, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 15, color: colors.text, marginBottom: 10,
    },
    list: { flexGrow: 0 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    name: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
    chips: { flexDirection: 'row', gap: 6 },
    chip: {
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    chipGreen: { backgroundColor: colors.ok, borderColor: colors.ok },
    chipDark:  { backgroundColor: colors.text, borderColor: colors.text },
    chipText:      { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
    chipTextGreen: { color: '#FFFFFF', fontWeight: '600' },
    chipTextDark:  { color: colors.background, fontWeight: '600' },
    saveBtn:        { backgroundColor: colors.text, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
    saveBtnOff:     { backgroundColor: colors.surfaceAlt },
    saveBtnText:    { fontSize: 15, fontWeight: '600', color: colors.background },
    saveBtnTextOff: { color: colors.textTertiary },
  });
}

function ContactRow({
  contact, onPress, onLog, colors, styles,
}: {
  contact: ContactWithMeta;
  onPress: () => void;
  onLog: (id: string, type: 'hung_out' | 'kept_in_touch') => void;
  colors: ColorScheme;
  styles: ReturnType<typeof makeStyles>;
}) {
  const swipeRef = React.useRef<Swipeable>(null);

  const days = contact.days_since_contact;
  const isRegular = contact.is_regular_hangout || contact.is_regular_checkin;
  const daysLabel = isRegular ? 'Regular' : days === null ? 'Never' : days === 0 ? 'Today' : `${days}d ago`;
  const isOverdue = !isRegular && contact.is_overdue;
  const statusColor = isRegular ? colors.dueSoon : isOverdue ? colors.overdue : colors.ok;
  const statusBg    = isRegular ? colors.dueSoonLight : isOverdue ? colors.overdueLight : colors.okLight;

  const subtitle = contact.category
    ? `${contact.category} · ${frequencyLabel(contact.reminder_frequency)}`
    : frequencyLabel(contact.reminder_frequency);

  function renderRightActions() {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeBtn, { backgroundColor: colors.ok }]}
          onPress={() => { onLog(contact.id, 'hung_out'); swipeRef.current?.close(); }}
        >
          <Text style={[styles.swipeBtnText, { color: '#FFFFFF' }]}>Hung{'\n'}out</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeBtn, { backgroundColor: colors.text }]}
          onPress={() => { onLog(contact.id, 'kept_in_touch'); swipeRef.current?.close(); }}
        >
          <Text style={[styles.swipeBtnText, { color: colors.background }]}>Kept in{'\n'}touch</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false} friction={2} rightThreshold={40}>
      <Pressable style={(state: any) => [styles.row, (state.pressed || state.hovered) && styles.rowPressed]} onPress={onPress}>
        <View style={styles.avatarWrap}>
          <ContactAvatar
            contactId={contact.id}
            userId={contact.user_id}
            name={contact.name}
            avatarUrl={contact.avatar_url}
            size={44}
            editable={false}
          />
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowName}>{contact.name}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text>
          {contact.birthday_soon && (
            <Text style={styles.birthdayTag}>🎂 Birthday coming soon!</Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>{daysLabel}</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'baseline', gap: 10,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
    },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
    version: { fontSize: 11, color: colors.textTertiary, fontWeight: '400' },

    searchRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 15, color: colors.text,
    },
    groupBtn: {
      height: 40, borderRadius: 12, paddingHorizontal: 14,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    groupBtnText: { color: colors.text, fontSize: 13, fontWeight: '500' },
    addBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    addBtnText: { color: colors.text, fontSize: 26, lineHeight: 30, fontWeight: '300' },

    // Log today button
    logTodayBtn: {
      marginHorizontal: 16, marginTop: 8, marginBottom: 2,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingVertical: 11, alignItems: 'center',
    },
    logTodayBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },

// Filter chips — vertical padding must live on the ScrollView, not
    // contentContainerStyle, or React Native clips it on mobile.
    filterBar: { flexGrow: 0, paddingTop: 10, paddingBottom: 10 },
    filterBarContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderWidth: 1, borderColor: colors.border, borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.surface,
    },
    filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
    filterChipText: { fontSize: 13, fontWeight: '500', color: colors.text },
    filterChipTextActive: { color: colors.background },
    filterChipCount: {
      fontSize: 11, fontWeight: '700', color: colors.textSecondary,
      backgroundColor: colors.border, borderRadius: 8,
      paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden',
    },
    filterChipCountActive: { color: colors.background, backgroundColor: 'rgba(128,128,128,0.3)' },

    // Section headers
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
      backgroundColor: colors.background,
    },
    sectionTitle: {
      fontSize: 11, fontWeight: '700', color: colors.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase',
    },
    sectionLine: { flex: 1, height: 1, backgroundColor: colors.border },
    sectionSep: { height: 0 },

    list: { paddingBottom: 32 },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: colors.background,
      borderRadius: 12, overflow: 'hidden',
    },
    rowPressed: { backgroundColor: colors.surfaceAlt },
    avatarWrap: { marginRight: 12 },
    rowMeta: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '500', color: colors.text },
    rowSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    swipeActions: { flexDirection: 'row', width: 180 },
    swipeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    swipeBtnText: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '600' },
    birthdayTag: { fontSize: 12, color: colors.dueSoon, fontWeight: '600', marginTop: 3 },
    empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
    emptyBody: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    emptyBtn: {
      marginTop: 24, backgroundColor: colors.text,
      paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
    },
    emptyBtnText: { color: colors.background, fontWeight: '600', fontSize: 15 },
  });
}
