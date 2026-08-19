/**
 * The single source of truth for the demo wallet.
 *
 * Everything in here is fake and local. There is no network of any kind behind
 * these balances - sending, swapping and buying just move numbers around and
 * append a record to the activity feed. State is persisted to AsyncStorage so
 * the demo survives a relaunch, and can be reset to factory data at any time.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BIP39_WORDLIST } from '@/data/bip39';
import { DEFAULT_TOKENS, Token } from '@/data/tokens';
import {
  fakeBitcoinAddress,
  fakeEvmAddress,
  fakeSignature,
  fakeSolanaAddress,
} from '@/lib/base58';
import { makeRng, randomId, rngInt, rngPick, rngRange } from '@/lib/random';

export type NetworkId = 'solana' | 'ethereum' | 'polygon' | 'bitcoin';

export interface Network {
  id: NetworkId;
  name: string;
  symbol: string;
  color: string;
}

export const NETWORKS: readonly Network[] = [
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#14F195' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#8A92B2' },
  { id: 'polygon', name: 'Polygon', symbol: 'POL', color: '#8247E5' },
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
];

export type ActivityType = 'send' | 'receive' | 'swap' | 'buy';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  /** Token leaving the wallet (send/swap) or arriving (receive/buy). */
  tokenId: string;
  amount: number;
  /** USD value at the time the record was created. */
  usdValue: number;
  signature: string;
  timestamp: number;
  /** Counterparty address for sends and receives. */
  address?: string;
  /** Destination token for swaps. */
  toTokenId?: string;
  toAmount?: number;
}

/** One wallet account. Each carries its own addresses, holdings and history. */
export interface Account {
  id: string;
  name: string;
  /** Display handle shown next to the avatar, e.g. `@quietfox`. */
  handle: string;
  /** Avatar colour, derived once at creation. */
  color: string;
  /** Seed string the account's addresses are generated from. */
  seed: string;
}

/** The per-account slice that is swapped in and out on account switch. */
export interface AccountData {
  addresses: Record<NetworkId, string>;
  balances: Record<string, number>;
  activity: ActivityItem[];
  cashBalance: number;
}

export interface WalletState {
  accounts: Account[];
  activeAccountId: string;
  /** Parked data for every account that is not currently active. */
  accountData: Record<string, AccountData>;

  /** False until the onboarding flow completes. */
  onboarded: boolean;
  /** Cosmetic 12-word phrase shown during onboarding. Never used as a key. */
  seedPhrase: string[];
  addresses: Record<NetworkId, string>;
  tokens: Token[];
  /** tokenId -> holding. */
  balances: Record<string, number>;
  /** Tokens hidden from the Home list via "Manage token list". */
  hiddenTokens: string[];
  activity: ActivityItem[];
  /** Simulated fiat cash balance shown in the Home cash section. */
  cashBalance: number;
  /** When true every figure renders masked; see `maskIf`. */
  hideBalances: boolean;
  /** True once AsyncStorage has rehydrated, gating the first navigation. */
  hydrated: boolean;

  addAccount: (name?: string) => Account;
  switchAccount: (accountId: string) => void;
  renameAccount: (accountId: string, name: string) => void;
  removeAccount: (accountId: string) => void;

  createWallet: () => void;
  regenerateSeedPhrase: () => void;
  setBalance: (tokenId: string, amount: number) => void;
  addCustomToken: (input: { name: string; symbol: string; balance: number; color: string }) => void;
  removeToken: (tokenId: string) => void;
  toggleTokenHidden: (tokenId: string) => void;
  setCashBalance: (value: number) => void;
  setHideBalances: (value: boolean) => void;
  send: (input: { tokenId: string; amount: number; address: string; usdValue: number }) => ActivityItem;
  swap: (input: {
    fromTokenId: string;
    toTokenId: string;
    fromAmount: number;
    toAmount: number;
    usdValue: number;
  }) => ActivityItem;
  buy: (input: { tokenId: string; amount: number; usdValue: number }) => ActivityItem;
  resetAll: () => void;
  setHydrated: (value: boolean) => void;
}

/** Picks 12 cosmetic words. Uses real entropy so each demo wallet differs. */
export function generateSeedPhrase(): string[] {
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    words.push(BIP39_WORDLIST[Math.floor(Math.random() * BIP39_WORDLIST.length)]);
  }
  return words;
}

const HANDLE_ADJECTIVES = [
  'quiet', 'amber', 'north', 'violet', 'swift', 'lunar', 'cobalt', 'ember',
  'solar', 'hollow', 'copper', 'silent',
];
const HANDLE_NOUNS = [
  'fox', 'harbor', 'pine', 'atlas', 'river', 'orbit', 'cedar', 'falcon',
  'quartz', 'meadow', 'anchor', 'comet',
];
const AVATAR_COLORS = [
  '#AB9FF2', '#5AC8FA', '#21C577', '#F5A623', '#FC6B6B', '#B57BFF',
];

/** `@quietfox` style handle, derived from the account seed so it is stable. */
export function generateHandle(seed: string): string {
  const rng = makeRng(`handle-${seed}`);
  const adjective = rngPick(rng, HANDLE_ADJECTIVES);
  const noun = rngPick(rng, HANDLE_NOUNS);
  return `@${adjective}${noun}`;
}

function avatarColor(seed: string): string {
  return rngPick(makeRng(`avatar-${seed}`), AVATAR_COLORS);
}

function generateAddresses(seed: string): Record<NetworkId, string> {
  return {
    solana: fakeSolanaAddress(`${seed}-solana`),
    ethereum: fakeEvmAddress(`${seed}-ethereum`),
    polygon: fakeEvmAddress(`${seed}-polygon`),
    bitcoin: fakeBitcoinAddress(`${seed}-bitcoin`),
  };
}

function defaultBalances(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const token of DEFAULT_TOKENS) out[token.id] = token.defaultBalance;
  return out;
}

/**
 * Builds a plausible back-catalogue of transactions so Activity is not empty on
 * first launch. Seeded, so the same install always shows the same history.
 */
function seedActivity(seed: string, now = Date.now()): ActivityItem[] {
  const rng = makeRng(`activity-${seed}`);
  const items: ActivityItem[] = [];
  const tradable = DEFAULT_TOKENS.filter((t) => t.symbol !== 'USDC');
  const types: ActivityType[] = ['send', 'receive', 'swap', 'buy'];

  // Walk backwards from a few hours ago to roughly six weeks out.
  let cursor = now - rngInt(rng, 2, 8) * 3_600_000;

  for (let i = 0; i < 16; i++) {
    const type = rngPick(rng, types);
    const token = rngPick(rng, DEFAULT_TOKENS);
    // Read the price off the asset itself: the shared fallback table is keyed
    // by CoinGecko id for crypto but by ticker for stocks, so an id lookup
    // silently misses every stock and produces absurd share counts.
    const price = token.fallbackPrice > 0 ? token.fallbackPrice : 1;

    // Size the amount against price so USD values land in a believable band.
    const usdTarget = rngRange(rng, 12, 640);
    const amount = usdTarget / price;

    const item: ActivityItem = {
      id: `seed-${i}`,
      type,
      tokenId: token.id,
      amount,
      usdValue: usdTarget,
      signature: fakeSignature(`${seed}-sig-${i}`),
      timestamp: cursor,
    };

    if (type === 'send' || type === 'receive') {
      item.address = fakeSolanaAddress(`${seed}-peer-${i}`);
    }

    if (type === 'swap') {
      const dest = rngPick(
        rng,
        tradable.filter((t) => t.id !== token.id),
      );
      const destPrice = dest.fallbackPrice > 0 ? dest.fallbackPrice : 1;
      item.toTokenId = dest.id;
      // Apply a small spread so the two legs are not a perfect mirror.
      item.toAmount = (usdTarget * rngRange(rng, 0.994, 0.999)) / destPrice;
    }

    items.push(item);
    cursor -= rngInt(rng, 3, 96) * 3_600_000;
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

/** Factory demo data, used on first launch and by "Reset all data". */
function factoryState(seed = randomId()) {
  const firstAccount: Account = {
    id: seed,
    name: 'Account 1',
    handle: generateHandle(seed),
    color: avatarColor(seed),
    seed,
  };

  return {
    accounts: [firstAccount],
    activeAccountId: firstAccount.id,
    accountData: {} as Record<string, AccountData>,
    onboarded: false,
    seedPhrase: generateSeedPhrase(),
    addresses: generateAddresses(seed),
    tokens: [...DEFAULT_TOKENS] as Token[],
    balances: defaultBalances(),
    hiddenTokens: [] as string[],
    activity: seedActivity(seed),
    cashBalance: 10_000,
    hideBalances: false,
  };
}

/** Snapshots the live per-account fields, for parking on account switch. */
function snapshot(state: WalletState): AccountData {
  return {
    addresses: state.addresses,
    balances: state.balances,
    activity: state.activity,
    cashBalance: state.cashBalance,
  };
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      ...factoryState(),
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      createWallet: () => set({ onboarded: true }),

      regenerateSeedPhrase: () => set({ seedPhrase: generateSeedPhrase() }),

      setBalance: (tokenId, amount) =>
        set((state) => ({
          balances: { ...state.balances, [tokenId]: Math.max(0, amount) },
        })),

      addCustomToken: ({ name, symbol, balance, color }) => {
        const id = `custom-${symbol.toLowerCase()}-${randomId().slice(0, 6)}`;
        const token: Token = {
          id,
          symbol: symbol.toUpperCase(),
          name,
          // Custom tokens are always treated as crypto; they have no market
          // either way, so they price at a flat nominal value.
          kind: 'crypto',
          coingeckoId: null,
          color,
          glyph: symbol.slice(0, 1).toUpperCase(),
          defaultBalance: balance,
          // Custom tokens have no market, so they carry a fixed nominal price.
          fallbackPrice: 1,
          custom: true,
        };
        set((state) => ({
          tokens: [...state.tokens, token],
          balances: { ...state.balances, [id]: balance },
        }));
      },

      removeToken: (tokenId) =>
        set((state) => {
          const balances = { ...state.balances };
          delete balances[tokenId];
          return {
            tokens: state.tokens.filter((t) => t.id !== tokenId),
            balances,
            hiddenTokens: state.hiddenTokens.filter((id) => id !== tokenId),
          };
        }),

      toggleTokenHidden: (tokenId) =>
        set((state) => ({
          hiddenTokens: state.hiddenTokens.includes(tokenId)
            ? state.hiddenTokens.filter((id) => id !== tokenId)
            : [...state.hiddenTokens, tokenId],
        })),

      addAccount: (name) => {
        const seed = randomId();
        const account: Account = {
          id: seed,
          name: name?.trim() || `Account ${get().accounts.length + 1}`,
          handle: generateHandle(seed),
          color: avatarColor(seed),
          seed,
        };

        set((state) => ({
          accounts: [...state.accounts, account],
          // A new account starts empty - fresh addresses, no holdings, no history.
          accountData: {
            ...state.accountData,
            [account.id]: {
              addresses: generateAddresses(seed),
              balances: {},
              activity: [],
              cashBalance: 0,
            },
          },
        }));

        return account;
      },

      switchAccount: (accountId) =>
        set((state) => {
          if (accountId === state.activeAccountId) return {};
          const target = state.accountData[accountId];
          if (!target) return {};

          // Park the outgoing account's data, load the incoming account's.
          return {
            accountData: {
              ...state.accountData,
              [state.activeAccountId]: snapshot(state),
            },
            activeAccountId: accountId,
            addresses: target.addresses,
            balances: target.balances,
            activity: target.activity,
            cashBalance: target.cashBalance,
          };
        }),

      renameAccount: (accountId, name) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === accountId ? { ...a, name: name.trim() || a.name } : a,
          ),
        })),

      removeAccount: (accountId) =>
        set((state) => {
          // The last account cannot be removed - there would be nothing to show.
          if (state.accounts.length <= 1) return {};

          const remaining = state.accounts.filter((a) => a.id !== accountId);
          const accountData = { ...state.accountData };
          delete accountData[accountId];

          if (accountId !== state.activeAccountId) {
            return { accounts: remaining, accountData };
          }

          // Removing the active account falls through to the first survivor.
          const next = remaining[0];
          const data = accountData[next.id] ?? {
            addresses: generateAddresses(next.seed),
            balances: {},
            activity: [],
            cashBalance: 0,
          };
          return {
            accounts: remaining,
            accountData,
            activeAccountId: next.id,
            addresses: data.addresses,
            balances: data.balances,
            activity: data.activity,
            cashBalance: data.cashBalance,
          };
        }),

      setCashBalance: (value) => set({ cashBalance: Math.max(0, value) }),

      setHideBalances: (value) => set({ hideBalances: value }),

      send: ({ tokenId, amount, address, usdValue }) => {
        const item: ActivityItem = {
          id: randomId(),
          type: 'send',
          tokenId,
          amount,
          usdValue,
          address,
          signature: fakeSignature(),
          timestamp: Date.now(),
        };
        set((state) => ({
          balances: {
            ...state.balances,
            [tokenId]: Math.max(0, (state.balances[tokenId] ?? 0) - amount),
          },
          activity: [item, ...state.activity],
        }));
        return item;
      },

      swap: ({ fromTokenId, toTokenId, fromAmount, toAmount, usdValue }) => {
        const item: ActivityItem = {
          id: randomId(),
          type: 'swap',
          tokenId: fromTokenId,
          amount: fromAmount,
          toTokenId,
          toAmount,
          usdValue,
          signature: fakeSignature(),
          timestamp: Date.now(),
        };
        set((state) => ({
          balances: {
            ...state.balances,
            [fromTokenId]: Math.max(0, (state.balances[fromTokenId] ?? 0) - fromAmount),
            [toTokenId]: (state.balances[toTokenId] ?? 0) + toAmount,
          },
          activity: [item, ...state.activity],
        }));
        return item;
      },

      buy: ({ tokenId, amount, usdValue }) => {
        const item: ActivityItem = {
          id: randomId(),
          type: 'buy',
          tokenId,
          amount,
          usdValue,
          signature: fakeSignature(),
          timestamp: Date.now(),
        };
        set((state) => ({
          balances: { ...state.balances, [tokenId]: (state.balances[tokenId] ?? 0) + amount },
          activity: [item, ...state.activity],
        }));
        return item;
      },

      resetAll: () => {
        const fresh = factoryState();
        // Reset returns to the welcome screen, exactly like a fresh install.
        set({ ...fresh, hydrated: true });
      },
    }),
    {
      // Deliberately still v3: the account fields are additive, and zustand's
      // shallow merge fills them from initial state while persisted balances,
      // addresses and history survive. Bumping here would wipe every install.
      name: 'titanium-wallet-v3',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Tokens visible on Home, in catalogue order. */
export function useVisibleTokens(): Token[] {
  const tokens = useWallet((s) => s.tokens);
  const hidden = useWallet((s) => s.hiddenTokens);
  return tokens.filter((t) => !hidden.includes(t.id));
}

/** Looks up a token by id across defaults and custom additions. */
export function useToken(tokenId: string | undefined): Token | undefined {
  return useWallet((s) => s.tokens.find((t) => t.id === tokenId));
}
