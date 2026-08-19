import {
  dayLabel,
  MASKED,
  maskIf,
  formatAmount,
  formatPercent,
  formatPrice,
  formatUsd,
  parseAmount,
  timeAgo,
  truncateMiddle,
} from '../format';

describe('formatUsd', () => {
  it('renders standard currency', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(-42)).toBe('-$42.00');
  });

  it('compacts only at a million and above', () => {
    expect(formatUsd(999_999, { compact: true })).toBe('$999,999.00');
    expect(formatUsd(2_500_000, { compact: true })).toBe('$2.50M');
  });

  it('survives non-finite input rather than printing NaN', () => {
    expect(formatUsd(NaN)).toBe('$0.00');
    expect(formatUsd(Infinity)).toBe('$0.00');
  });
});

describe('formatPrice', () => {
  it('scales precision with magnitude so small caps are not flat zero', () => {
    expect(formatPrice(150)).toBe('$150.00');
    expect(formatPrice(0.5)).toBe('$0.5000');
    expect(formatPrice(0.0012)).toBe('$0.001200');
    expect(formatPrice(0.00002)).toBe('$0.00002000');
  });

  it('treats exact zero as the plain figure', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('formatAmount', () => {
  it('trims trailing zeros but keeps the integer grouping', () => {
    expect(formatAmount(1500.5)).toBe('1,500.5');
    expect(formatAmount(12.3400)).toBe('12.34');
    expect(formatAmount(1000)).toBe('1,000');
  });

  it('gives sub-1 balances more decimals', () => {
    expect(formatAmount(0.000123)).toBe('0.000123');
  });

  it('honours the maxDecimals ceiling', () => {
    expect(formatAmount(0.123456789, 3)).toBe('0.123');
  });
});

describe('formatPercent', () => {
  it('always shows an explicit sign for gains', () => {
    expect(formatPercent(2.145)).toBe('+2.15%');
    expect(formatPercent(-0.87)).toBe('-0.87%');
    expect(formatPercent(0)).toBe('0.00%');
  });
});

describe('truncateMiddle', () => {
  it('keeps both ends of a long address', () => {
    expect(truncateMiddle('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')).toBe('7xKX...gAsU');
  });

  it('leaves short strings alone', () => {
    expect(truncateMiddle('abc')).toBe('abc');
  });
});

describe('timeAgo', () => {
  const now = Date.UTC(2026, 0, 15, 12, 0, 0);
  const ago = (ms: number) => timeAgo(now - ms, now);

  it('walks up the unit ladder', () => {
    expect(ago(5_000)).toBe('Just now');
    expect(ago(5 * 60_000)).toBe('5m ago');
    expect(ago(3 * 3_600_000)).toBe('3h ago');
    expect(ago(2 * 86_400_000)).toBe('2d ago');
    expect(ago(14 * 86_400_000)).toBe('2w ago');
    expect(ago(90 * 86_400_000)).toBe('3mo ago');
    expect(ago(400 * 86_400_000)).toBe('1y ago');
  });

  it('clamps future timestamps instead of printing negatives', () => {
    expect(timeAgo(now + 60_000, now)).toBe('Just now');
  });
});

describe('dayLabel', () => {
  const now = new Date(2026, 0, 15, 12, 0, 0).getTime();

  it('names the recent days', () => {
    expect(dayLabel(now, now)).toBe('Today');
    expect(dayLabel(now - 86_400_000, now)).toBe('Yesterday');
  });

  it('falls back to a date for anything over a week old', () => {
    expect(dayLabel(new Date(2025, 11, 25).getTime(), now)).toBe('December 25');
  });
});

describe('parseAmount', () => {
  it('accepts ordinary input', () => {
    expect(parseAmount('12.5')).toBe(12.5);
  });

  it('tolerates the junk a free-text amount field collects', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('.')).toBe(0);
    expect(parseAmount('1.2.3')).toBe(1.23);
    expect(parseAmount('$1,234.50')).toBe(1234.5);
    expect(parseAmount('abc')).toBe(0);
  });
});

describe('maskIf', () => {
  it('passes the figure through when balances are visible', () => {
    expect(maskIf(false, '$1,234.50')).toBe('$1,234.50');
  });

  it('replaces the figure when balances are hidden', () => {
    expect(maskIf(true, '$1,234.50')).toBe(MASKED);
  });

  it('masks every figure identically, so amounts cannot be inferred by width', () => {
    expect(maskIf(true, '$1.00')).toBe(maskIf(true, '$9,999,999.00'));
  });
});
