import { Storage } from './storage';

export type TimeBlock = {
  id: string;
  startAt: Date;
  endAt: Date;
};

const DAY_START_KEY = 'signal.dayStart.v1';
const BLOCK_MINUTES = 15;

export const toBlockId = (date: Date) => date.toISOString();

export const roundToQuarterHour = (date: Date) => {
  const ms = date.getTime();
  const interval = BLOCK_MINUTES * 60 * 1000;
  return new Date(Math.floor(ms / interval) * interval);
};

export const getDayStart = async (): Promise<Date | null> => {
  const raw = await Storage.getString(DAY_START_KEY);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const setDayStart = async (date: Date) => {
  await Storage.setString(DAY_START_KEY, date.toISOString());
};

export const clearDayStart = async () => {
  await Storage.delete(DAY_START_KEY);
};

export const buildBlocks = (start: Date, now: Date) => {
  const blocks: TimeBlock[] = [];
  const startMs = start.getTime();
  const endMs = now.getTime();
  const interval = BLOCK_MINUTES * 60 * 1000;
  const totalBlocks = Math.max(1, Math.ceil((endMs - startMs) / interval));

  for (let i = 0; i < totalBlocks; i += 1) {
    const blockStart = new Date(startMs + i * interval);
    const blockEnd = new Date(blockStart.getTime() + interval);
    blocks.push({ id: toBlockId(blockStart), startAt: blockStart, endAt: blockEnd });
  }

  return blocks;
};

export const getBlocksForToday = async (now = new Date()) => {
  const dayStart = await getDayStart();
  if (!dayStart) return [];
  return buildBlocks(dayStart, now);
};
