/**
 * Shared price state for both asset kinds.
 *
 * Crypto and stocks come from different providers but land in one map, keyed by
 * CoinGecko id for crypto and by ticker for stocks, so every screen reads the
 * same quotes and one pull-to-refresh updates all of them.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { getCachedPrices, getPrices, PriceMap } from '@/lib/prices';
import { getStockPrices } from '@/lib/stocks';
import { Token } from '@/data/tokens';

interface PriceState {
  prices: PriceMap;
  refreshing: boolean;
  /** Null until the first fetch settles. */
  lastUpdated: number | null;
  /** True when the last attempt fell back to bundled prices. */
  offline: boolean;
  refresh: (tokens: readonly Token[], force?: boolean) => Promise<void>;
}

/** Splits a catalogue into the lookup keys each provider expects. */
export function quoteKeys(tokens: readonly Token[]): { coinIds: string[]; tickers: string[] } {
  const coinIds: string[] = [];
  const tickers: string[] = [];
  for (const token of tokens) {
    if (!token.coingeckoId) continue;
    if (token.kind === 'stock') tickers.push(token.coingeckoId);
    else coinIds.push(token.coingeckoId);
  }
  return { coinIds, tickers };
}

export const usePriceStore = create<PriceState>((set, get) => ({
  prices: {},
  refreshing: false,
  lastUpdated: null,
  offline: false,

  refresh: async (tokens, force = false) => {
    const { coinIds, tickers } = quoteKeys(tokens);
    if (coinIds.length === 0 && tickers.length === 0) return;

    set({ refreshing: true });
    try {
      // Settled rather than all: a stock-provider outage must not blank out
      // the crypto rows, or vice versa.
      const [crypto, stocks] = await Promise.all([
        coinIds.length ? getPrices(coinIds, force) : Promise.resolve({} as PriceMap),
        tickers.length ? getStockPrices(tickers, force) : Promise.resolve({} as PriceMap),
      ]);
      set({
        prices: { ...get().prices, ...crypto, ...stocks },
        lastUpdated: Date.now(),
        offline: false,
        refreshing: false,
      });
    } catch {
      set({ prices: { ...get().prices, ...getCachedPrices(coinIds) }, offline: true, refreshing: false });
    }
  },
}));

/** Resolves the USD price for an asset, including custom tokens with no market. */
export function priceFor(prices: PriceMap, token: Token): number {
  if (!token.coingeckoId) return token.fallbackPrice;
  return prices[token.coingeckoId]?.usd ?? token.fallbackPrice;
}

/** Resolves the 24h change. Custom tokens are always flat. */
export function changeFor(prices: PriceMap, token: Token): number {
  if (!token.coingeckoId) return 0;
  return prices[token.coingeckoId]?.change24h ?? 0;
}

/**
 * Kicks off a price fetch for the given assets on mount.
 * Repeat calls are cheap - both service layers cache for 60s.
 */
export function useRefreshPrices(tokens: readonly Token[]): void {
  const refresh = usePriceStore((s) => s.refresh);
  // Depend on the key list rather than the array identity, which changes on
  // every store update and would refetch in a loop.
  const signature = tokens.map((t) => `${t.kind}:${t.coingeckoId ?? ''}`).join(',');

  useEffect(() => {
    if (!signature) return;
    void refresh(tokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, refresh]);
}
