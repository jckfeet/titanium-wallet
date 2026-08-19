/**
 * Synthetic price history for the token detail chart.
 *
 * Everything is derived from a `token:timeframe` seed, so re-opening a screen
 * redraws the identical curve instead of reshuffling. The series is then
 * rescaled to terminate at the live price, which keeps the chart consistent
 * with the number displayed above it.
 */
import { makeRng, rngNormal } from './random';

export type Timeframe = '1H' | '1D' | '1W' | '1M' | '1Y';

export const TIMEFRAMES: readonly Timeframe[] = ['1H', '1D', '1W', '1M', '1Y'];

interface TimeframeConfig {
  /** Number of points to plot. */
  points: number;
  /** Per-step volatility as a fraction of price. */
  volatility: number;
  /** Total span in milliseconds, used for the x axis. */
  spanMs: number;
}

const CONFIG: Record<Timeframe, TimeframeConfig> = {
  '1H': { points: 60, volatility: 0.0016, spanMs: 60 * 60 * 1000 },
  '1D': { points: 96, volatility: 0.0042, spanMs: 24 * 60 * 60 * 1000 },
  '1W': { points: 84, volatility: 0.011, spanMs: 7 * 24 * 60 * 60 * 1000 },
  '1M': { points: 90, volatility: 0.019, spanMs: 30 * 24 * 60 * 60 * 1000 },
  '1Y': { points: 120, volatility: 0.046, spanMs: 365 * 24 * 60 * 60 * 1000 },
};

export interface PriceSeries {
  /** Price at each sample, oldest first, ending at the live price. */
  points: number[];
  /** Wall-clock timestamp for each sample. */
  timestamps: number[];
  min: number;
  max: number;
  /** Percentage change across the whole window. */
  changePct: number;
}

/**
 * Builds the series for one token and timeframe.
 *
 * @param change24h the live 24h move, used so the 1D curve agrees with the
 *                  percentage shown on the token row.
 */
export function buildSeries(
  tokenId: string,
  timeframe: Timeframe,
  currentPrice: number,
  change24h = 0,
  now = Date.now(),
): PriceSeries {
  const cfg = CONFIG[timeframe];
  const rng = makeRng(`${tokenId}:${timeframe}`);
  const price = currentPrice > 0 ? currentPrice : 1;

  // A small persistent drift plus normal shocks reads as a trend rather than
  // pure noise.
  const drift = (rng() - 0.45) * cfg.volatility * 0.6;

  const walk: number[] = [1];
  for (let i = 1; i < cfg.points; i++) {
    const shock = rngNormal(rng) * cfg.volatility;
    // Mild mean reversion stops long windows from wandering off-screen.
    const reversion = (1 - walk[i - 1]) * 0.015;
    walk.push(Math.max(0.05, walk[i - 1] * (1 + drift + shock + reversion)));
  }

  // Anchor the end of the walk to the live price. For 1D we also anchor the
  // start to the price implied by the 24h change, so the curve and the badge
  // tell the same story.
  const last = walk[walk.length - 1];
  let points: number[];

  if (timeframe === '1D' && Math.abs(change24h) > 0.001) {
    const startPrice = price / (1 + change24h / 100);
    const first = walk[0];
    points = walk.map((value, i) => {
      // Blend the walk shape onto a straight line between the two anchors.
      const t = i / (cfg.points - 1);
      const line = startPrice + (price - startPrice) * t;
      const shape = value / (first + (last - first) * t);
      return line * shape;
    });
    points[0] = startPrice;
    points[points.length - 1] = price;
  } else {
    points = walk.map((value) => (value / last) * price);
    points[points.length - 1] = price;
  }

  const timestamps: number[] = [];
  const stepMs = cfg.spanMs / (cfg.points - 1);
  for (let i = 0; i < cfg.points; i++) {
    timestamps.push(now - cfg.spanMs + i * stepMs);
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const changePct = points[0] > 0 ? ((points[points.length - 1] - points[0]) / points[0]) * 100 : 0;

  return { points, timestamps, min, max, changePct };
}

/** Formats the x-axis label shown while scrubbing the chart. */
export function formatSeriesTime(timestamp: number, timeframe: Timeframe): string {
  const date = new Date(timestamp);
  if (timeframe === '1H' || timeframe === '1D') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (timeframe === '1Y') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
