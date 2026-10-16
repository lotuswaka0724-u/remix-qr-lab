import { describe, expect, it } from "vitest";
import { tieRank } from "@/lib/homework-store";

describe("tieRank（同点は同じ順位）", () => {
  const list = [{ points: 30 }, { points: 20 }, { points: 20 }, { points: 10 }];
  it("同点の児童は同じ順位になる", () => {
    expect(tieRank(list, 1)).toBe(2);
    expect(tieRank(list, 2)).toBe(2);
  });
  it("同位の次は飛び番になる（1位が2人なら次は3位）", () => {
    expect(tieRank([{ points: 5 }, { points: 5 }, { points: 4 }], 2)).toBe(3);
  });
  it("先頭は常に1位", () => {
    expect(tieRank(list, 0)).toBe(1);
  });
});
