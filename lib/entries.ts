import { Storage } from './storage';

export type EntryCategory = 'signal' | 'noise' | 'neutral';

export type Entry = {
  id: string;
  startAt: string;
  endAt: string;
  description: string;
  category: EntryCategory | null;
  createdAt: string;
  updatedAt: string;
};

export type EntryMap = Record<string, Entry>;

const ENTRY_STORAGE_KEY = 'signal.entries.v1';
const BLOCK_MINUTES = 15;

export const EntryStorage = {
  async getAll(): Promise<EntryMap> {
    const raw = await Storage.getString(ENTRY_STORAGE_KEY);
    if (!raw) return {};

    try {
      return JSON.parse(raw) as EntryMap;
    } catch {
      return {};
    }
  },

  async get(id: string): Promise<Entry | null> {
    const entries = await EntryStorage.getAll();
    return entries[id] ?? null;
  },

  async setAll(entries: EntryMap): Promise<void> {
    await Storage.setString(ENTRY_STORAGE_KEY, JSON.stringify(entries));
  },

  async upsert(entry: Entry): Promise<void> {
    const entries = await EntryStorage.getAll();
    entries[entry.id] = entry;
    await EntryStorage.setAll(entries);
  },

  async remove(id: string): Promise<void> {
    const entries = await EntryStorage.getAll();
    if (!entries[id]) return;
    delete entries[id];
    await EntryStorage.setAll(entries);
  },

  async clear(): Promise<void> {
    await Storage.delete(ENTRY_STORAGE_KEY);
  },
};

export const buildEntry = ({
  blockId,
  description,
  category,
}: {
  blockId: string;
  description: string;
  category: EntryCategory;
}): Entry => {
  const start = new Date(blockId);
  const end = new Date(start.getTime() + BLOCK_MINUTES * 60 * 1000);
  const now = new Date().toISOString();

  return {
    id: blockId,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    description,
    category,
    createdAt: now,
    updatedAt: now,
  };
};
