import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  SafeAreaView, Pressable, Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { FREQUENCY_OPTIONS } from '@/lib/frequencies';
import { ReminderFrequency } from '@/lib/types';

interface Props {
  value: ReminderFrequency;
  onChange: (value: ReminderFrequency) => void;
}

export function FrequencyPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const isWeb = Platform.OS === 'web';
  const label = FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value;

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.triggerText}>{label}</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType={isWeb ? 'fade' : 'slide'}
        presentationStyle={isWeb ? 'overFullScreen' : 'pageSheet'}
        transparent={isWeb}
      >
        {isWeb ? (
          <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
            <Pressable style={styles.popup} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reminder frequency</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              {FREQUENCY_OPTIONS.map((item, index) => (
                <View key={item.value}>
                  {index > 0 && <View style={styles.sep} />}
                  <Pressable
                    style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                    onPress={() => { onChange(item.value); setOpen(false); }}
                  >
                    <Text style={styles.optionText}>{item.label}</Text>
                    {item.value === value && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                </View>
              ))}
            </Pressable>
          </Pressable>
        ) : (
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
        )}
      </Modal>
    </>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    trigger: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    },
    triggerText: { fontSize: 16, color: colors.text },
    chevron: { fontSize: 20, color: colors.textTertiary },

    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center', justifyContent: 'center',
    },
    popup: {
      backgroundColor: colors.background, borderRadius: 16,
      width: '100%', maxWidth: 400,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
    },

    modal: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    modalDone: { fontSize: 17, fontWeight: '600', color: colors.text },
    option: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
    },
    optionPressed: { backgroundColor: colors.surfaceAlt },
    optionText: { fontSize: 16, color: colors.text },
    check: { fontSize: 17, color: colors.text },
    sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
  });
}
