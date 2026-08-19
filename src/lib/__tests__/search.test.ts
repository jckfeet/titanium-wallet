import { scoreMatch, search } from '../search';

describe('scoreMatch', () => {
  it('scores nothing for an empty or whitespace query', () => {
    expect(scoreMatch(['SOL', 'Solana'], '')).toBe(0);
    expect(scoreMatch(['SOL', 'Solana'], '   ')).toBe(0);
  });

  it('scores nothing when no field contains the query', () => {
    expect(scoreMatch(['SOL', 'Solana'], 'zzz')).toBe(0);
  });

  it('ranks exact above prefix above substring', () => {
    const exact = scoreMatch(['sol'], 'sol');
    const prefix = scoreMatch(['solana'], 'sol');
    const substring = scoreMatch(['parasol'], 'sol');
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(0);
  });

  it('weights earlier fields more heavily', () => {
    const inSymbol = scoreMatch(['abc', 'zzz'], 'abc');
    const inName = scoreMatch(['zzz', 'abc'], 'abc');
    expect(inSymbol).toBeGreaterThan(inName);
  });

  it('is case and whitespace insensitive', () => {
    expect(scoreMatch(['Solana'], '  SOLANA  ')).toBe(scoreMatch(['solana'], 'solana'));
  });

  it('skips empty fields without throwing', () => {
    expect(scoreMatch(['', 'sol'], 'sol')).toBeGreaterThan(0);
  });
});

describe('search', () => {
  const tokens = [
    { symbol: 'SAGA', name: 'Saga' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BONK', name: 'Bonk' },
    { symbol: 'USDC', name: 'USD Coin' },
  ];
  const fields = (t: { symbol: string; name: string }) => [t.symbol, t.name];

  it('returns nothing for an empty query rather than everything', () => {
    expect(search(tokens, '', fields)).toEqual([]);
  });

  it('surfaces the exact symbol first', () => {
    expect(search(tokens, 'sol', fields)[0].symbol).toBe('SOL');
  });

  it('finds by name as well as symbol', () => {
    expect(search(tokens, 'coin', fields).map((t) => t.symbol)).toEqual(['USDC']);
  });

  it('excludes non-matches entirely', () => {
    expect(search(tokens, 'ethereum', fields)).toEqual([]);
  });

  it('keeps catalogue order for equally-scored matches', () => {
    const items = [{ symbol: 'AAA', name: 'x' }, { symbol: 'AAB', name: 'x' }];
    expect(search(items, 'aa', (t) => [t.symbol]).map((t) => t.symbol)).toEqual(['AAA', 'AAB']);
  });

  it('matches case-insensitively', () => {
    expect(search(tokens, 'BoNk', fields).map((t) => t.symbol)).toEqual(['BONK']);
  });
});
