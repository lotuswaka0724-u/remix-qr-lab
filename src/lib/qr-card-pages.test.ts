import { describe, expect, it } from "vitest";
import { qrCardPages } from "./qr-card-pages";

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