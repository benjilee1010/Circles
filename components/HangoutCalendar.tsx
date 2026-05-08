import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, Alert, Platform,
} from 'react-native';
import { format, startOfWeek, addDays, addWeeks, isFuture, differenceInDays } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { ColorScheme } from '@/lib/colors';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const NUM_WEEKS = 12;

interface Props {
  hungOutDates: Set<string>;
  keptInTouchDates: Set<string>;
  onDayPress: (date: string, type: 'hung_out' | 'kept_in_touch') => void;
  contactName?: string;
  lastContactedAt?: string | null;
}

export function HangoutCalendar({ hungOutDates, keptInTouchDates, onDayPress, contactName, lastContactedAt }: Props) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [weekOffset, setWeekOffset] = useState(0);
  // web only: which date has the inline picker open
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const today = new Date();
  const weekStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = format(weekStart, 'MMM d') + ' – ' + format(addDays(weekStart, 6), 'MMM d, yyyy');

  // "Last seen" banner
  let lastSeenText: string | null = null;
  if (contactName) {
    if (!lastContactedAt) {
      lastSeenText = `You haven't logged any time with ${contactName} yet.`;
    } else {
      const days = differenceInDays(today, new Date(lastContactedAt + 'T12:00:00'));
      if (days === 0)      lastSeenText = `You last saw ${contactName} today.`;
      else if (days === 1) lastSeenText = `It's been 1 day since you last saw ${contactName}.`;
      else                 lastSeenText = `It's been ${days} days since you last saw ${contactName}.`;
    }
  }

  function handleDayTap(dateStr: string) {
    const isHungOut = hungOutDates.has(dateStr);
    const isKeptInTouch = keptInTouchDates.has(dateStr);
    const isLogged = isHungOut || isKeptInTouch;
    const label = format(new Date(dateStr + 'T12:00:00'), 'MMMM d');

    if (Platform.OS !== 'web') {
      // Native: use Alert sheet
      if (isLogged) {
        const type = isHungOut ? 'hung_out' : 'kept_in_touch';
        const typeLabel = isHungOut ? 'hangout' : 'check-in';
        Alert.alert('Remove log', `Remove this ${typeLabel} on ${label}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => onDayPress(dateStr, type) },
        ]);
      } else {
        Alert.alert(label, 'How did you connect?', [
          { text: 'Hung out', onPress: () => onDayPress(dateStr, 'hung_out') },
          { text: 'Kept in touch', onPress: () => onDayPress(dateStr, 'kept_in_touch') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    } else {
      // Web: toggle inline picker
      setPendingDate(pendingDate === dateStr ? null : dateStr);
    }
  }

  const pendingIsHungOut  = pendingDate ? hungOutDates.has(pendingDate) : false;
  const pendingIsKeptInTouch = pendingDate ? keptInTouchDates.has(pendingDate) : false;
  const pendingIsLogged   = pendingIsHungOut || pendingIsKeptInTouch;
  const pendingLabel      = pendingDate ? format(new Date(pendingDate + 'T12:00:00'), 'MMMM d') : '';

  function handleChoose(type: 'hung_out' | 'kept_in_touch') {
    if (pendingDate) { onDayPress(pendingDate, type); setPendingDate(null); }
  }
  function handleRemove() {
    if (!pendingDate) return;
    onDayPress(pendingDate, pendingIsHungOut ? 'hung_out' : 'kept_in_touch');
    setPendingDate(null);
  }

  return (
    <View style={styles.container}>
      {/* Last-seen banner */}
      {lastSeenText && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{lastSeenText}</Text>
        </View>
      )}

      {/* Week navigator */}
      <View style={styles.nav}>
        <TouchableOpacity onPress={() => setWeekOffset((o) => o - 1)} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>{weekLabel}</Text>
        <TouchableOpacity
          onPress={() => setWeekOffset((o) => o + 1)}
          style={styles.navBtn}
          disabled={weekOffset >= 0}
        >
          <Text style={[styles.navArrow, weekOffset >= 0 && styles.navArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Inline web picker — appears between nav and day grid */}
      {Platform.OS === 'web' && pendingDate !== null && (
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>{pendingLabel}</Text>
          {pendingIsLogged ? (
            <View style={styles.pickerRow}>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnDestructive]} onPress={handleRemove}>
                <Text style={styles.pickerBtnDestructiveText}>
                  Remove {pendingIsHungOut ? 'hung out' : 'kept in touch'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnCancel]} onPress={() => setPendingDate(null)}>
                <Text style={styles.pickerBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerRow}>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnGreen]} onPress={() => handleChoose('hung_out')}>
                <Text style={styles.pickerBtnGreenText}>Hung out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnDark]} onPress={() => handleChoose('kept_in_touch')}>
                <Text style={styles.pickerBtnDarkText}>Kept in touch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerBtn, styles.pickerBtnCancel]} onPress={() => setPendingDate(null)}>
                <Text style={styles.pickerBtnCancelText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Day headers */}
      <View style={styles.dayHeaders}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={styles.dayRow}>
        {weekDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isHungOut = hungOutDates.has(dateStr);
          const isKeptInTouch = keptInTouchDates.has(dateStr);
          const isLogged = isHungOut || isKeptInTouch;
          const isToday = dateStr === format(today, 'yyyy-MM-dd');
          const future = isFuture(day) && !isToday;
          const isPending = dateStr === pendingDate;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                isHungOut && styles.dayCellHungOut,
                isKeptInTouch && !isHungOut && styles.dayCellKeptInTouch,
                isToday && !isLogged && styles.dayCellToday,
                isPending && styles.dayCellPending,
              ]}
              onPress={() => { if (!future) handleDayTap(dateStr); }}
              disabled={future}
            >
              <Text style={[
                styles.dayNum,
                isHungOut && styles.dayNumHungOut,
                isKeptInTouch && !isHungOut && styles.dayNumKeptInTouch,
                future && styles.dayNumFuture,
              ]}>
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Past weeks history */}
      <ScrollView contentContainerStyle={styles.historyScroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.historyLabel}>Past weeks</Text>

        <View style={styles.historyRow}>
          <View style={{ width: 46 }} />
          <View style={styles.historyDots}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.historyDayHeader}>{d}</Text>
            ))}
          </View>
        </View>

        {Array.from({ length: NUM_WEEKS }, (_, wi) => {
          const wStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), -(wi + 1));
          const days = Array.from({ length: 7 }, (_, di) => addDays(wStart, di));
          return (
            <View key={wi} style={styles.historyRow}>
              <Text style={styles.historyWeek}>{format(wStart, 'MMM d')}</Text>
              <View style={styles.historyDots}>
                {days.map((d, di) => {
                  const ds = format(d, 'yyyy-MM-dd');
                  const isHungOut = hungOutDates.has(ds);
                  const isKeptInTouch = keptInTouchDates.has(ds);
                  const logged = isHungOut || isKeptInTouch;
                  const isPending = ds === pendingDate;
                  return (
                    <TouchableOpacity
                      key={di}
                      style={styles.dotWrap}
                      onPress={() => handleDayTap(ds)}
                    >
                      <View style={[
                        styles.dot,
                        isHungOut && styles.dotHungOut,
                        isKeptInTouch && !isHungOut && styles.dotKeptInTouch,
                        isPending && styles.dotPending,
                      ]}>
                        <Text style={[styles.dotNum, isHungOut && styles.dotNumHungOut, isKeptInTouch && !isHungOut && styles.dotNumKeptInTouch]}>
                          {format(d, 'd')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ColorScheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    banner: {
      marginHorizontal: 16, marginTop: 12, marginBottom: 4,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    },
    bannerText: {
      fontSize: 13, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 18,
    },

    nav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 12,
    },
    navBtn: { padding: 8 },
    navArrow: { fontSize: 24, color: colors.text, fontWeight: '300' },
    navArrowDisabled: { color: colors.textTertiary },
    weekLabel: { fontSize: 14, fontWeight: '600', color: colors.text },

    // Inline picker card (web)
    pickerCard: {
      marginHorizontal: 16, marginBottom: 10,
      backgroundColor: colors.surface,
      borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      padding: 12, gap: 8,
    },
    pickerTitle: {
      fontSize: 13, fontWeight: '600', color: colors.textSecondary,
      textAlign: 'center',
    },
    pickerRow: { flexDirection: 'row', gap: 8 },
    pickerBtn: { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    pickerBtnGreen: { backgroundColor: colors.ok },
    pickerBtnGreenText: { fontSize: 14, fontWeight: '600', color: colors.background },
    pickerBtnDark: { backgroundColor: colors.text },
    pickerBtnDarkText: { fontSize: 14, fontWeight: '600', color: colors.background },
    pickerBtnCancel: { backgroundColor: colors.surfaceAlt, flex: 0, paddingHorizontal: 14 },
    pickerBtnCancelText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    pickerBtnDestructive: { backgroundColor: colors.surfaceAlt },
    pickerBtnDestructiveText: { fontSize: 14, fontWeight: '600', color: colors.overdue },

    dayHeaders: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
    dayHeader: {
      flex: 1, textAlign: 'center', fontSize: 12,
      fontWeight: '600', color: colors.textTertiary, letterSpacing: 0.5,
    },

    dayRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
    dayCell: {
      flex: 1, aspectRatio: 1, borderRadius: 10, margin: 3,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surfaceAlt,
    },
    dayCellHungOut: { backgroundColor: colors.ok },
    dayCellKeptInTouch: { backgroundColor: colors.text },
    dayCellToday: { borderWidth: 1.5, borderColor: colors.text, backgroundColor: colors.surfaceAlt },
    dayCellPending: { borderWidth: 2, borderColor: colors.accentDark },
    dayNum: { fontSize: 15, fontWeight: '500', color: colors.text },
    // Hung out: white on green works in both light and dark mode
    dayNumHungOut: { color: '#FFFFFF', fontWeight: '700' },
    // Kept in touch: background color inverts correctly against colors.text cell
    dayNumKeptInTouch: { color: colors.background, fontWeight: '700' },
    dayNumFuture: { color: colors.textTertiary },

    historyScroll: { paddingHorizontal: 16, paddingBottom: 32 },
    historyLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textTertiary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
    },
    historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    historyWeek: { fontSize: 11, color: colors.textSecondary, width: 46 },
    historyDayHeader: {
      flex: 1, textAlign: 'center', fontSize: 10,
      fontWeight: '600', color: colors.textTertiary,
    },
    historyDots: { flex: 1, flexDirection: 'row' },
    dotWrap: { flex: 1, alignItems: 'center', paddingVertical: 3 },
    dot: {
      width: '80%' as any, aspectRatio: 1, borderRadius: 5,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center', justifyContent: 'center',
    },
    dotHungOut: { backgroundColor: colors.ok },
    dotKeptInTouch: { backgroundColor: colors.text },
    dotPending: { borderWidth: 2, borderColor: colors.accentDark },
    dotNum: { fontSize: 9, fontWeight: '500', color: colors.textSecondary },
    dotNumHungOut: { color: '#FFFFFF', fontWeight: '700' },
    dotNumKeptInTouch: { color: colors.background, fontWeight: '700' },
  });
}
