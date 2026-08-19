/**
 * Stock quotes from Yahoo Finance's public chart endpoint.
 *
 * Same contract as the crypto price service: a short cache, a hard timeout and
 * a silent fall back to the bundled table, because a demo wallet should never
 * show a broken screen just because a quote provider is unreachable.
 *
 * Tickers are fetched one at a time - the chart endpoint takes a single symbol -
 * and failures are isolated so one bad ticker cannot empty the whole section.
 */
import { FALLBACK_PRICES } from '@/data/tokens';
import type { PriceMap } from './prices';

const ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8_000;

let cache: { at: number; data: PriceMap } | null = null;
let inFlight: Promise<PriceMap> | null = null;

function fallbackFor(tickers: readonly string[]): PriceMap {
  const out: PriceMap = {};
  for (const ticker of tickers) {
    const entry = FALLBACK_PRICES[ticker];
    if (entry) out[ticker] = { usd: entry.usd, change24h: entry.usd_24h_change };
  }
  return out;
}

async function fetchOne(ticker: string): Promise<{ usd: number; change24h: number } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${ENDPOINT}/${encodeURIComponent(ticker)}?interval=1d&range=1d`, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        // The endpoint rejects requests without a browser-shaped agent.
        'user-agent': 'Mozilla/5.0',
      },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      chart?: { result?: { meta?: { regularMarketPrice?: number; chartPreviousClose?: number } }[] };
    };
    const meta = json.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prev = meta?.chartPreviousClose;
    if (typeof price !== 'number') return null;

    // Yahoo gives the previous close rather than a percentage, so derive it.
    const change24h = typeof prev === 'number' && prev > 0 ? ((price - prev) / prev) * 100 : 0;
    return { usd: price, change24h };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Returns quotes keyed by ticker. Never rejects. */
export async function getStockPrices(
  tickers: readonly string[],
  force = false,
): Promise<PriceMap> {
  if (tickers.length === 0) return {};

  const fresh = cache && Date.now() - cache.at < CACHE_TTL_MS;
  if (fresh && !force) return cache!.data;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const results = await Promise.all(
      tickers.map(async (ticker) => [ticker, await fetchOne(ticker)] as const),
    );

    const out: PriceMap = {};
    for (const [ticker, quote] of results) {
      if (quote) {
        out[ticker] = quote;
      } else {
        const fb = FALLBACK_PRICES[ticker];
        if (fb) out[ticker] = { usd: fb.usd, change24h: fb.usd_24h_change };
      }
    }
    cache = { at: Date.now(), data: out };
    return out;
  })()
    .catch(() => (cache ? cache.data : fallbackFor(tickers)))
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Test/reset hook - clears the module-level cache. */
export function clearStockCache(): void {
  cache = null;
}
