import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, SafeAreaView, Pressable, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/lib/colors';
import { useContacts } from '@/hooks/useContacts';
import { useCategories } from '@/hooks/useCategories';
import { ContactWithMeta } from '@/lib/types';
import { frequencyLabel } from '@/lib/frequencies';
import { ContactAvatar } from '@/components/ContactAvatar';

export default function PeopleScreen() {
  const router = useRouter();
  const { contacts, loading, refresh } = useContacts();
  const { allCategories, refresh: refreshCategories } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    refresh();
    refreshCategories();
  }, []));

  // Filter by selected category; null = show all
  const filtered = selectedCategory
    ? contacts.filter((c) => c.category === selectedCategory)
    : contacts;

  const renderItem = useCallback(({ item }: { item: ContactWithMeta }) => (
    <ContactRow contact={item} onPress={() => router.push(`/contact/${item.id}`)} />
  ), [router]);

  // Count per category for the chips
  const countFor = (cat: string) => contacts.filter((c) => c.category === cat).length;
  const uncategorizedCount = contacts.filter((c) => !c.category).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Circles</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/contact/add')}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

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
        data={selectedCategory === '__none__'
          ? contacts.filter((c) => !c.category)
          : filtered}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={Colors.textTertiary} />}
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
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>Nobody here</Text>
                <Text style={styles.emptyBody}>No one in this category yet.</Text>
              </View>
            )
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ContactRow({ contact, onPress }: { contact: ContactWithMeta; onPress: () => void }) {
  const statusColor = contact.is_overdue ? Colors.overdue : Colors.ok;
  const statusBg = contact.is_overdue ? Colors.overdueLight : Colors.okLight;
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.text, alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 28, fontWeight: '300' },

  // Filter bar
  filterBar: { flexGrow: 0, marginBottom: 4 },
  filterBarContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  filterChipText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  filterChipCount: {
    fontSize: 11, fontWeight: '700', color: Colors.textTertiary,
    backgroundColor: Colors.surfaceAlt, borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden',
  },
  filterChipCountActive: { color: 'rgba(255,255,255,0.75)', backgroundColor: 'rgba(255,255,255,0.2)' },

  list: { paddingBottom: 32 },
  separator: { height: 1, backgroundColor: Colors.border, marginLeft: 72 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: Colors.background,
  },
  rowPressed: { backgroundColor: Colors.surfaceAlt },
  avatarWrap: { marginRight: 12 },
  rowMeta: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '500', color: Colors.text },
  rowSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  emptyBody: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 24, backgroundColor: Colors.text,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
