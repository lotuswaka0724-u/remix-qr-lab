import { createServerFn } from "@tanstack/react-start";

import type { AppState, Status } from "@/lib/homework-store";

/** 児童用：合言葉でログインし、自分のぶんだけを見る */

export type StudentView = {
  name: string;
  className: string;
  date: string;
  items: { id: string; name: string; status: Status }[];
  available: number;
  earned: number;
  spent: number;
  gachaCost: number;
  log: { id: string; prize: string; at: number }[];
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const toStatus = (v: Status | boolean | undefined): Status =>
  v === true ? "submitted" : !v ? "none" : (v as Status);

function project(state: Partial<AppState>, studentId: string): StudentView | null {
  const student = (state.students ?? []).find((s) => s.id === studentId);
  if (!student) return null;

  const rules = state.pointRules ?? { fixed: 5, submitted: 3, school: 2, declared: 1, none: 0 };
  const date = todayKey();
  const day = state.records?.[date]?.[studentId] ?? {};
  const items = (state.assignments ?? [])
    .filter((a) => a.inToday)
    .map((a) => ({ id: a.id, name: a.name, status: toStatus(day[a.id]) }));

  let earned = 0;
  for (const d of Object.values(state.records ?? {})) {
    const mine = d[studentId];
    if (!mine) continue;
    for (const v of Object.values(mine)) earned += rules[toStatus(v)] ?? 0;
  }
  const mineLog = (state.gachaLog ?? []).filter((g) => g.studentId === studentId);
  const spent = mineLog.reduce((a, g) => a + g.cost, 0);

  return {
    name: student.name,
    className: student.className,
    date,
    items,
    earned,
    spent,
    available: earned - spent,
    gachaCost: state.gachaCost ?? 10,
    log: mineLog.slice(0, 10).map((g) => ({ id: g.id, prize: g.prize, at: g.at })),
  };
}

export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { studentId: string; code: string }) => ({
    studentId: String(data.studentId ?? ""),
    code: String(data.code ?? ""),
  }))
  .handler(async ({ data }) => {
    const { getGate, getCodeHash, hashCode, safeEqual } = await import("@/lib/gate.server");
    const stored = await getCodeHash(data.studentId);
    if (!stored) return { ok: false as const };
    if (!safeEqual(hashCode(data.studentId, data.code), stored)) return { ok: false as const };
    const gate = await getGate();
    await gate.clear();
    await gate.update({ role: "student", studentId: data.studentId });
    return { ok: true as const };
  });

export const getStudentView = createServerFn({ method: "GET" })
  .inputValidator((data: { studentId: string }) => ({ studentId: String(data.studentId ?? "") }))
  .handler(async ({ data }) => {
    const { getGate, readClassState } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "student" || gate.data.studentId !== data.studentId) return null;
    return project(await readClassState(), data.studentId);
  });

export const studentDrawGacha = createServerFn({ method: "POST" })
  .inputValidator((data: { studentId: string }) => ({ studentId: String(data.studentId ?? "") }))
  .handler(async ({ data }) => {
    const { getGate, readClassState, writeClassState } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "student" || gate.data.studentId !== data.studentId) return null;

    const state = await readClassState();
    const view = project(state, data.studentId);
    if (!view) return null;
    const cost = view.gachaCost;
    if (view.available < cost) return { ok: false as const, view };

    const prizes = (state.prizes ?? []).filter((p) => p.weight > 0);
    if (!prizes.length) return { ok: false as const, view };
    const total = prizes.reduce((a, p) => a + p.weight, 0);
    let r = Math.random() * total;
    let picked = prizes[prizes.length - 1]!;
    for (const p of prizes) {
      r -= p.weight;
      if (r <= 0) {
        picked = p;
        break;
      }
    }
    const result = {
      id: `gc_${Math.random().toString(36).slice(2, 9)}`,
      studentId: data.studentId,
      prize: picked.name,
      cost,
      at: Date.now(),
    };
    const next = { ...state, gachaLog: [result, ...(state.gachaLog ?? [])].slice(0, 500) };
    await writeClassState(next);
    return { ok: true as const, prize: picked.name, view: project(next, data.studentId)! };
  });

export const studentLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  await gate.clear();
  return { ok: true as const };
});
