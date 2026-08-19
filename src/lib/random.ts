/**
 * Deterministic pseudo-randomness.
 *
 * Chart history has to look identical every time a screen is opened, so every
 * generated series is derived from a string seed rather than `Math.random`.
 */

/** FNV-1a - turns a seed string into a 32-bit integer. */
export function hashString(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 - small, fast, and good enough for cosmetic data. */
export function makeRng(seed: string | number): () => number {
  let state = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform float in `[min, max)`. */
export function rngRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Uniform integer in `[min, max]`. */
export function rngInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rngRange(rng, min, max + 1));
}

export function rngPick<T>(rng: () => number, items: readonly T[]): T {
  return items[rngInt(rng, 0, items.length - 1)];
}

/**
 * Box-Muller normal sample. Random walks built from normal steps look far more
 * like a real price series than uniform steps do.
 */
export function rngNormal(rng: () => number): number {
  const u = Math.max(rng(), Number.EPSILON);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Non-deterministic id for records created during a session. */
export function randomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
