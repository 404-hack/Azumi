import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export const StorageKeys = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  REMEMBER_ME: "remember_me",
  LAST_PHONE: "last_phone",
} as const;

export const secureStorage = {
  // String methods
  setString: (key: string, value: string) => {
    storage.set(key, value);
  },

  getString: (key: string) => {
    return storage.getString(key);
  },

  // Object methods
  setObject: (key: string, value: object) => {
    storage.set(key, JSON.stringify(value));
  },

  getObject: <T = any>(key: string): T | null => {
    const value = storage.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  // Boolean methods
  setBoolean: (key: string, value: boolean) => {
    storage.set(key, value);
  },

  getBoolean: (key: string) => {
    return storage.getBoolean(key) ?? false;
  },

  // Delete methods
  delete: (key: string) => {
    storage.delete(key);
  },

  // Clear all
  clear: () => {
    storage.clearAll();
  },

  // Check if key exists
  contains: (key: string) => {
    return storage.contains(key);
  },
};

// Auth specific methods
export const authStorage = {
  saveToken: (token: string) => {
    secureStorage.setString(StorageKeys.AUTH_TOKEN, token);
  },

  getToken: () => {
    return secureStorage.getString(StorageKeys.AUTH_TOKEN);
  },

  saveUserData: (userData: any) => {
    secureStorage.setObject(StorageKeys.USER_DATA, userData);
  },

  getUserData: () => {
    return secureStorage.getObject(StorageKeys.USER_DATA);
  },

  setRememberMe: (remember: boolean) => {
    secureStorage.setBoolean(StorageKeys.REMEMBER_ME, remember);
  },

  getRememberMe: () => {
    return secureStorage.getBoolean(StorageKeys.REMEMBER_ME);
  },

  saveLastPhone: (phone: string) => {
    secureStorage.setString(StorageKeys.LAST_PHONE, phone);
  },

  getLastPhone: () => {
    return secureStorage.getString(StorageKeys.LAST_PHONE);
  },

  clearAuth: () => {
    secureStorage.delete(StorageKeys.AUTH_TOKEN);
    secureStorage.delete(StorageKeys.USER_DATA);
  },

  isLoggedIn: () => {
    return secureStorage.contains(StorageKeys.AUTH_TOKEN);
  },
};

export default secureStorage;
