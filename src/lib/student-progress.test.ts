import { describe, expect, it } from "vitest";

import { nextCompleteBonus, nextRankInfo } from "@/lib/student-progress";

const rules = { NORMAL: 0, GOLD: 100, BLACK: 300 };

describe("つぎのランクまでの表示は通算ポイントで決まる", () => {
  it("通算77ptなら GOLD まで あと23pt", () => {
    expect(nextRankInfo(rules, 77)).toMatchObject({ current: "NORMAL", next: "GOLD", need: 23 });
  });
  it("通算100ptちょうどで GOLD になり、BLACK まで あと200pt", () => {
    expect(nextRankInfo(rules, 100)).toMatchObject({ current: "GOLD", next: "BLACK", need: 200 });
  });
  it("通算300pt以上は さいこうランクで、つぎはない", () => {
    expect(nextRankInfo(rules, 340)).toMatchObject({ current: "BLACK", next: null, need: 0 });
  });
  it("先生が基準を変えたら、その基準で計算する", () => {
    expect(nextRankInfo({ NORMAL: 0, GOLD: 50, BLACK: 120 }, 60)).toMatchObject({
      current: "GOLD",
      next: "BLACK",
      need: 60,
    });
  });
});

describe("コンプリートボーナスは5回ごと", () => {
  it("通算7回なら つぎは10回目で あと3回", () => {
    expect(nextCompleteBonus(7)).toEqual({ at: 10, left: 3 });
  });
  it("通算10回ちょうどなら つぎは15回目で あと5回", () => {
    expect(nextCompleteBonus(10)).toEqual({ at: 15, left: 5 });
  });
});
