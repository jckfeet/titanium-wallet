/**
 * Static dApp directory for the Explore tab.
 *
 * Names and one-line descriptions only - no logos are bundled. Rows are inert;
 * tapping one opens an in-app "demo only" sheet instead of a browser.
 */

export interface Dapp {
  id: string;
  name: string;
  category: string;
  blurb: string;
  /** Badge colour and letter for the generated icon. */
  color: string;
  glyph: string;
}

export interface DappSection {
  title: string;
  items: Dapp[];
}

export const DAPP_SECTIONS: readonly DappSection[] = [
  {
    title: 'Trending',
    items: [
      {
        id: 'jupiter',
        name: 'Jupiter',
        category: 'DEX aggregator',
        blurb: 'Routes a swap across every Solana liquidity venue at once.',
        color: '#48C3E6',
        glyph: 'J',
      },
      {
        id: 'raydium',
        name: 'Raydium',
        category: 'Exchange',
        blurb: 'Automated market maker and liquidity pools.',
        color: '#5B6CFF',
        glyph: 'R',
      },
      {
        id: 'marinade',
        name: 'Marinade',
        category: 'Staking',
        blurb: 'Liquid staking that keeps your SOL usable while it earns.',
        color: '#21C577',
        glyph: 'M',
      },
      {
        id: 'tensor',
        name: 'Tensor',
        category: 'NFT marketplace',
        blurb: 'Trading terminal for Solana collectibles.',
        color: '#E6B0FF',
        glyph: 'T',
      },
    ],
  },
  {
    title: 'DeFi',
    items: [
      {
        id: 'orca',
        name: 'Orca',
        category: 'Exchange',
        blurb: 'Concentrated liquidity pools with a friendly front end.',
        color: '#F2A93B',
        glyph: 'O',
      },
      {
        id: 'kamino',
        name: 'Kamino',
        category: 'Lending',
        blurb: 'Automated liquidity vaults and borrowing markets.',
        color: '#8E7BF0',
        glyph: 'K',
      },
      {
        id: 'drift',
        name: 'Drift',
        category: 'Perpetuals',
        blurb: 'On-chain perpetual futures and margin trading.',
        color: '#FC6B6B',
        glyph: 'D',
      },
      {
        id: 'meteora',
        name: 'Meteora',
        category: 'Liquidity',
        blurb: 'Dynamic vaults that rebalance across pools.',
        color: '#14F195',
        glyph: 'M',
      },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      {
        id: 'pyth',
        name: 'Pyth Network',
        category: 'Oracles',
        blurb: 'First-party market data published on chain.',
        color: '#C6BBFF',
        glyph: 'P',
      },
      {
        id: 'jito',
        name: 'Jito',
        category: 'Staking',
        blurb: 'Liquid staking with MEV rewards routed back to stakers.',
        color: '#8E7BF0',
        glyph: 'J',
      },
      {
        id: 'helius',
        name: 'Helius',
        category: 'Developer tools',
        blurb: 'RPC endpoints, webhooks and indexing APIs.',
        color: '#F5A623',
        glyph: 'H',
      },
      {
        id: 'squads',
        name: 'Squads',
        category: 'Multisig',
        blurb: 'Shared treasury management for teams.',
        color: '#9A9AA3',
        glyph: 'S',
      },
    ],
  },
];

/** Flat list used by the search filter. */
export const ALL_DAPPS: readonly Dapp[] = DAPP_SECTIONS.flatMap((section) => section.items);
