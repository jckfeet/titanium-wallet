/**
 * The demo token catalogue.
 *
 * Balances here are the factory defaults - they are fake, and the user can edit
 * every one of them from the hidden demo panel. `coingeckoId` is used to fetch
 * a *real* USD price so the totals look plausible; `fallbackPrice` keeps the
 * app fully usable offline.
 */

export type TokenId = string;

export interface Token {
  id: TokenId;
  symbol: string;
  name: string;
  /** CoinGecko coin id, or null for user-added custom tokens. */
  coingeckoId: string | null;
  /** Badge colour for the generated token icon. */
  color: string;
  /** Short glyph rendered inside the badge. */
  glyph: string;
  /** Factory-default holding. */
  defaultBalance: number;
  /** Used when the network is unavailable. */
  fallbackPrice: number;
  /** Custom tokens are user-created from the demo panel. */
  custom?: boolean;
}

export const DEFAULT_TOKENS: readonly Token[] = [
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    coingeckoId: 'solana',
    color: '#14F195',
    glyph: 'S',
    defaultBalance: 12.482,
    fallbackPrice: 152.34,
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    coingeckoId: 'usd-coin',
    color: '#2775CA',
    glyph: 'U',
    defaultBalance: 842.15,
    fallbackPrice: 1.0,
  },
  {
    id: 'bonk',
    symbol: 'BONK',
    name: 'Bonk',
    coingeckoId: 'bonk',
    color: '#F2A93B',
    glyph: 'B',
    defaultBalance: 14_820_400,
    fallbackPrice: 0.0000213,
  },
  {
    id: 'jupiter-exchange-solana',
    symbol: 'JUP',
    name: 'Jupiter',
    coingeckoId: 'jupiter-exchange-solana',
    color: '#48C3E6',
    glyph: 'J',
    defaultBalance: 1_240.5,
    fallbackPrice: 0.84,
  },
  {
    id: 'raydium',
    symbol: 'RAY',
    name: 'Raydium',
    coingeckoId: 'raydium',
    color: '#5B6CFF',
    glyph: 'R',
    defaultBalance: 96.34,
    fallbackPrice: 2.41,
  },
  {
    id: 'jito-governance-token',
    symbol: 'JTO',
    name: 'Jito',
    coingeckoId: 'jito-governance-token',
    color: '#8E7BF0',
    glyph: 'J',
    defaultBalance: 210.8,
    fallbackPrice: 2.18,
  },
  {
    id: 'pyth-network',
    symbol: 'PYTH',
    name: 'Pyth Network',
    coingeckoId: 'pyth-network',
    color: '#E6B0FF',
    glyph: 'P',
    defaultBalance: 1_860.0,
    fallbackPrice: 0.31,
  },
];

/** Palette offered when creating a custom token in the demo panel. */
export const CUSTOM_TOKEN_COLORS: readonly string[] = [
  '#AB9FF2',
  '#14F195',
  '#F2A93B',
  '#FC6B6B',
  '#48C3E6',
  '#5B6CFF',
  '#E6B0FF',
  '#21C577',
];

/** Static prices used before the first fetch resolves, and when offline. */
export const FALLBACK_PRICES: Record<string, { usd: number; usd_24h_change: number }> = {
  solana: { usd: 152.34, usd_24h_change: 2.41 },
  'usd-coin': { usd: 1.0, usd_24h_change: 0.01 },
  bonk: { usd: 0.0000213, usd_24h_change: -3.87 },
  'jupiter-exchange-solana': { usd: 0.84, usd_24h_change: 5.12 },
  raydium: { usd: 2.41, usd_24h_change: -1.24 },
  'jito-governance-token': { usd: 2.18, usd_24h_change: 1.87 },
  'pyth-network': { usd: 0.31, usd_24h_change: -0.94 },
};
