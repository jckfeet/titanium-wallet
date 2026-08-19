import { hashString, makeRng, rngInt, rngNormal, rngPick, rngRange } from '../random';

describe('hashString', () => {
  it('is stable and returns an unsigned 32-bit value', () => {
    expect(hashString('sol:1D')).toBe(hashString('sol:1D'));
    expect(hashString('sol:1D')).toBeGreaterThanOrEqual(0);
    expect(hashString('sol:1D')).toBeLessThan(2 ** 32);
  });

  it('separates seeds that differ by one character', () => {
    expect(hashString('sol:1D')).not.toBe(hashString('sol:1W'));
  });
});

describe('makeRng', () => {
  it('replays the identical stream for the same seed', () => {
    const a = makeRng('btc:1M');
    const b = makeRng('btc:1M');
    const drawA = Array.from({ length: 20 }, () => a());
    const drawB = Array.from({ length: 20 }, () => b());
    expect(drawA).toEqual(drawB);
  });

  it('diverges for different seeds', () => {
    const a = makeRng('btc:1M');
    const b = makeRng('eth:1M');
    expect(a()).not.toBe(b());
  });

  it('stays within [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 500; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('rng helpers', () => {
  it('rngRange respects its bounds', () => {
    const rng = makeRng('range');
    for (let i = 0; i < 200; i++) {
      const v = rngRange(rng, 5, 10);
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThan(10);
    }
  });

  it('rngInt is inclusive at both ends', () => {
    const rng = makeRng('int');
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rngInt(rng, 0, 3));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('rngPick only ever returns a member of the list', () => {
    const rng = makeRng('pick');
    const items = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 100; i++) expect(items).toContain(rngPick(rng, items));
  });

  it('rngNormal produces a roughly standard normal', () => {
    const rng = makeRng('normal');
    const samples = Array.from({ length: 5000 }, () => rngNormal(rng));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const sd = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);
    expect(Math.abs(mean)).toBeLessThan(0.1);
    expect(sd).toBeGreaterThan(0.9);
    expect(sd).toBeLessThan(1.1);
  });

  it('rngNormal never returns NaN even when the uniform draw is zero', () => {
    expect(Number.isNaN(rngNormal(() => 0))).toBe(false);
  });
});
