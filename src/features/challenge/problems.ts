import type { Difficulty } from '@/features/alarms/model';

export type Problem = {
  /** What's shown, e.g. "7 × 8". Uses real math symbols (×, −). */
  text: string;
  /** Always a non-negative integer, so the numeric keypad can enter it. */
  answer: number;
};

type Random = () => number;

/** Inclusive random integer in [min, max]. */
function int(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function addOrSubtract(random: Random, min: number, max: number): Problem {
  const a = int(random, min, max);
  const b = int(random, min, max);
  if (random() < 0.5) return { text: `${a} + ${b}`, answer: a + b };
  const [big, small] = a >= b ? [a, b] : [b, a];
  return { text: `${big} − ${small}`, answer: big - small };
}

function multiply(random: Random, min: number, max: number): Problem {
  const a = int(random, min, max);
  const b = int(random, min, max);
  return { text: `${a} × ${b}`, answer: a * b };
}

const generators: Record<Difficulty, (random: Random) => Problem> = {
  // Warm-up: single and small double digits, + and −.
  easy: (random) => addOrSubtract(random, 2, 20),
  // Times tables or two-digit + and −.
  medium: (random) => (random() < 0.5 ? multiply(random, 3, 12) : addOrSubtract(random, 11, 99)),
  // Two steps: a product plus or minus a two-digit number.
  hard: (random) => {
    const a = int(random, 6, 15);
    const b = int(random, 3, 12);
    const c = int(random, 11, 59);
    const product = a * b;
    if (random() < 0.5 || c > product) {
      return { text: `${a} × ${b} + ${c}`, answer: product + c };
    }
    return { text: `${a} × ${b} − ${c}`, answer: product - c };
  },
};

/** A random problem at the given difficulty. Pass `random` to make it deterministic (tests). */
export function generateProblem(difficulty: Difficulty, random: Random = Math.random): Problem {
  return generators[difficulty](random);
}
