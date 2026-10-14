/** Split selected cards before rendering so screen and print share page boundaries. */
export function qrCardPages<T>(cards: readonly T[]): T[][] {
  return printPages(cards, 8);
}

export function materialQrPages<T>(cards: readonly T[]): T[][] {
  return printPages(cards, 20);
}

export function homeworkCardPages<T>(cards: readonly T[]): T[][] {
  return printPages(cards, 25);
}

function printPages<T>(cards: readonly T[], capacity: number): T[][] {
  const pages: T[][] = [];
  for (let start = 0; start < cards.length; start += capacity) {
    pages.push(cards.slice(start, start + capacity));
  }
  return pages;
}
