import { describe, expect, it } from "vitest";

import { afterFailure, lockRemainingMs, TEACHER_GLOBAL, TEACHER_PER_SOURCE } from "./login-limit";

const rule = TEACHER_PER_SOURCE;
const t0 = Date.UTC(2026, 9, 14, 0, 0, 0);

function fail(times: number, start = t0) {
  let row: { count: number; window_start: string } | null = null;
  for (let i = 0; i < times; i++) row = afterFailure(row, rule, start + i * 1000);
  return row;
}

describe("先生ログインの失敗回数制限", () => {
  it("4回失敗まではログインを試せる", () => {
    expect(lockRemainingMs(fail(4), rule, t0 + 5000)).toBe(0);
  });

  it("5回失敗すると制限される", () => {
    expect(lockRemainingMs(fail(5), rule, t0 + 5000)).toBeGreaterThan(0);
  });

  it("待ち時間は最初の失敗から15分", () => {
    expect(lockRemainingMs(fail(5), rule, t0 + 60_000)).toBe(14 * 60 * 1000);
  });

  it("15分たつと制限が解除される", () => {
    expect(lockRemainingMs(fail(5), rule, t0 + 15 * 60 * 1000)).toBe(0);
  });

  it("解除後の失敗は1回目から数えなおす", () => {
    expect(afterFailure(fail(5), rule, t0 + 16 * 60 * 1000).count).toBe(1);
  });

  it("全体の上限は30回", () => {
    let row: { count: number; window_start: string } | null = null;
    for (let i = 0; i < 29; i++) row = afterFailure(row, TEACHER_GLOBAL, t0);
    expect(lockRemainingMs(row, TEACHER_GLOBAL, t0)).toBe(0);
    row = afterFailure(row, TEACHER_GLOBAL, t0);
    expect(lockRemainingMs(row, TEACHER_GLOBAL, t0)).toBeGreaterThan(0);
  });
});
