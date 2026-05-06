import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  SafeAreaView, Pressable,
} from 'react-native';
import { Colors } from '@/lib/colors';
import { useCategories } from '@/hooks/useCategories';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CategoryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { allCategories } = useCategories();

  function handleSelect(cat: string | null) {
    onChange(cat);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ?? 'None'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Category</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={[null, ...allCategories]}
            keyExtractor={(item) => item ?? '__none__'}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.optionText}>{item ?? 'None'}</Text>
                {item === value && <Text style={styles.check}>✓</Text>}
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  triggerText: { fontSize: 16, color: Colors.text },
  triggerPlaceholder: { color: Colors.textTertiary },
  chevron: { fontSize: 20, color: Colors.textTertiary },

  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  modalDone: { fontSize: 17, fontWeight: '600', color: Colors.text },

  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  optionPressed: { backgroundColor: Colors.surfaceAlt },
  optionText: { fontSize: 16, color: Colors.text },
  check: { fontSize: 17, color: Colors.text },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20 },
});
