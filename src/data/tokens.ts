/**
 * The demo asset catalogue.
 *
 * Two kinds of asset share one model so the portfolio, manage-list and demo
 * panel can treat them uniformly:
 *   - `crypto` priced from CoinGecko
 *   - `stock`  priced from the Yahoo Finance chart endpoint
 *
 * Balances are the factory defaults - all fake, all editable from the hidden
 * demo panel. `logoUrl` points at the issuer's own artwork, loaded at runtime
 * rather than bundled; `color`/`glyph` render a generated badge whenever an
 * image is unavailable or the device is offline.
 */

export type TokenId = string;
export type AssetKind = 'crypto' | 'stock';

export interface Token {
  id: TokenId;
  symbol: string;
  name: string;
  kind: AssetKind;
  /** CoinGecko coin id (crypto) or ticker (stock). Null for custom tokens. */
  coingeckoId: string | null;
  /** Remote logo. Falls back to the generated badge if it fails to load. */
  logoUrl?: string;
  /** Shown with a verification tick in the asset list, as a real wallet would. */
  verified?: boolean;
  /** Badge colour for the generated fallback icon. */
  color: string;
  /** Short glyph rendered inside the fallback badge. */
  glyph: string;
  /** Factory-default holding. */
  defaultBalance: number;
  /** Used before the first fetch resolves and whenever the network is down. */
  fallbackPrice: number;
  /** Custom tokens are user-created from the demo panel. */
  custom?: boolean;
}

const coinLogo = (path: string) => `https://coin-images.coingecko.com/coins/images/${path}`;
/** Financial Modeling Prep serves plain PNGs, which React Native can render. */
const stockLogo = (ticker: string) =>
  `https://financialmodelingprep.com/image-stock/${ticker}.png`;

export const DEFAULT_TOKENS: readonly Token[] = [
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    kind: 'crypto',
    coingeckoId: 'ethereum',
    logoUrl: coinLogo('279/large/ethereum.png?1696501628'),
    verified: true,
    color: '#627EEA',
    glyph: 'E',
    defaultBalance: 71.83,
    fallbackPrice: 1909.58,
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    kind: 'crypto',
    coingeckoId: 'solana',
    logoUrl: coinLogo('4128/large/solana.png?1718769756'),
    verified: true,
    color: '#14F195',
    glyph: 'S',
    defaultBalance: 271.72,
    fallbackPrice: 76.97,
  },
  {
    id: 'tether',
    symbol: 'USDT',
    name: 'USDT',
    kind: 'crypto',
    coingeckoId: 'tether',
    logoUrl: coinLogo('325/large/Tether.png?1696501661'),
    verified: true,
    color: '#26A17B',
    glyph: 'T',
    defaultBalance: 3827.65,
    fallbackPrice: 0.999,
  },
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    kind: 'crypto',
    coingeckoId: 'bitcoin',
    logoUrl: coinLogo('1/large/bitcoin.png?1696501400'),
    verified: true,
    color: '#F7931A',
    glyph: 'B',
    defaultBalance: 0,
    fallbackPrice: 64274,
  },
  {
    id: 'sui',
    symbol: 'SUI',
    name: 'Sui',
    kind: 'crypto',
    coingeckoId: 'sui',
    logoUrl: coinLogo('26375/large/sui-ocean-square.png?1727791290'),
    verified: true,
    color: '#4DA2FF',
    glyph: 'S',
    defaultBalance: 0,
    fallbackPrice: 0.656,
  },
  {
    id: 'matic-network',
    symbol: 'MATIC',
    name: 'Polygon',
    kind: 'crypto',
    coingeckoId: 'matic-network',
    logoUrl: coinLogo('4713/large/polygon.png?1698233745'),
    verified: true,
    color: '#8247E5',
    glyph: 'P',
    defaultBalance: 0,
    fallbackPrice: 0.126,
  },
  {
    id: 'usd-coin',
    symbol: 'USDC',
    name: 'USD Coin',
    kind: 'crypto',
    coingeckoId: 'usd-coin',
    logoUrl: coinLogo('6319/large/USDC.png?1769615602'),
    verified: true,
    color: '#2775CA',
    glyph: 'U',
    defaultBalance: 842.15,
    fallbackPrice: 1.0,
  },
  {
    id: 'bonk',
    symbol: 'BONK',
    name: 'Bonk',
    kind: 'crypto',
    coingeckoId: 'bonk',
    logoUrl: coinLogo('28600/large/bonk.jpg?1696527587'),
    color: '#F2A93B',
    glyph: 'B',
    defaultBalance: 14_820_400,
    fallbackPrice: 0.0000213,
  },
  {
    id: 'jupiter-exchange-solana',
    symbol: 'JUP',
    name: 'Jupiter',
    kind: 'crypto',
    coingeckoId: 'jupiter-exchange-solana',
    logoUrl: coinLogo('34188/large/jup.png?1704266489'),
    verified: true,
    color: '#48C3E6',
    glyph: 'J',
    defaultBalance: 1_240.5,
    fallbackPrice: 0.84,
  },
  {
    id: 'raydium',
    symbol: 'RAY',
    name: 'Raydium',
    kind: 'crypto',
    coingeckoId: 'raydium',
    logoUrl: coinLogo('13928/large/PSigc4ie_400x400.jpg?1696513668'),
    color: '#5B6CFF',
    glyph: 'R',
    defaultBalance: 96.34,
    fallbackPrice: 2.41,
  },

  // ---------------------------------------------------------------- stocks
  {
    id: 'stock-AAPL',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    kind: 'stock',
    coingeckoId: 'AAPL',
    logoUrl: stockLogo('AAPL'),
    verified: true,
    color: '#A2AAAD',
    glyph: 'A',
    defaultBalance: 42.5,
    fallbackPrice: 310.03,
  },
  {
    id: 'stock-NVDA',
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    kind: 'stock',
    coingeckoId: 'NVDA',
    logoUrl: stockLogo('NVDA'),
    verified: true,
    color: '#76B900',
    glyph: 'N',
    defaultBalance: 68.0,
    fallbackPrice: 178.2,
  },
  {
    id: 'stock-TSLA',
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    kind: 'stock',
    coingeckoId: 'TSLA',
    logoUrl: stockLogo('TSLA'),
    verified: true,
    color: '#E82127',
    glyph: 'T',
    defaultBalance: 23.4,
    fallbackPrice: 421.5,
  },
  {
    id: 'stock-MSFT',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    kind: 'stock',
    coingeckoId: 'MSFT',
    logoUrl: stockLogo('MSFT'),
    verified: true,
    color: '#00A4EF',
    glyph: 'M',
    defaultBalance: 15.0,
    fallbackPrice: 512.8,
  },
  {
    id: 'stock-SPY',
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    kind: 'stock',
    coingeckoId: 'SPY',
    logoUrl: stockLogo('SPY'),
    verified: true,
    color: '#1E5AA8',
    glyph: 'S',
    defaultBalance: 0,
    fallbackPrice: 682.4,
  },
];

/** Tickers the stock price service should fetch. */
export const STOCK_TICKERS: readonly string[] = DEFAULT_TOKENS.filter(
  (t) => t.kind === 'stock',
).map((t) => t.symbol);

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
  ethereum: { usd: 1909.58, usd_24h_change: -2.23 },
  solana: { usd: 76.97, usd_24h_change: -2.2 },
  tether: { usd: 0.999, usd_24h_change: -0.01 },
  bitcoin: { usd: 64274, usd_24h_change: 1.12 },
  sui: { usd: 0.656, usd_24h_change: -3.4 },
  'matic-network': { usd: 0.126, usd_24h_change: -1.8 },
  'usd-coin': { usd: 1.0, usd_24h_change: 0.01 },
  bonk: { usd: 0.0000213, usd_24h_change: -3.87 },
  'jupiter-exchange-solana': { usd: 0.84, usd_24h_change: 5.12 },
  raydium: { usd: 2.41, usd_24h_change: -1.24 },
  AAPL: { usd: 310.03, usd_24h_change: 1.45 },
  NVDA: { usd: 178.2, usd_24h_change: 2.31 },
  TSLA: { usd: 421.5, usd_24h_change: -1.87 },
  MSFT: { usd: 512.8, usd_24h_change: 0.64 },
  SPY: { usd: 682.4, usd_24h_change: 0.38 },
};
