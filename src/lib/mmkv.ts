import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'app-storage' });

/**
 * MMKV-based storage adapter for redux-persist.
 * Drop-in replacement for AsyncStorage with synchronous I/O.
 */
export const mmkvStorage = {
  setItem: (key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};
