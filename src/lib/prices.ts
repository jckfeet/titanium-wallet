/**
 * Live USD prices from CoinGecko's free public API.
 *
 * Fake balances multiplied by real prices give totals that move like the real
 * market. The free endpoint is rate limited, so results are cached for 60s and
 * every failure degrades to the bundled static table rather than surfacing an
 * error - a demo wallet should never show a broken screen because it is offline.
 */
import { FALLBACK_PRICES } from '@/data/tokens';

export interface PriceQuote {
  usd: number;
  change24h: number;
}

export type PriceMap = Record<string, PriceQuote>;

const ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price';
const CACHE_TTL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8_000;

let cache: { at: number; data: PriceMap } | null = null;
/** De-duplicates concurrent refreshes (pull-to-refresh plus screen mount). */
let inFlight: Promise<PriceMap> | null = null;

function fallbackFor(ids: readonly string[]): PriceMap {
  const out: PriceMap = {};
  for (const id of ids) {
    const entry = FALLBACK_PRICES[id];
    if (entry) out[id] = { usd: entry.usd, change24h: entry.usd_24h_change };
  }
  return out;
}

async function fetchPrices(ids: readonly string[]): Promise<PriceMap> {
  const url = `${ENDPOINT}?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`;

  // React Native's fetch has no default timeout, so an unreachable network
  // would otherwise hang the pull-to-refresh spinner indefinitely.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);
    const json = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;

    const out: PriceMap = {};
    for (const id of ids) {
      const entry = json[id];
      if (entry && typeof entry.usd === 'number') {
        out[id] = { usd: entry.usd, change24h: entry.usd_24h_change ?? 0 };
      } else {
        // Partial responses are common for thin-liquidity ids; fill the gap
        // rather than dropping the row out of the portfolio.
        const fb = FALLBACK_PRICES[id];
        if (fb) out[id] = { usd: fb.usd, change24h: fb.usd_24h_change };
      }
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Returns quotes for the given CoinGecko ids.
 *
 * @param force bypasses the 60s cache (used by pull-to-refresh).
 */
export async function getPrices(ids: readonly string[], force = false): Promise<PriceMap> {
  if (ids.length === 0) return {};

  const fresh = cache && Date.now() - cache.at < CACHE_TTL_MS;
  if (fresh && !force && ids.every((id) => cache!.data[id])) {
    return cache!.data;
  }
  if (inFlight) return inFlight;

  inFlight = fetchPrices(ids)
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .catch(() => {
      // Keep a stale cache if we have one - it is closer to the truth than the
      // bundled table.
      if (cache) return cache.data;
      return fallbackFor(ids);
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Synchronous best-effort read, for first paint before any fetch resolves. */
export function getCachedPrices(ids: readonly string[]): PriceMap {
  if (cache) return cache.data;
  return fallbackFor(ids);
}

/** Test/reset hook - clears the module-level cache. */
export function clearPriceCache(): void {
  cache = null;
}
