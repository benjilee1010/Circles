import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, SafeAreaView, Pressable, ScrollView, TextInput,
} from 'react-native';
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

export default function PeopleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const { contacts, loading, refresh } = useContacts();
  const { allCategories, refresh: refreshCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useFocusEffect(useCallback(() => {
    refresh();
    refreshCategories();
  }, []));

  // Filter by category then by search query
  const byCategory = selectedCategory === '__none__'
    ? contacts.filter((c) => !c.category)
    : selectedCategory
      ? contacts.filter((c) => c.category === selectedCategory)
      : contacts;

  const filtered = query.trim()
    ? byCategory.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : byCategory;

  const renderItem = useCallback(({ item }: { item: ContactWithMeta }) => (
    <ContactRow contact={item} onPress={() => router.push(`/contact/${item.id}`)} colors={colors} styles={styles} />
  ), [router, colors, styles]);

  // Count per category for the chips
  const countFor = (cat: string) => contacts.filter((c) => c.category === cat).length;
  const uncategorizedCount = contacts.filter((c) => !c.category).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header — full width, always top-left */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Crcls</Text>
          <Text style={styles.version}>version 1.1.1  Made by Hoyeon Lee</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/contact/add')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <PageContainer>
      {/* Search bar */}
      {contacts.length > 0 && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>
      )}

      {/* Category filter bar */}
      {contacts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          {/* All chip */}
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === null && styles.filterChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterChipText, selectedCategory === null && styles.filterChipTextActive]}>
              All
            </Text>
            <Text style={[styles.filterChipCount, selectedCategory === null && styles.filterChipCountActive]}>
              {contacts.length}
            </Text>
          </TouchableOpacity>

          {/* One chip per category that has at least one person */}
          {allCategories
            .filter((cat) => countFor(cat) > 0)
            .map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              >
                <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
                  {cat}
                </Text>
                <Text style={[styles.filterChipCount, selectedCategory === cat && styles.filterChipCountActive]}>
                  {countFor(cat)}
                </Text>
              </TouchableOpacity>
            ))}

          {/* Uncategorized chip — only if there are some */}
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

      {/* Contact list */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.textTertiary} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            contacts.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Your circles are empty</Text>
                <Text style={styles.emptyBody}>Add the people you want to stay close with.</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/contact/add')}>
                  <Text style={styles.emptyBtnText}>Add someone</Text>
                </TouchableOpacity>
              </View>
            ) : query.trim() ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No results</Text>
                <Text style={styles.emptyBody}>Nobody matches "{query}".</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nobody here</Text>
                <Text style={styles.emptyBody}>No one in this category yet.</Text>
              </View>
            )
          ) : null
        }
      />
      </PageContainer>
    </SafeAreaView>
  );
}

function ContactRow({
  contact, onPress, colors, styles,
}: {
  contact: ContactWithMeta;
  onPress: () => void;
  colors: ColorScheme;
  styles: ReturnType<typeof makeStyles>;
}) {
  const statusColor = contact.is_overdue ? colors.overdue : colors.ok;
  const statusBg = contact.is_overdue ? colors.overdueLight : colors.okLight;
  const daysLabel = contact.days_since_contact === null
    ? 'Never'
    : contact.days_since_contact === 0
      ? 'Today'
      : `${contact.days_since_contact}d ago`;

  const subtitle = contact.category
    ? `${contact.category} · ${frequencyLabel(contact.reminder_frequency)}`
    : frequencyLabel(contact.reminder_frequency);

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
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
      </View>
      <View style={[styles.badge, { backgroundColor: statusBg }]}>
        <Text style={[styles.badgeText, { color: statusColor }]}>{daysLabel}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 16,
    },
    titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
    title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
    version: { fontSize: 11, color: colors.textTertiary, fontWeight: '400' },
    addBtn: {
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
    },
    addBtnText: { color: colors.text, fontSize: 32, lineHeight: 36, fontWeight: '300' },

    // Search
    searchWrap: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
    searchInput: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
      fontSize: 15, color: colors.text,
    },

    // Filter bar
    filterBar: { flexGrow: 0, marginBottom: 4 },
    filterBarContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderWidth: 1, borderColor: colors.border, borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 6,
      backgroundColor: colors.surface,
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

    list: { paddingBottom: 32 },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: colors.background,
    },
    rowPressed: { backgroundColor: colors.surfaceAlt },
    avatarWrap: { marginRight: 12 },
    rowMeta: { flex: 1 },
    rowName: { fontSize: 16, fontWeight: '500', color: colors.text },
    rowSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    badgeText: { fontSize: 12, fontWeight: '600' },
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
