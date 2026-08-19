/**
 * The one formatter screens should use for fiat figures.
 *
 * Folds the two display preferences together - selected currency and the
 * hide-balances mask - so no screen has to remember to apply both.
 */
import { useCallback } from 'react';

import { currencyFor } from '@/data/currencies';
import { formatMoney, maskIf } from '@/lib/format';
import { useSettings } from './settings';
import { useWallet } from './wallet';

export function useMoney(): (usd: number, opts?: { compact?: boolean }) => string {
  const code = useSettings((s) => s.currency);
  const hidden = useWallet((s) => s.hideBalances);

  return useCallback(
    (usd: number, opts?: { compact?: boolean }) =>
      maskIf(hidden, formatMoney(usd, currencyFor(code), opts)),
    [code, hidden],
  );
}

/** Non-hook variant for code outside a component. */
export function formatWithSettings(usd: number, code: string, hidden: boolean): string {
  return maskIf(hidden, formatMoney(usd, currencyFor(code)));
}
