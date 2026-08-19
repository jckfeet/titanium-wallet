/**
 * Wallet lock state.
 *
 * Deliberately not persisted: a relaunch should always come up locked when a
 * lock is configured, never restore an unlocked session.
 */
import { create } from 'zustand';

interface LockState {
  locked: boolean;
  /** Timestamp of the last user interaction, for the auto-lock timer. */
  lastActiveAt: number;
  lock: () => void;
  unlock: () => void;
  touch: () => void;
}

export const useLock = create<LockState>()((set) => ({
  locked: false,
  lastActiveAt: Date.now(),
  lock: () => set({ locked: true }),
  unlock: () => set({ locked: false, lastActiveAt: Date.now() }),
  touch: () => set({ lastActiveAt: Date.now() }),
}));
