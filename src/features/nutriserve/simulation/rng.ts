// Seeded PRNG (mulberry32). The generator state is one uint32 kept in GameState, so a saved game
// resumes the exact same random sequence.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** Pick with integer weights (same length as items). */
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  readonly state: number;
}

export function createRng(initialState: number): Rng {
  let state = initialState >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let r = Math.imul(state ^ (state >>> 15), state | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    next,
    int(min, max) {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick(items) {
      if (items.length === 0) throw new RangeError('pick from empty list');
      return items[Math.floor(next() * items.length)];
    },
    weighted(items, weights) {
      if (items.length === 0 || items.length !== weights.length) throw new RangeError('bad weighted pick');
      const total = weights.reduce((a, b) => a + b, 0);
      let roll = next() * total;
      for (let i = 0; i < items.length; i++) {
        roll -= weights[i];
        if (roll < 0) return items[i];
      }
      return items[items.length - 1];
    },
    get state() {
      return state;
    },
  };
  return rng;
}

/** Turn any string or number into a uint32 seed. */
export function seedFrom(value: string | number): number {
  const text = String(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
