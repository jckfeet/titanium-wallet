/**
 * App preferences.
 *
 * Kept separate from the wallet store: these survive a wallet reset, and
 * nothing here is per-account.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_CURRENCY } from '@/data/currencies';
import { NetworkId } from '@/store/wallet';

/** Minutes of inactivity before the wallet locks. `0` means never. */
export type AutoLockMinutes = 0 | 1 | 5 | 15 | 60;

export const AUTO_LOCK_OPTIONS: readonly { value: AutoLockMinutes; label: string }[] = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'After 1 minute' },
  { value: 5, label: 'After 5 minutes' },
  { value: 15, label: 'After 15 minutes' },
  { value: 60, label: 'After 1 hour' },
];

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  network: NetworkId;
}

export interface ConnectedApp {
  id: string;
  name: string;
  url: string;
  connectedAt: number;
}

export interface SettingsState {
  currency: string;
  notificationsEnabled: boolean;
  /** Whether the user has opted into device biometrics for unlock. */
  biometricsEnabled: boolean;
  autoLockMinutes: AutoLockMinutes;
  /** Networks the user has switched off; everything else is active. */
  disabledNetworks: NetworkId[];
  addressBook: SavedAddress[];
  connectedApps: ConnectedApp[];
  hydrated: boolean;

  setCurrency: (code: string) => void;
  setNotificationsEnabled: (value: boolean) => void;
  setBiometricsEnabled: (value: boolean) => void;
  setAutoLockMinutes: (value: AutoLockMinutes) => void;
  toggleNetwork: (id: NetworkId) => void;
  addAddress: (input: Omit<SavedAddress, 'id'>) => void;
  updateAddress: (id: string, patch: Partial<Omit<SavedAddress, 'id'>>) => void;
  removeAddress: (id: string) => void;
  disconnectApp: (id: string) => void;
  setHydrated: (value: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      notificationsEnabled: false,
      biometricsEnabled: false,
      autoLockMinutes: 0,
      disabledNetworks: [],
      addressBook: [],
      connectedApps: [],
      hydrated: false,

      setCurrency: (code) => set({ currency: code }),
      setNotificationsEnabled: (value) => set({ notificationsEnabled: value }),
      setBiometricsEnabled: (value) => set({ biometricsEnabled: value }),
      setAutoLockMinutes: (value) => set({ autoLockMinutes: value }),

      toggleNetwork: (id) =>
        set((state) => ({
          disabledNetworks: state.disabledNetworks.includes(id)
            ? state.disabledNetworks.filter((n) => n !== id)
            : [...state.disabledNetworks, id],
        })),

      addAddress: (input) =>
        set((state) => ({
          addressBook: [
            ...state.addressBook,
            { ...input, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),

      updateAddress: (id, patch) =>
        set((state) => ({
          addressBook: state.addressBook.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      removeAddress: (id) =>
        set((state) => ({ addressBook: state.addressBook.filter((a) => a.id !== id) })),

      disconnectApp: (id) =>
        set((state) => ({ connectedApps: state.connectedApps.filter((a) => a.id !== id) })),

      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: 'photon-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
