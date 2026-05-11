import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  SafeAreaView, Pressable, Platform, TextInput,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';
import { useCategories } from '@/hooks/useCategories';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function CategoryPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState('');
  const { allCategories, refresh } = useCategories();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const isWeb = Platform.OS === 'web';

  function handleSelect(cat: string | null) {
    onChange(cat);
    setOpen(false);
    setCustomMode(false);
    setCustomText('');
  }

  function handleCustomSubmit() {
    const trimmed = customText.trim();
    if (!trimmed) return;
    onChange(trimmed);
    refresh();
    setOpen(false);
    setCustomMode(false);
    setCustomText('');
  }

  function handleClose() {
    setOpen(false);
    setCustomMode(false);
    setCustomText('');
  }

  const items: (string | null)[] = [null, ...allCategories];

  const customRow = (
    <View>
      <View style={styles.sep} />
      {customMode ? (
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            placeholder="Category name…"
            placeholderTextColor={colors.textTertiary}
            value={customText}
            onChangeText={setCustomText}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCustomSubmit}
          />
          <TouchableOpacity style={styles.customAddBtn} onPress={handleCustomSubmit}>
            <Text style={styles.customAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Pressable
          style={({ pressed }: any) => [styles.option, pressed && styles.optionPressed]}
          onPress={() => setCustomMode(true)}
        >
          <Text style={[styles.optionText, { color: colors.textSecondary }]}>＋ New category…</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value ?? 'None'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        animationType={isWeb ? 'fade' : 'slide'}
        presentationStyle={isWeb ? 'overFullScreen' : 'pageSheet'}
        transparent={isWeb}
      >
        {isWeb ? (
          <Pressable style={styles.overlay} onPress={handleClose}>
            <Pressable style={styles.popup} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Category</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              {items.map((item, index) => (
                <View key={item ?? '__none__'}>
                  {index > 0 && <View style={styles.sep} />}
                  <Pressable
                    style={({ pressed }: any) => [styles.option, pressed && styles.optionPressed]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.optionText}>{item ?? 'None'}</Text>
                    {item === value && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                </View>
              ))}
              {customRow}
            </Pressable>
          </Pressable>
        ) : (
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Category</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={styles.modalDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => item ?? '__none__'}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }: any) => [styles.option, pressed && styles.optionPressed]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.optionText}>{item ?? 'None'}</Text>
                  {item === value && <Text style={styles.check}>✓</Text>}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              ListFooterComponent={customRow}
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
    triggerPlaceholder: { color: colors.textTertiary },
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
    modalDone:  { fontSize: 17, fontWeight: '600', color: colors.text },

    option: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
    },
    optionPressed: { backgroundColor: colors.surfaceAlt },
    optionText: { fontSize: 16, color: colors.text },
    check: { fontSize: 17, color: colors.text },
    sep: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },

    customInputRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingVertical: 12,
    },
    customInput: {
      flex: 1, fontSize: 16, color: colors.text,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    },
    customAddBtn: {
      backgroundColor: colors.text, borderRadius: 10,
      paddingHorizontal: 16, paddingVertical: 9,
    },
    customAddBtnText: { fontSize: 15, fontWeight: '600', color: colors.background },
  });
}
