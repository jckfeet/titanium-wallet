/** Presentation helpers shared across every screen. */

/** Stand-in shown wherever a figure is hidden by the privacy toggle. */
export const MASKED = '••••••';

/**
 * Wraps any already-formatted figure so the privacy toggle can blank it.
 * Formatting still runs, so layout does not jump when balances are revealed.
 */
export function maskIf(hidden: boolean, text: string): string {
  return hidden ? MASKED : text;
}

/**
 * Converts a USD figure into the selected display currency and formats it.
 *
 * Prices and balances are held in USD everywhere; only presentation converts,
 * so switching currency never mutates stored data.
 */
export function formatMoney(
  usd: number,
  currency: { symbol: string; perUsd: number; decimals: number },
  opts?: { compact?: boolean },
): string {
  if (!isFinite(usd)) return `${currency.symbol}0${currency.decimals ? '.00' : ''}`;

  const value = usd * currency.perUsd;

  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return `${currency.symbol}${(value / 1_000_000).toFixed(2)}M`;
  }

  const body = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  return `${value < 0 ? '-' : ''}${currency.symbol}${body}`;
}

/** `$1,234.56` - the standard USD figure used in lists and headers. */
export function formatUsd(value: number, opts?: { compact?: boolean }): string {
  if (!isFinite(value)) return '$0.00';
  if (opts?.compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Prices span many orders of magnitude (BONK trades near $0.00002, SOL near
 * $150), so precision has to follow magnitude or small caps render as a flat
 * `$0.00`.
 */
export function formatPrice(value: number): string {
  if (!isFinite(value) || value === 0) return '$0.00';
  const abs = Math.abs(value);
  if (abs >= 1) return formatUsd(value);
  if (abs >= 0.01) return `$${value.toFixed(4)}`;
  if (abs >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}

/** Token quantities: trims trailing zeros but keeps small balances readable. */
export function formatAmount(value: number, maxDecimals = 6): string {
  if (!isFinite(value)) return '0';
  const abs = Math.abs(value);
  let decimals: number;
  if (abs >= 1000) decimals = 2;
  else if (abs >= 1) decimals = 4;
  else decimals = maxDecimals;
  const fixed = value.toFixed(Math.min(decimals, maxDecimals));
  const trimmed = fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed;
  const [whole, frac] = trimmed.split('.');
  const grouped = Number(whole).toLocaleString('en-US');
  return frac ? `${grouped}.${frac}` : grouped;
}

/** `+2.14%` / `-0.87%` - the sign is always explicit. */
export function formatPercent(value: number): string {
  if (!isFinite(value)) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/** `7xKX...gAsU` - keeps both ends so an address stays recognisable. */
export function truncateMiddle(str: string, head = 4, tail = 4): string {
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}...${str.slice(-tail)}`;
}

/** Relative timestamps for the activity feed. */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Groups activity into `Today` / `Yesterday` / `March 4` style sections. */
export function dayLabel(timestamp: number, now = Date.now()): string {
  const date = new Date(timestamp);
  const today = new Date(now);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfDate) / 86_400_000);
  if (dayDiff <= 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * Parses a user-typed amount. Amount fields are free text, so this tolerates
 * empty input, a bare `.`, and stray separators without throwing.
 */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
  const value = parseFloat(normalized);
  return isFinite(value) ? value : 0;
}
