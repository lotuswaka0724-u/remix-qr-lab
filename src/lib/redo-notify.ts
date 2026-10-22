import type { AppState, Status } from "@/lib/homework-store";

/** 通知の文面（ユーザー指定） */
export const redoMessage = (hwName: string) => `🌟【${hwName}】になおしがあるよ！`;

const st = (v: Status | boolean | undefined): Status =>
  v === true ? "submitted" : !v ? "none" : (v as Status);

/** 保存前後をくらべ、指定日に新しく「直し」になった児童×宿題を返す */
export function newRedos(prev: Partial<AppState>, next: Partial<AppState>, date: string) {
  const before = prev.records?.[date] ?? {};
  const after = next.records?.[date] ?? {};
  const names = new Map((next.assignments ?? []).map((a) => [a.id, a.name] as const));
  const out: { studentId: string; assignmentId: string; name: string }[] = [];
  for (const [studentId, rec] of Object.entries(after)) {
    for (const [assignmentId, v] of Object.entries(rec ?? {})) {
      if (st(v) !== "redo" || st(before[studentId]?.[assignmentId]) === "redo") continue;
      out.push({ studentId, assignmentId, name: names.get(assignmentId) ?? "宿題" });
    }
  }
  return out;
}

/** すべての日付をくらべる（変化のない日は飛ばす）。先生が過去の日を直しにした場合も通知する */
export function newRedosAllDates(prev: Partial<AppState>, next: Partial<AppState>) {
  const out: ReturnType<typeof newRedos> = [];
  for (const date of Object.keys(next.records ?? {})) {
    if (JSON.stringify(prev.records?.[date] ?? {}) === JSON.stringify(next.records?.[date] ?? {})) continue;
    out.push(...newRedos(prev, next, date));
  }
  return out;
}
