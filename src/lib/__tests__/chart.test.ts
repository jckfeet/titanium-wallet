import {
  buildPortfolioSeries,
  buildSeries,
  formatSeriesTime,
  TIMEFRAMES,
  type Timeframe,
} from '../chart';

const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

describe('buildSeries', () => {
  it('is deterministic, so reopening a screen redraws the same curve', () => {
    const a = buildSeries('sol', '1W', 150, 0, NOW);
    const b = buildSeries('sol', '1W', 150, 0, NOW);
    expect(a.points).toEqual(b.points);
  });

  it('gives different tokens different shapes', () => {
    const sol = buildSeries('sol', '1W', 150, 0, NOW);
    const eth = buildSeries('eth', '1W', 150, 0, NOW);
    expect(sol.points).not.toEqual(eth.points);
  });

  it.each(TIMEFRAMES)('terminates at the live price for %s', (tf: Timeframe) => {
    const series = buildSeries('sol', tf, 150, 0, NOW);
    expect(series.points[series.points.length - 1]).toBeCloseTo(150, 6);
  });

  it.each(TIMEFRAMES)('keeps points and timestamps aligned for %s', (tf: Timeframe) => {
    const series = buildSeries('sol', tf, 150, 0, NOW);
    expect(series.timestamps).toHaveLength(series.points.length);
    expect(series.timestamps[series.timestamps.length - 1]).toBe(NOW);
  });

  it('reports min and max that actually bound the series', () => {
    const series = buildSeries('bonk', '1M', 0.00002, 0, NOW);
    expect(series.min).toBeLessThanOrEqual(Math.min(...series.points));
    expect(series.max).toBeGreaterThanOrEqual(Math.max(...series.points));
    expect(series.min).toBeGreaterThan(0);
  });

  it('anchors the 1D curve to the 24h change so chart and badge agree', () => {
    const series = buildSeries('sol', '1D', 150, 20, NOW);
    // A +20% day means the window opened at 150 / 1.2 = 125.
    expect(series.points[0]).toBeCloseTo(125, 6);
    expect(series.changePct).toBeCloseTo(20, 4);
  });

  it('handles a negative 24h move', () => {
    const series = buildSeries('sol', '1D', 80, -20, NOW);
    expect(series.points[0]).toBeCloseTo(100, 6);
    expect(series.changePct).toBeCloseTo(-20, 4);
  });

  it('never produces non-positive or non-finite prices', () => {
    for (const tf of TIMEFRAMES) {
      for (const price of [0.00002, 1, 150, 98_000]) {
        const series = buildSeries(`t-${price}`, tf, price, 0, NOW);
        for (const p of series.points) {
          expect(Number.isFinite(p)).toBe(true);
          expect(p).toBeGreaterThan(0);
        }
      }
    }
  });

  it('substitutes a usable price when given zero', () => {
    const series = buildSeries('sol', '1D', 0, 0, NOW);
    expect(series.points.every((p) => Number.isFinite(p) && p > 0)).toBe(true);
  });
});

describe('formatSeriesTime', () => {
  it('shows a clock for intraday windows', () => {
    expect(formatSeriesTime(NOW, '1H')).toMatch(/\d{1,2}:\d{2}/);
    expect(formatSeriesTime(NOW, '1D')).toMatch(/\d{1,2}:\d{2}/);
  });

  it('shows month and year for the yearly window', () => {
    expect(formatSeriesTime(NOW, '1Y')).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
  });

  it('shows month and day for the week and month windows', () => {
    expect(formatSeriesTime(NOW, '1W')).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
  });
});

describe('buildPortfolioSeries', () => {
  const holdings = [
    { id: 'sol', balance: 10, price: 150, change24h: 2 },
    { id: 'eth', balance: 0.5, price: 2000, change24h: -1 },
  ];

  it('ends at the current portfolio value', () => {
    const series = buildPortfolioSeries(holdings, '1W', 1000, NOW);
    const expected = 10 * 150 + 0.5 * 2000 + 1000;
    expect(series.points[series.points.length - 1]).toBeCloseTo(expected, 6);
  });

  it('is deterministic', () => {
    const a = buildPortfolioSeries(holdings, '1M', 0, NOW);
    const b = buildPortfolioSeries(holdings, '1M', 0, NOW);
    expect(a.points).toEqual(b.points);
  });

  it('adds cash as a flat floor the curve never dips below', () => {
    const series = buildPortfolioSeries(holdings, '1Y', 5000, NOW);
    expect(series.min).toBeGreaterThan(5000);
  });

  it('is exactly the cash line when there are no holdings', () => {
    const series = buildPortfolioSeries([], '1D', 2500, NOW);
    expect(series.points.every((p) => p === 2500)).toBe(true);
    expect(series.changePct).toBe(0);
  });

  it('ignores zero balances and unpriced assets', () => {
    const withJunk = [
      ...holdings,
      { id: 'zero', balance: 0, price: 100, change24h: 0 },
      { id: 'unpriced', balance: 5, price: 0, change24h: 0 },
    ];
    expect(buildPortfolioSeries(withJunk, '1W', 0, NOW).points).toEqual(
      buildPortfolioSeries(holdings, '1W', 0, NOW).points,
    );
  });

  it('agrees with the token charts it is built from', () => {
    // A single holding of 1 unit must equal that token own series.
    const single = [{ id: 'sol', balance: 1, price: 150, change24h: 2 }];
    const portfolio = buildPortfolioSeries(single, '1W', 0, NOW);
    const token = buildSeries('sol', '1W', 150, 2, NOW);
    portfolio.points.forEach((p, i) => expect(p).toBeCloseTo(token.points[i], 6));
  });

  it.each(TIMEFRAMES)('keeps points and timestamps aligned for %s', (tf: Timeframe) => {
    const series = buildPortfolioSeries(holdings, tf, 0, NOW);
    expect(series.timestamps).toHaveLength(series.points.length);
    expect(series.timestamps[series.timestamps.length - 1]).toBe(NOW);
  });
});
