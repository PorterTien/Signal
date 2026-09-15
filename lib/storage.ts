import * as SecureStore from 'expo-secure-store';

export const Storage = {
  getString: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setString: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore storage errors to keep UI responsive.
    }
  },
  delete: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Ignore storage errors to keep UI responsive.
    }
  },
};
