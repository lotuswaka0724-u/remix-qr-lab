/** Split selected cards before rendering so screen and print share page boundaries. */
export function qrCardPages<T>(cards: readonly T[]): T[][] {
  const pages: T[][] = [];
  for (let start = 0; start < cards.length; start += 8) {
    pages.push(cards.slice(start, start + 8));
  }
  return pages;
}