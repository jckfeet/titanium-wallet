/** Derived portfolio figures shared by Home, Swap, Send and Buy. */
import { useMemo } from 'react';

import { Token } from '@/data/tokens';
import { changeFor, priceFor, usePriceStore } from './prices';
import { useWallet } from './wallet';

export interface HoldingRow {
  token: Token;
  balance: number;
  price: number;
  usdValue: number;
  change24h: number;
}

export interface Portfolio {
  rows: HoldingRow[];
  totalUsd: number;
  /** Weighted 24h move across the whole portfolio. */
  change24hPct: number;
  change24hUsd: number;
}

/**
 * @param includeHidden when true, returns every token (used by the manage-list
 *        and demo screens rather than the Home list).
 */
export function usePortfolio(includeHidden = false): Portfolio {
  const tokens = useWallet((s) => s.tokens);
  const balances = useWallet((s) => s.balances);
  const hidden = useWallet((s) => s.hiddenTokens);
  const prices = usePriceStore((s) => s.prices);

  return useMemo(() => {
    const visible = includeHidden ? tokens : tokens.filter((t) => !hidden.includes(t.id));

    const rows: HoldingRow[] = visible.map((token) => {
      const balance = balances[token.id] ?? 0;
      const price = priceFor(prices, token);
      return {
        token,
        balance,
        price,
        usdValue: balance * price,
        change24h: changeFor(prices, token),
      };
    });

    // Sort by value so the biggest holdings lead, as in the reference layout.
    rows.sort((a, b) => b.usdValue - a.usdValue);

    const totalUsd = rows.reduce((sum, row) => sum + row.usdValue, 0);

    // Back out yesterday's value from each row's 24h move to get a weighted
    // portfolio change rather than a naive average of percentages.
    const previousUsd = rows.reduce(
      (sum, row) => sum + row.usdValue / (1 + row.change24h / 100),
      0,
    );
    const change24hUsd = totalUsd - previousUsd;
    const change24hPct = previousUsd > 0 ? (change24hUsd / previousUsd) * 100 : 0;

    return { rows, totalUsd, change24hPct, change24hUsd };
  }, [tokens, balances, hidden, prices, includeHidden]);
}

/** Single-token view of the same figures. */
export function useHolding(tokenId: string | undefined): HoldingRow | undefined {
  const { rows } = usePortfolio(true);
  return rows.find((row) => row.token.id === tokenId);
}
