import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EntryMap } from '@/lib/entries';
import { EntryStorage } from '@/lib/entries';
import { buildBlocks, getDayStart } from '@/lib/day';
import { colors } from '@/lib/theme';
export default function TabTwoScreen() {
  const [entries, setEntries] = useState<EntryMap>({});
  const [dayStart, setDayStartState] = useState<Date | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        const [loadedEntries, loadedDayStart] = await Promise.all([
          EntryStorage.getAll(),
          getDayStart(),
        ]);
        if (!isActive) return;
        setEntries(loadedEntries);
        setDayStartState(loadedDayStart);
      };
      load();
      return () => {
        isActive = false;
      };
    }, []),
  );

  const stats = useMemo(() => {
    if (!dayStart) return { signal: 0, noise: 0, neutral: 0, ratio: 0 };
    const blocks = buildBlocks(dayStart, new Date());
    const counts = { signal: 0, noise: 0, neutral: 0 };

    blocks.forEach((block) => {
      const entry = entries[block.id];
      if (!entry || !entry.category) return;
      counts[entry.category] += 1;
    });

    const filled = counts.signal + counts.noise + counts.neutral;
    const ratio = filled ? Math.round((counts.signal / filled) * 100) : 0;
    return { ...counts, ratio };
  }, [dayStart, entries]);

  const total = stats.signal + stats.noise + stats.neutral || 1;
  const signalWidth = `${Math.round((stats.signal / total) * 100)}%`;
  const noiseWidth = `${Math.round((stats.noise / total) * 100)}%`;
  const neutralWidth = `${Math.round((stats.neutral / total) * 100)}%`;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <View style={styles.ratioPill}>
          <Text style={styles.ratioText}>{stats.ratio}% Signal</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <View style={styles.bar}>
          <View style={[styles.barSegment, styles.barSignal, { width: signalWidth }]} />
          <View style={[styles.barSegment, styles.barNoise, { width: noiseWidth }]} />
          <View style={[styles.barSegment, styles.barNeutral, { width: neutralWidth }]} />
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Signal: {stats.signal}</Text>
          <Text style={styles.legendText}>Noise: {stats.noise}</Text>
          <Text style={styles.legendText}>Neutral: {stats.neutral}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.midnight,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ratioPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(252, 76, 2, 0.15)',
  },
  ratioText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.signal,
  },
  card: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  bar: {
    height: 10,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  barSegment: {
    height: '100%',
  },
  barSignal: {
    backgroundColor: colors.signal,
  },
  barNoise: {
    backgroundColor: colors.noise,
  },
  barNeutral: {
    backgroundColor: colors.neutral,
  },
  legend: {
    marginTop: 12,
    gap: 6,
  },
  legendText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
