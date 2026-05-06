import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  SafeAreaView, Pressable,
} from 'react-native';
import { Colors } from '@/lib/colors';
import { FREQUENCY_OPTIONS } from '@/lib/frequencies';
import { ReminderFrequency } from '@/lib/types';

interface Props {
  value: ReminderFrequency;
  onChange: (value: ReminderFrequency) => void;
}

export function FrequencyPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const label = FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{label}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Reminder frequency</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={FREQUENCY_OPTIONS}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => { onChange(item.value); setOpen(false); }}
              >
                <Text style={styles.optionText}>{item.label}</Text>
                {item.value === value && <Text style={styles.check}>✓</Text>}
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
