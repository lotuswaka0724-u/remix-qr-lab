import { describe, expect, it } from "vitest";
import { homeworkCardPages, materialQrPages, qrCardPages } from "./qr-card-pages";

describe("A4 QR cards", () => {
  it("keeps eight students on one page", () => {
    const cards = Array.from({ length: 8 }, (_, i) => `student-${i + 1}`);
    expect(qrCardPages(cards)).toEqual([cards]);
  });

  it("places the ninth student on the next page without losing or duplicating cards", () => {
    const cards = Array.from({ length: 17 }, (_, i) => `student-${i + 1}`);
    const pages = qrCardPages(cards);
    expect(pages.map((page) => page.length)).toEqual([8, 8, 1]);
    expect(pages[1]?.[0]).toBe("student-9");
    expect(pages[2]?.[0]).toBe("student-17");
    expect(pages.flat()).toEqual(cards);
  });
});

describe("A4 material QR", () => {
  it("keeps 20 per page and moves the 21st to the next page in order", () => {
    const cards = Array.from({ length: 41 }, (_, i) => `material-${i + 1}`);
    const pages = materialQrPages(cards);
    expect(pages.map((page) => page.length)).toEqual([20, 20, 1]);
    expect(pages[1]?.[0]).toBe("material-21");
    expect(pages.flat()).toEqual(cards);
  });
});

describe("A4 homework cards", () => {
  it("keeps 25 per page and moves the 26th to the next page in order", () => {
    const cards = Array.from({ length: 51 }, (_, i) => `homework-${i + 1}`);
    const pages = homeworkCardPages(cards);
    expect(pages.map((page) => page.length)).toEqual([25, 25, 1]);
    expect(pages[1]?.[0]).toBe("homework-26");
    expect(pages.flat()).toEqual(cards);
  });
});

describe("A6 duplex cards", () => {
  it("puts 2 students per A4 sheet and the same students in the same order on the back", async () => {
    const { duplexCardSheets } = await import("./qr-card-pages");
    const cards = ["a", "b", "c", "d", "e"];
    const sheets = duplexCardSheets(cards);
    expect(sheets.map((s) => s.front)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    for (const s of sheets) expect(s.back).toEqual(s.front);
  });
});

import { qrGridFit } from "./qr-card-pages";
describe("qrGridFit", () => {
  it("shrinks QR as count grows and stays inside the card area", () => {
    const sizes = [1, 2, 4, 8, 15].map((n) => {
      const f = qrGridFit(n, 132, 62);
      const rows = Math.ceil(n / f.cols);
      expect(f.cols * (f.size + 3) + (f.cols - 1) * 2).toBeLessThanOrEqual(132);
      expect(rows * (f.size + 7.5) + (rows - 1) * 2).toBeLessThanOrEqual(62);
      return f.size;
    });
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]!);
  });
});
