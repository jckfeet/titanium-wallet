import {
  fakeBitcoinAddress,
  fakeEvmAddress,
  fakeSignature,
  fakeSolanaAddress,
} from '../base58';

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

describe('fakeSolanaAddress', () => {
  it('lands in the 43-44 char band real addresses occupy', () => {
    const addr = fakeSolanaAddress('seed-1');
    expect(addr.length).toBeGreaterThanOrEqual(43);
    expect(addr.length).toBeLessThanOrEqual(44);
  });

  it('excludes the ambiguous base58 characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(fakeSolanaAddress(`seed-${i}`)).toMatch(BASE58);
    }
  });

  it('is deterministic per seed, so a wallet keeps its address', () => {
    expect(fakeSolanaAddress('acct')).toBe(fakeSolanaAddress('acct'));
    expect(fakeSolanaAddress('acct')).not.toBe(fakeSolanaAddress('other'));
  });
});

describe('fakeSignature', () => {
  it('is 87-88 base58 chars, matching a 64-byte signature', () => {
    const sig = fakeSignature('tx-1');
    expect(sig.length).toBeGreaterThanOrEqual(87);
    expect(sig.length).toBeLessThanOrEqual(88);
    expect(sig).toMatch(BASE58);
  });
});

describe('fakeEvmAddress', () => {
  it('is 0x plus exactly 40 lowercase hex chars', () => {
    expect(fakeEvmAddress('evm-1')).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it('is deterministic per seed', () => {
    expect(fakeEvmAddress('x')).toBe(fakeEvmAddress('x'));
  });
});

describe('fakeBitcoinAddress', () => {
  it('is bech32-shaped native segwit', () => {
    expect(fakeBitcoinAddress('btc-1')).toMatch(/^bc1q[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{38}$/);
  });

  it('is deterministic per seed', () => {
    expect(fakeBitcoinAddress('y')).toBe(fakeBitcoinAddress('y'));
  });
});
