import { Difficulty, HintLevel } from '@prisma/client';

/**
 * Base scores per difficulty level.
 */
const BASE_POINTS: Record<Difficulty, number> = {
  [Difficulty.EASY]: 10,
  [Difficulty.MEDIUM]: 20,
  [Difficulty.HARD]: 30,
};

/**
 * Penalty applied for each hint level used.
 * You can adjust these values if you change hint-level semantics.
 */
const HINT_LEVEL_PENALTIES: Record<HintLevel, number> = {
  [HintLevel.ONE]: 0.1,
  [HintLevel.TWO]: 0.2,
  [HintLevel.THREE]: 0.3,
  [HintLevel.FOUR]: 0.4,
};

/**
 * Calculates the final score for a given difficulty after applying hint penalties.
 *
 * @param difficulty – the challenge difficulty
 * @param hintLevels – array of hint levels the player used
 * @returns the rounded final score
 * @throws if the difficulty is not recognized
 */
export function calculatePlusRating(
  difficulty: Difficulty,
  hintLevels: HintLevel[],
): number {
  const baseScore = BASE_POINTS[difficulty];
  if (baseScore === undefined) {
    throw new Error(`Unknown difficulty: ${difficulty}`);
  }

  // Sum up penalties for exactly the hint levels used
  const totalPenalty = hintLevels
    .map((level) => HINT_LEVEL_PENALTIES[level] ?? 0)
    .reduce((sum, penalty) => sum + penalty, 0);

  const multiplier = Math.max(0, 1 - totalPenalty);
  return Math.round(baseScore * multiplier);
}
