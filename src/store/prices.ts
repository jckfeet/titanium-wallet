/**
 * Shared price state.
 *
 * Kept in its own store so Home, token detail and the swap screen all read the
 * same quotes and a single pull-to-refresh updates every one of them.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { getCachedPrices, getPrices, PriceMap } from '@/lib/prices';
import { Token } from '@/data/tokens';

interface PriceState {
  prices: PriceMap;
  refreshing: boolean;
  /** Null until the first fetch settles. */
  lastUpdated: number | null;
  /** True when the last attempt fell back to bundled prices. */
  offline: boolean;
  refresh: (ids: readonly string[], force?: boolean) => Promise<void>;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  refreshing: false,
  lastUpdated: null,
  offline: false,

  refresh: async (ids, force = false) => {
    if (ids.length === 0) return;
    set({ refreshing: true });
    try {
      const prices = await getPrices(ids, force);
      set({ prices, lastUpdated: Date.now(), offline: false, refreshing: false });
    } catch {
      set({ prices: getCachedPrices(ids), offline: true, refreshing: false });
    }
  },
}));

/** Resolves the USD price for a token, including custom tokens with no market. */
export function priceFor(prices: PriceMap, token: Token): number {
  if (!token.coingeckoId) return token.fallbackPrice;
  return prices[token.coingeckoId]?.usd ?? token.fallbackPrice;
}

/** Resolves the 24h change for a token. Custom tokens are always flat. */
export function changeFor(prices: PriceMap, token: Token): number {
  if (!token.coingeckoId) return 0;
  return prices[token.coingeckoId]?.change24h ?? 0;
}

/**
 * Kicks off a price fetch for the given tokens on mount.
 * Repeat calls are cheap - the service layer caches for 60s.
 */
export function useRefreshPrices(tokens: readonly Token[]): void {
  const refresh = usePriceStore((s) => s.refresh);
  const ids = tokens
    .map((t) => t.coingeckoId)
    .filter((id): id is string => Boolean(id))
    .join(',');

  useEffect(() => {
    if (!ids) return;
    void refresh(ids.split(','));
  }, [ids, refresh]);
}
