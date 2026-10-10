import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/class-sync.functions", () => ({
  getClassState: vi.fn(async () => null),
  saveClassState: vi.fn(async () => ({ ok: true })),
}));

const store = await import("@/lib/homework-store");
const { getAppState, setState, snapshotCell, cellChanged, undoCellChange, correctHwState, cycleRecord, applyMaterialScan, earnedPoints, todayKey } = store;

const S = "st_1";
const A = "hw_1";
const B = "hw_2";

const tap = (fn: () => void, sid = S, aid = A) => {
  const before = snapshotCell(getAppState(), sid, aid);
  fn();
  const after = snapshotCell(getAppState(), sid, aid);
  return cellChanged(before, after) ? { before, after } : null;
};

beforeEach(() => {
  setState((s) => ({ ...s, records: {}, hwEvents: [], manualGrants: [], completeBonusLog: [], gachaLog: [] }));
});

describe("取り消し", () => {
  it("直しモードの操作を取り消すと状態とポイントが戻る", () => {
    applyMaterialScan(S, A);
    const pts = earnedPoints(getAppState(), S);
    const op = tap(() => correctHwState(S, A, "REDO"))!;
    expect(undoCellChange(op.before, op.after).ok).toBe(true);
    expect(getAppState().records[todayKey()]?.[S]?.[A]).toBe("submitted");
    expect(earnedPoints(getAppState(), S)).toBe(pts);
    // 履歴は消さずに無効として残る
    expect(getAppState().hwEvents.some((e) => e.state === "REDO" && e.undone && e.voided)).toBe(true);
  });

  it("学校モードで提出を置きかえた操作を取り消すと、元の提出が有効に戻る（二重加算なし）", () => {
    applyMaterialScan(S, A);
    const pts = earnedPoints(getAppState(), S);
    const op = tap(() => correctHwState(S, A, "SCHOOL_DONE"))!;
    undoCellChange(op.before, op.after);
    expect(earnedPoints(getAppState(), S)).toBe(pts);
    expect(getAppState().hwEvents.filter((e) => !e.voided).map((e) => e.state)).toEqual(["SUBMIT"]);
  });

  it("通常モードの切り替えを取り消すと未提出に戻る", () => {
    const op = tap(() => cycleRecord(S, A))!;
    expect(earnedPoints(getAppState(), S)).toBeGreaterThan(0);
    undoCellChange(op.before, op.after);
    expect(getAppState().records[todayKey()]?.[S]?.[A]).toBeUndefined();
    expect(earnedPoints(getAppState(), S)).toBe(0);
  });

  it("別の宿題には影響しない", () => {
    cycleRecord(S, B);
    const op = tap(() => cycleRecord(S, A))!;
    undoCellChange(op.before, op.after);
    expect(getAppState().records[todayKey()]?.[S]?.[B]).toBe("submitted");
  });

  it("操作後に同じ宿題が変わっていたら取り消さない", () => {
    const op = tap(() => cycleRecord(S, A))!;
    cycleRecord(S, A);
    expect(undoCellChange(op.before, op.after).ok).toBe(false);
    expect(getAppState().records[todayKey()]?.[S]?.[A]).toBe("redo");
  });

  it("変化のない操作は取り消し対象にならない", () => {
    correctHwState(S, A, "REDO");
    expect(tap(() => correctHwState(S, A, "REDO"))).toBeNull();
  });
});
