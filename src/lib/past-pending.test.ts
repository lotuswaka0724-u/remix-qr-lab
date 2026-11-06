import { describe, expect, it } from "vitest";
import { pastPending } from "@/lib/past-pending";

const base = {
  assignments: [{ id: "h1", name: "計算ドリル", inToday: true }],
} as never;

describe("前日以前の直し・わすれ", () => {
  it("前日の直しとわすれを古い順に返し、今日の分は含めない", () => {
    const s = { ...(base as object), records: {
      "2026-11-05": { s1: { h1: "declared" } },
      "2026-11-04": { s1: { h1: "redo" } },
      "2026-11-06": { s1: { h1: "redo" } },
    } } as never;
    expect(pastPending(s, "s1", "2026-11-06").map((p) => [p.date, p.status])).toEqual([
      ["2026-11-04", "redo"],
      ["2026-11-05", "declared"],
    ]);
  });
  it("直し完了・提出済みになったものは消える", () => {
    const s = { ...(base as object), records: { "2026-11-05": { s1: { h1: "fixed" } } } } as never;
    expect(pastPending(s, "s1", "2026-11-06")).toEqual([]);
  });
  it("欠席した日は数えない", () => {
    const s = { ...(base as object), records: { "2026-11-05": { s1: { h1: "redo" } } }, absences: { "2026-11-05": ["s1"] } } as never;
    expect(pastPending(s, "s1", "2026-11-06")).toEqual([]);
  });
});
