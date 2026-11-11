import { generateProblem } from './problems';

/** Evaluates our problem text (×, −, +; × binds tighter) to check the stated answer. */
function evaluate(text: string): number {
  const js = text.replaceAll('×', '*').replaceAll('−', '-');
  return Function(`"use strict"; return (${js});`)() as number;
}

/** Small seeded PRNG (mulberry32) so failures are reproducible. */
function seeded(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe.each(['easy', 'medium', 'hard'] as const)('%s problems', (difficulty) => {
  const random = seeded(42);
  const problems = Array.from({ length: 500 }, () => generateProblem(difficulty, random));

  it('state the correct, non-negative integer answer', () => {
    for (const problem of problems) {
      expect(evaluate(problem.text)).toBe(problem.answer);
      expect(Number.isInteger(problem.answer)).toBe(true);
      expect(problem.answer).toBeGreaterThanOrEqual(0);
    }
  });

  it('fit on the keypad', () => {
    for (const problem of problems) {
      expect(String(problem.answer).length).toBeLessThanOrEqual(6);
    }
  });
});

it('scales with difficulty', () => {
  const random = seeded(7);
  const max = (difficulty: 'easy' | 'hard') =>
    Math.max(...Array.from({ length: 200 }, () => generateProblem(difficulty, random).answer));
  expect(max('easy')).toBeLessThanOrEqual(40);
  expect(max('hard')).toBeGreaterThan(100);
});

it('is deterministic for a given random source', () => {
  expect(generateProblem('medium', seeded(1))).toEqual(generateProblem('medium', seeded(1)));
});
