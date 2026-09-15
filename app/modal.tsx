import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildEntry, EntryStorage, type Entry } from '@/lib/entries';
import { colors } from '@/lib/theme';

const CATEGORY_OPTIONS = [
  { id: 'signal', label: 'Signal' },
  { id: 'noise', label: 'Noise' },
  { id: 'neutral', label: 'Neutral' },
] as const;

export default function ModalScreen() {
  const router = useRouter();
  const { blockId } = useLocalSearchParams<{ blockId?: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<typeof CATEGORY_OPTIONS[number]['id']>('signal');

  useEffect(() => {
    let isActive = true;
    const loadEntry = async () => {
      if (!blockId) return;
      const loaded = await EntryStorage.get(blockId);
      if (!isActive) return;
      setEntry(loaded);
      if (loaded) {
        setDescription(loaded.description);
        setCategory(loaded.category ?? 'signal');
      }
    };
    loadEntry();
    return () => {
      isActive = false;
    };
  }, [blockId]);

  const blockLabel = useMemo(() => {
    if (!blockId) return 'Log block';
    const start = new Date(blockId);
    const end = new Date(start.getTime() + 15 * 60 * 1000);
    return `${start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })} – ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }, [blockId]);

  const handleSave = async () => {
    if (!blockId || !description.trim()) return;
    const entryToSave = buildEntry({
      blockId,
      description: description.trim(),
      category,
    });
    await EntryStorage.upsert(entryToSave);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{blockLabel}</Text>
        <Text style={styles.subtitle}>Describe the last 15 minutes.</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What did you do?"
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
        autoFocus
      />

      <View style={styles.toggleRow}>
        {CATEGORY_OPTIONS.map((option) => {
          const isActive = category === option.id;
          return (
            <Pressable
              key={option.id}
              style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
              onPress={() => setCategory(option.id)}>
              <Text style={[styles.toggleText, isActive && styles.toggleTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        style={[styles.saveButton, !description.trim() && styles.saveButtonDisabled]}
        onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Block</Text>
      </Pressable>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
  input: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleRow: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  toggleButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  toggleText: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#111111',
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.signal,
  },
  saveButtonDisabled: {
    backgroundColor: colors.empty,
  },
  saveButtonText: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
