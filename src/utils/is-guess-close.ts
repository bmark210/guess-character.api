export function isGuessCloseEnough(
  original: string,
  guess: string,
  threshold = 0.8,
): boolean {
  // Приводим к нижнему регистру и убираем лишние пробелы
  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-zа-я0-9 ]/gi, '')
      .trim()
      .replace(/\s+/g, ' ');

  const a = clean(original);
  const b = clean(guess);

  const distance = levenshteinDistance(a, b);
  const similarity = 1 - distance / Math.max(a.length, b.length);

  return similarity >= threshold;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) =>
      i === 0 ? j : j === 0 ? i : 0,
    ),
  );

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // удаление
        matrix[i][j - 1] + 1, // вставка
        matrix[i - 1][j - 1] + cost, // замена
      );
    }
  }

  return matrix[b.length][a.length];
}
