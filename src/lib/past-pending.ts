import type { AppState, Status } from "@/lib/homework-store";

/** 前日以前に残っている「直し」「わすれた」（まだ解決していないもの） */
export type PastPending = {
  date: string;
  assignmentId: string;
  name: string;
  status: "redo" | "declared";
};

const toStatus = (v: Status | boolean | undefined): Status =>
  v === true ? "submitted" : !v ? "none" : (v as Status);

const shiftDay = (day: string, diff: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
};

/** 今日より前（lookback日以内）の未解決の直し・わすれを、古い順に返す */
export function pastPending(
  state: Partial<AppState>,
  studentId: string,
  today: string,
  lookback = 30,
): PastPending[] {
  const from = shiftDay(today, -lookback);
  const names = new Map((state.assignments ?? []).map((a) => [a.id, a.name]));
  const out: PastPending[] = [];
  for (const [date, day] of Object.entries(state.records ?? {})) {
    if (date >= today || date < from) continue;
    if (state.absences?.[date]?.includes(studentId)) continue;
    for (const [assignmentId, v] of Object.entries(day[studentId] ?? {})) {
      const st = toStatus(v);
      if (st !== "redo" && st !== "declared") continue;
      const name = names.get(assignmentId);
      if (!name) continue;
      out.push({ date, assignmentId, name, status: st });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** 欠席者を分母から外した、今日の提出数 */
export const isAbsent = (state: Partial<AppState>, date: string, studentId: string) =>
  !!state.absences?.[date]?.includes(studentId);
