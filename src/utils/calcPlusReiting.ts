import { Difficulty, HintLevel } from '@prisma/client';

const BASE_POINTS: Record<Difficulty, number> = {
  [Difficulty.EASY]: 100,
  [Difficulty.MEDIUM]: 200,
  [Difficulty.HARD]: 300,
};

const HINT_PENALTIES = [0.1, 0.2, 0.3, 0.4];

function hintLevelsToHintsUsed(hintLevels: HintLevel[]): number {
  return hintLevels.length;
}

export function calculatePlusRating(
  difficulty: Difficulty,
  hintLevels: HintLevel[],
): number {
  const baseScore = BASE_POINTS[difficulty];

  const hintsUsed = hintLevelsToHintsUsed(hintLevels);

  const totalPenalty = HINT_PENALTIES.slice(0, hintsUsed).reduce(
    (acc, penalty) => acc + penalty,
    0,
  );

  const finalScore = Math.round(baseScore * Math.max(0, 1 - totalPenalty));

  return finalScore;
}
