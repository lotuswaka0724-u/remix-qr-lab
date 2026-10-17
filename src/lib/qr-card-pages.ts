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

/**
 * カード内のQR格子：n個を幅w×高さh(mm)に収め、QRが最大になる列数とQR一辺(mm)を返す。
 * 1マスにはQRのほか宿題名ラベル(labelH)と余白(gap)が入る。
 */
export function qrGridFit(n: number, w: number, h: number, labelH = 4.5, gap = 2) {
  let best = { cols: 1, size: 0 };
  for (let cols = 1; cols <= Math.max(1, n); cols++) {
    const rows = Math.ceil(Math.max(1, n) / cols);
    const size = Math.min((w - gap * (cols - 1)) / cols - 3, (h - gap * (rows - 1)) / rows - labelH - 3);
    if (size > best.size) best = { cols, size };
  }
  return { cols: best.cols, size: Math.max(0, Math.floor(best.size * 10) / 10) };
}

function printPages<T>(cards: readonly T[], capacity: number): T[][] {
  const pages: T[][] = [];
  for (let start = 0; start < cards.length; start += capacity) {
    pages.push(cards.slice(start, start + capacity));
  }
  return pages;
}
