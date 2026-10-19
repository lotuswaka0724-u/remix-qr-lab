import { describe, expect, it } from "vitest";

import { earnedPoints, type AppState } from "@/lib/homework-store";

/** earnedPoints のキャッシュが「状態オブジェクトの同一性」だけで判断されることを確認する */
const baseState = (): AppState =>
  ({
    students: [{ id: "s1", name: "児童1", className: "1組", number: 1 }],
    assignments: [{ id: "a1", name: "音読", inToday: true }],
    records: {},
    hwEvents: [],
    manualGrants: [],
    completeBonusLog: [],
    pointRules: { SUBMIT: 2 },
    rankRules: {},
    hwPointRules: {},
    settings: {},
    gameSettings: {},
    usageRules: {},
    prizes: [],
    gachaLog: [],
  }) as unknown as AppState;

describe("earnedPoints のキャッシュ", () => {
  it("同じ状態オブジェクトでは同じ結果を返す", () => {
    const s = baseState();
    s.records = { "2026-10-19": { s1: { a1: "SUBMIT" } } };
    expect(earnedPoints(s, "s1")).toBe(2);
    expect(earnedPoints(s, "s1")).toBe(2);
  });

  it("状態が新しいオブジェクトに変わると古いキャッシュを使わず再計算する", () => {
    const before = baseState();
    before.records = { "2026-10-19": { s1: { a1: "SUBMIT" } } };
    expect(earnedPoints(before, "s1")).toBe(2);

    // 記録が増えた新しい状態（setState は常に新しいオブジェクトを作る）
    const after = { ...before, records: { "2026-10-19": { s1: { a1: "SUBMIT" } }, "2026-10-20": { s1: { a1: "SUBMIT" } } } };
    expect(earnedPoints(after, "s1")).toBe(4);
  });

  it("別の児童のキャッシュが混ざらない", () => {
    const s = baseState();
    s.students = [
      { id: "s1", name: "児童1", className: "1組", number: 1 },
      { id: "s2", name: "児童2", className: "1組", number: 2 },
    ];
    s.records = { "2026-10-19": { s1: { a1: "SUBMIT" } } };
    expect(earnedPoints(s, "s1")).toBe(2);
    expect(earnedPoints(s, "s2")).toBe(0);
  });
});
