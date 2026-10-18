import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppState } from "@/lib/homework-store";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      inputValidator: () => builder,
      handler: (handler: (...args: unknown[]) => unknown) => handler,
    };
    return builder;
  },
}));
vi.mock("@/lib/class-sync.functions", () => ({
  getClassState: vi.fn(async () => null),
  saveClassState: vi.fn(async () => ({ ok: true })),
}));

const fixture: Partial<AppState> = {
  students: [{ id: "date_test", name: "日付テスト", className: "テスト", number: 1 }],
  assignments: [
    { id: "submitted", name: "提出済みの宿題", inToday: true },
    { id: "missing", name: "未提出の宿題", inToday: true },
  ],
  records: {
    "2026-10-18": { date_test: { submitted: "none" } },
    "2026-10-19": { date_test: { submitted: "submitted", missing: "none" } },
  },
};

vi.mock("@/lib/gate.server", () => ({
  getGate: async () => ({ data: { role: "student", studentId: "date_test" } }),
  readClassState: async () => fixture,
}));

const { getStudentView } = await import("@/lib/student.functions");
const { todayKey } = await import("@/lib/homework-store");
const { jstDay } = await import("@/lib/daily-play");

afterEach(() => vi.useRealTimers());

describe("教師と児童の提出日付は日本時間で一致する", () => {
  it("10月19日08:18 JSTはUTCが前日でも当日の提出を読み、未提出は変更しない", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T23:18:00Z"));
    const before = JSON.stringify(fixture);
    const view = await getStudentView();
    expect(todayKey()).toBe("2026-10-19");
    expect(view?.date).toBe("2026-10-19");
    expect(view?.items.map((item) => item.status)).toEqual(["submitted", "none"]);
    expect(JSON.stringify(fixture)).toBe(before);
  });

  it("日本時間の午前0時にだけ日付が切り替わる", () => {
    expect(jstDay(Date.parse("2026-10-18T14:59:59.999Z"))).toBe("2026-10-18");
    expect(jstDay(Date.parse("2026-10-18T15:00:00.000Z"))).toBe("2026-10-19");
  });
});