import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { format, startOfWeek, addDays, addWeeks, isFuture, differenceInDays } from 'date-fns';
import { Colors } from '@/lib/colors';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const NUM_WEEKS = 12;

interface Props {
  loggedDates: Set<string>;
  onDayPress: (date: string) => void;
  contactName?: string;
  lastContactedAt?: string | null;
}

export function HangoutCalendar({ loggedDates, onDayPress, contactName, lastContactedAt }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
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
      const days = differenceInDays(today, new Date(lastContactedAt));
      if (days === 0)      lastSeenText = `You last saw ${contactName} today.`;
      else if (days === 1) lastSeenText = `It's been 1 day since you last saw ${contactName}.`;
      else                 lastSeenText = `It's been ${days} days since you last saw ${contactName}.`;
    }
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

      {/* Day headers — top section only */}
      <View style={styles.dayHeaders}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Day cells */}
      <View style={styles.dayRow}>
        {weekDays.map((day, i) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isLogged = loggedDates.has(dateStr);
          const isToday = dateStr === format(today, 'yyyy-MM-dd');
          const future = isFuture(day) && !isToday;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.dayCell,
                isLogged && styles.dayCellLogged,
                isToday && !isLogged && styles.dayCellToday,
              ]}
              onPress={() => !future && onDayPress(dateStr)}
              disabled={future}
            >
              <Text style={[
                styles.dayNum,
                isLogged && styles.dayNumLogged,
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

        {Array.from({ length: NUM_WEEKS }, (_, wi) => {
          const wStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), -(wi + 1));
          const days = Array.from({ length: 7 }, (_, di) => addDays(wStart, di));
          return (
            <View key={wi} style={styles.historyRow}>
              <Text style={styles.historyWeek}>{format(wStart, 'MMM d')}</Text>
              {/* flex:1 row so dots fill the remaining width evenly */}
              <View style={styles.historyDots}>
                {days.map((d, di) => {
                  const ds = format(d, 'yyyy-MM-dd');
                  const logged = loggedDates.has(ds);
                  return (
                    <TouchableOpacity key={di} style={styles.dotWrap} onPress={() => onDayPress(ds)}>
                      <View style={[styles.dot, logged && styles.dotLogged]} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  banner: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  bannerText: {
    fontSize: 13, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 18,
  },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, color: Colors.text, fontWeight: '300' },
  navArrowDisabled: { color: Colors.textTertiary },
  weekLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },

  dayHeaders: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 },
  dayHeader: {
    flex: 1, textAlign: 'center', fontSize: 12,
    fontWeight: '600', color: Colors.textTertiary, letterSpacing: 0.5,
  },

  dayRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  dayCell: {
    flex: 1, aspectRatio: 1, borderRadius: 10, margin: 3,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  dayCellLogged: { backgroundColor: Colors.text },
  dayCellToday: { borderWidth: 1.5, borderColor: Colors.text, backgroundColor: Colors.surfaceAlt },
  dayNum: { fontSize: 15, fontWeight: '500', color: Colors.text },
  dayNumLogged: { color: '#fff', fontWeight: '700' },
  dayNumFuture: { color: Colors.textTertiary },

  historyScroll: { paddingHorizontal: 16, paddingBottom: 32 },
  historyLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textTertiary,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  historyWeek: { fontSize: 11, color: Colors.textSecondary, width: 46 },
  // flex: 1 + each dotWrap flex: 1 → dots spread edge-to-edge
  historyDots: { flex: 1, flexDirection: 'row' },
  dotWrap: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dot: {
    width: '80%' as any, aspectRatio: 1, borderRadius: 5,
    backgroundColor: Colors.surfaceAlt,
  },
  dotLogged: { backgroundColor: Colors.text },
});
