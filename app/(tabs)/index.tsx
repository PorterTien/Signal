import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { EntryCategory, EntryMap } from '@/lib/entries';
import { EntryStorage } from '@/lib/entries';
import { buildBlocks, getDayStart, roundToQuarterHour, setDayStart } from '@/lib/day';
import {
  getMostRecentEmptyBlockId,
  requestNotificationPermissions,
  scheduleDailyNotifications,
} from '@/lib/notifications';
import { colors } from '@/lib/theme';

type TimelineBlock = ReturnType<typeof buildBlocks>[number] & {
  entryId: string | null;
};

const BLOCK_HEIGHT = 76;
const BLOCK_GAP = 12;

const CATEGORY_BG: Record<EntryCategory, string> = {
  signal: 'bg-signal',
  noise: 'bg-noise',
  neutral: 'bg-neutral',
};

const CATEGORY_TEXT: Record<EntryCategory, string> = {
  signal: 'text-white',
  noise: 'text-white',
  neutral: 'text-black',
};

const formatTime = (value: Date) =>
  value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

export default function TabOneScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<EntryMap>({});
  const [dayStart, setDayStartState] = useState<Date | null>(null);

  const refreshEntries = useCallback(async () => {
    const [loadedEntries, loadedDayStart] = await Promise.all([
      EntryStorage.getAll(),
      getDayStart(),
    ]);
    setEntries(loadedEntries);
    setDayStartState(loadedDayStart);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const load = async () => {
        await refreshEntries();
      };
      if (isActive) {
        load();
      }
      return () => {
        isActive = false;
      };
    }, [refreshEntries]),
  );

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      const handleResponse = async () => {
        const currentDayStart = await getDayStart();
        if (!currentDayStart) return;
        const latestEmpty = getMostRecentEmptyBlockId({
          entries: await EntryStorage.getAll(),
          dayStart: currentDayStart,
        });
        if (latestEmpty) {
          router.push({ pathname: '/modal', params: { blockId: latestEmpty } });
        }
      };
      handleResponse();
    });

    return () => subscription.remove();
  }, [router]);

  const blocks = useMemo(() => {
    if (!dayStart) return [];
    return buildBlocks(dayStart, new Date()).map((block) => ({
      ...block,
      entryId: entries[block.id]?.id ?? null,
    }));
  }, [dayStart, entries]);

  const stats = useMemo(() => {
    const counts = { signal: 0, noise: 0, neutral: 0 };
    blocks.forEach((block) => {
      const entry = block.entryId ? entries[block.id] : null;
      if (!entry || !entry.category) return;
      counts[entry.category] += 1;
    });
    const filled = counts.signal + counts.noise + counts.neutral;
    const ratio = filled ? Math.round((counts.signal / filled) * 100) : 0;
    return { ...counts, filled, ratio };
  }, [blocks, entries]);

  const handleStartDay = useCallback(async () => {
    const now = roundToQuarterHour(new Date());
    await setDayStart(now);
    setDayStartState(now);
    await refreshEntries();
    await requestNotificationPermissions();
    await scheduleDailyNotifications(now);
  }, [refreshEntries]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Signal</Text>
        <View style={styles.metaRow}>
          <View style={styles.signalPill}>
            <Text style={styles.signalPillText}>{stats.ratio}% Signal</Text>
          </View>
          <Text style={styles.metaText}>Today • {stats.filled} logged</Text>
        </View>
        <Pressable style={styles.startButton} onPress={handleStartDay}>
          <Text style={styles.startButtonText}>Start Day</Text>
        </Pressable>
      </View>

      {dayStart ? (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const entry = item.entryId ? entries[item.id] : null;

            if (!entry) {
              return (
                <Pressable
                  style={styles.emptyCard}
                  onPress={() => router.push({ pathname: '/modal', params: { blockId: item.id } })}>
                  <Text style={styles.timeMuted}>
                    {formatTime(item.startAt)} – {formatTime(item.endAt)}
                  </Text>
                  <Text style={styles.emptyText}>Empty block</Text>
                </Pressable>
              );
            }

            const category = entry.category ?? 'neutral';
            const cardStyle = [styles.card, stylesByCategory[category]];
            const textStyle = [styles.cardText, textByCategory[category]];

            return (
              <Pressable
                style={cardStyle}
                onPress={() => router.push({ pathname: '/modal', params: { blockId: item.id } })}>
                <Text style={[styles.cardTime, textStyle]}>
                  {formatTime(item.startAt)} – {formatTime(item.endAt)}
                </Text>
                <Text style={[styles.cardTitle, textStyle]}>{entry.description}</Text>
              </Pressable>
            );
          }}
          getItemLayout={(_, index) => ({
            length: BLOCK_HEIGHT + BLOCK_GAP,
            offset: (BLOCK_HEIGHT + BLOCK_GAP) * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Start your day</Text>
          <Text style={styles.emptyStateBody}>
            Tap “Start Day” to begin tracking 15-minute blocks.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const stylesByCategory = StyleSheet.create({
  signal: { backgroundColor: colors.signal },
  noise: { backgroundColor: colors.noise },
  neutral: { backgroundColor: colors.neutral },
});

const textByCategory = StyleSheet.create({
  signal: { color: colors.textPrimary },
  noise: { color: colors.textPrimary },
  neutral: { color: '#111111' },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.midnight,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(252, 76, 2, 0.15)',
    borderRadius: 999,
  },
  signalPillText: {
    color: colors.signal,
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  startButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: colors.signal,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  startButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: BLOCK_GAP,
  },
  card: {
    height: 76,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardTime: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    opacity: 0.85,
  },
  cardTitle: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  cardText: {
    color: colors.textPrimary,
  },
  emptyCard: {
    height: 76,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.empty,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
  },
  timeMuted: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    color: colors.textMuted,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 16,
    color: colors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyStateBody: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
  },
});
