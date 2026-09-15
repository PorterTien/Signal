import * as Notifications from 'expo-notifications';
import type { EntryMap } from './entries';
import { buildBlocks } from './day';
import { Storage } from './storage';
const NOTIFICATION_IDS_KEY = 'signal.notificationIds.v1';
const BLOCK_MINUTES = 15;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return settings;
  }
  return Notifications.requestPermissionsAsync();
};

const storeNotificationIds = async (ids: string[]) => {
  await Storage.setString(NOTIFICATION_IDS_KEY, JSON.stringify(ids));
};

export const cancelScheduledNotifications = async () => {
  try {
    const raw = await Storage.getString(NOTIFICATION_IDS_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  } finally {
    await storeNotificationIds([]);
  }
};

export const scheduleDailyNotifications = async (dayStart: Date) => {
  await cancelScheduledNotifications();

  const ids: string[] = [];
  const startMs = dayStart.getTime();
  const end = new Date(dayStart);
  end.setHours(23, 59, 59, 999);
  const endMs = end.getTime();
  const interval = BLOCK_MINUTES * 60 * 1000;

  for (let time = startMs + interval; time <= endMs; time += interval) {
    const triggerDate = new Date(time);
    if (triggerDate <= new Date()) continue;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Signal check-in',
        body: 'Log the last 15 minutes.',
        data: { type: 'block' },
      },
      trigger: { type: 'date', date: triggerDate },
    });
    ids.push(id);
  }

  await storeNotificationIds(ids);
  return ids;
};

export const getMostRecentEmptyBlockId = ({
  entries,
  dayStart,
  now = new Date(),
}: {
  entries: EntryMap;
  dayStart: Date;
  now?: Date;
}) => {
  const blocks = buildBlocks(dayStart, now);
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (!entries[block.id]) {
      return block.id;
    }
  }
  return blocks[blocks.length - 1]?.id ?? null;
};
