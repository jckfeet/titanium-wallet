/**
 * Cosmetic Solana-style identifiers.
 *
 * These are random strings in the right alphabet and length band - there is no
 * key material, no checksum and no curve maths anywhere in this app.
 */
import { makeRng, rngInt } from './random';

/** Bitcoin/Solana base58 alphabet: no 0, O, I or l. */
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomBase58(rng: () => number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += BASE58[rngInt(rng, 0, BASE58.length - 1)];
  return out;
}

/** Solana addresses are 32-byte keys, which base58-encode to 43-44 chars. */
export function fakeSolanaAddress(seed?: string): string {
  const rng = makeRng(seed ?? `addr-${Math.random()}`);
  return randomBase58(rng, rngInt(rng, 43, 44));
}

/** Solana signatures are 64 bytes, so 87-88 base58 chars. */
export function fakeSignature(seed?: string): string {
  const rng = makeRng(seed ?? `sig-${Math.random()}`);
  return randomBase58(rng, rngInt(rng, 87, 88));
}

const HEX = '0123456789abcdef';

/** EVM-style `0x` + 40 hex chars, for the Ethereum and Polygon receive rows. */
export function fakeEvmAddress(seed?: string): string {
  const rng = makeRng(seed ?? `evm-${Math.random()}`);
  let out = '0x';
  for (let i = 0; i < 40; i++) out += HEX[rngInt(rng, 0, 15)];
  return out;
}

/** Bech32-shaped native segwit address, purely for display. */
export function fakeBitcoinAddress(seed?: string): string {
  const rng = makeRng(seed ?? `btc-${Math.random()}`);
  const charset = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  let out = 'bc1q';
  for (let i = 0; i < 38; i++) out += charset[rngInt(rng, 0, charset.length - 1)];
  return out;
}
