import { FALLBACK_PRICES } from '@/data/tokens';

import { clearPriceCache, getCachedPrices, getPrices } from '../prices';

const IDS = Object.keys(FALLBACK_PRICES).slice(0, 3);

function mockFetch(impl: jest.Mock) {
  (globalThis as unknown as { fetch: unknown }).fetch = impl;
  return impl;
}

describe('getPrices', () => {
  beforeEach(() => {
    clearPriceCache();
    jest.restoreAllMocks();
  });

  it('returns nothing for an empty id list without calling the network', () => {
    const f = mockFetch(jest.fn());
    return getPrices([]).then((out) => {
      expect(out).toEqual({});
      expect(f).not.toHaveBeenCalled();
    });
  });

  it('uses the live response when the endpoint answers', async () => {
    mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          Object.fromEntries(IDS.map((id) => [id, { usd: 42, usd_24h_change: 1.5 }])),
      }),
    );

    const out = await getPrices(IDS);
    for (const id of IDS) {
      expect(out[id]).toEqual({ usd: 42, change24h: 1.5 });
    }
  });

  it('falls back to the bundled table when the network throws', async () => {
    mockFetch(jest.fn().mockRejectedValue(new Error('offline')));

    const out = await getPrices(IDS);
    for (const id of IDS) {
      expect(out[id].usd).toBe(FALLBACK_PRICES[id].usd);
    }
  });

  it('falls back when the endpoint returns a non-ok status', async () => {
    mockFetch(jest.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) }));

    const out = await getPrices(IDS);
    for (const id of IDS) {
      expect(out[id].usd).toBe(FALLBACK_PRICES[id].usd);
    }
  });

  it('fills gaps in a partial response rather than dropping rows', async () => {
    mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ [IDS[0]]: { usd: 99, usd_24h_change: 2 } }),
      }),
    );

    const out = await getPrices(IDS);
    expect(out[IDS[0]].usd).toBe(99);
    // The ids the endpoint omitted still resolve, from the bundled table.
    for (const id of IDS.slice(1)) {
      expect(out[id].usd).toBe(FALLBACK_PRICES[id].usd);
    }
  });

  it('defaults a missing 24h change to zero instead of undefined', async () => {
    mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ [IDS[0]]: { usd: 99 } }),
      }),
    );

    const out = await getPrices([IDS[0]]);
    expect(out[IDS[0]].change24h) .toBe(0);
  });

  it('serves the cache inside the TTL instead of refetching', async () => {
    const f = mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          Object.fromEntries(IDS.map((id) => [id, { usd: 42, usd_24h_change: 0 }])),
      }),
    );

    await getPrices(IDS);
    await getPrices(IDS);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('refetches when forced', async () => {
    const f = mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          Object.fromEntries(IDS.map((id) => [id, { usd: 42, usd_24h_change: 0 }])),
      }),
    );

    await getPrices(IDS);
    await getPrices(IDS, true);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('de-duplicates concurrent refreshes into one request', async () => {
    const f = mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          Object.fromEntries(IDS.map((id) => [id, { usd: 42, usd_24h_change: 0 }])),
      }),
    );

    await Promise.all([getPrices(IDS), getPrices(IDS), getPrices(IDS)]);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('prefers a stale cache over the bundled table when a refresh fails', async () => {
    mockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          Object.fromEntries(IDS.map((id) => [id, { usd: 1234, usd_24h_change: 0 }])),
      }),
    );
    await getPrices(IDS);

    mockFetch(jest.fn().mockRejectedValue(new Error('offline')));
    const out = await getPrices(IDS, true);

    expect(out[IDS[0]].usd).toBe(1234);
  });
});

describe('getCachedPrices', () => {
  beforeEach(() => clearPriceCache());

  it('serves the bundled table when cold, so first paint is never blank', () => {
    const out = getCachedPrices(IDS);
    for (const id of IDS) {
      expect(out[id].usd).toBe(FALLBACK_PRICES[id].usd);
    }
  });

  it('serves live values once a fetch has populated the cache', async () => {
    (globalThis as unknown as { fetch: unknown }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => Object.fromEntries(IDS.map((id) => [id, { usd: 7, usd_24h_change: 0 }])),
    });

    await getPrices(IDS);
    expect(getCachedPrices(IDS)[IDS[0]].usd).toBe(7);
  });
});
