import { describe, expect, it } from "vitest";
import { newRedos, newRedosAllDates, redoMessage } from "@/lib/redo-notify";

const a = [{ id: "h1", name: "計算ドリル" }, { id: "h2", name: "音読" }];

describe("なおし通知", () => {
  it("文面は「🌟【宿題名】になおしがあるよ！」", () => {
    expect(redoMessage("計算ドリル")).toBe("🌟【計算ドリル】になおしがあるよ！");
  });
  it("新しく直しになった宿題だけ通知し、もともと直しのものは再通知しない", () => {
    const prev = { assignments: a, records: { d: { s1: { h1: "submitted", h2: "redo" } } } } as never;
    const next = { assignments: a, records: { d: { s1: { h1: "redo", h2: "redo" }, s2: { h2: "submitted" } } } } as never;
    expect(newRedos(prev, next, "d")).toEqual([{ studentId: "s1", assignmentId: "h1", name: "計算ドリル" }]);
  });
  it("過去の日を直しにしても通知し、変わっていない日は通知しない", () => {
    const prev = { assignments: a, records: { d1: { s1: { h1: "submitted" } }, d2: { s2: { h1: "redo" } } } } as never;
    const next = { assignments: a, records: { d1: { s1: { h1: "redo" } }, d2: { s2: { h1: "redo" } } } } as never;
    expect(newRedosAllDates(prev, next)).toEqual([{ studentId: "s1", assignmentId: "h1", name: "計算ドリル" }]);
  });
  it("直しから別の状態にもどしても通知しない", () => {
    const prev = { assignments: a, records: { d: { s1: { h1: "redo" } } } } as never;
    const next = { assignments: a, records: { d: { s1: { h1: "fixed" } } } } as never;
    expect(newRedosAllDates(prev, next)).toEqual([]);
  });
});
