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

/**
 * A6両面カード：A4縦に上下2枚。表ページの直後に同じ並びの裏ページを置く。
 * カードは横幅いっぱいの中央配置なので、長辺とじで裏返しても同じ位置に同じ児童が来る。
 */
export function duplexCardSheets<T>(cards: readonly T[]): { front: T[]; back: T[] }[] {
  return printPages(cards, 2).map((page) => ({ front: page, back: page }));
}

function printPages<T>(cards: readonly T[], capacity: number): T[][] {
  const pages: T[][] = [];
  for (let start = 0; start < cards.length; start += capacity) {
    pages.push(cards.slice(start, start + capacity));
  }
  return pages;
}
