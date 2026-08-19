/**
 * Display currencies.
 *
 * Rates are a bundled static table, not a live FX feed: this app already
 * degrades to bundled prices when offline, and a second network dependency
 * for currency conversion would be a third failure mode for no real gain.
 * They are approximate and only ever used for display.
 */
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  /** Units of this currency per 1 USD. */
  perUsd: number;
  /** Digits after the decimal point. Zero-decimal currencies exist. */
  decimals: number;
}

export const CURRENCIES: readonly Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', perUsd: 1, decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', perUsd: 0.92, decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', perUsd: 0.79, decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', perUsd: 157, decimals: 0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', perUsd: 1.37, decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', perUsd: 1.51, decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', perUsd: 83.4, decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', perUsd: 5.44, decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', perUsd: 1580, decimals: 0 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', perUsd: 1385, decimals: 0 },
];

export const DEFAULT_CURRENCY = 'USD';

export function currencyFor(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
