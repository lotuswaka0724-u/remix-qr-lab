import { createServerFn } from "@tanstack/react-start";

import type { AppState, PointRules, Status } from "@/lib/homework-store";

/** 児童用：ログイン番号（年度＋学年＋クラス＋出席番号）でログインし、自分のぶんだけを見る */

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

  const rules: PointRules = state.pointRules ?? {
    fixed: 5,
    redo: 0,
    submitted: 3,
    school: 2,
    declared: 1,
    none: 0,
  };
  const date = todayKey();
  const day = state.records?.[date]?.[studentId] ?? {};
  const items = (state.assignments ?? [])
    .filter((a) => a.inToday)
    .map((a) => ({ id: a.id, name: a.name, status: toStatus(day[a.id]) }));

  // 宿題カードQRで処理ずみの記録は、そちらの点数を使う（二重加算をふせぐ）
  // 無効化（voided）された記録は、先生画面と同じくポイント計算から完全に外す
  const handled = new Set(
    (state.hwEvents ?? [])
      .filter((e) => e.studentId === studentId && !e.voided)
      .map((e) => `${e.date}|${e.assignmentId}`),
  );
  let earned = 0;
  for (const [d, rec] of Object.entries(state.records ?? {})) {
    const mine = rec[studentId];
    if (!mine) continue;
    for (const [assignmentId, v] of Object.entries(mine)) {
      if (handled.has(`${d}|${assignmentId}`)) continue;
      earned += rules[toStatus(v)] ?? 0;
    }
  }
  for (const e of state.hwEvents ?? []) {
    if (e.studentId === studentId) earned += e.delta;
  }
  for (const g of state.manualGrants ?? []) {
    if (g.studentId === studentId) earned += g.amount;
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

/** ログイン番号だけを受け取る。URLやパラメータで児童を指定させない。 */
export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { loginNumber: string }) => ({
    loginNumber: String(data.loginNumber ?? "").replace(/\D/g, ""),
  }))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getGate, findByLoginNumber, tooManyAttempts, clearAttempts, readClassState } =
      await import("@/lib/gate.server");

    const req = getRequest();
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const key = `student:${ip}`;

    if (await tooManyAttempts(key)) {
      return { ok: false as const, reason: "locked" as const };
    }
    if (data.loginNumber.length < 3 || data.loginNumber.length > 8) {
      return { ok: false as const, reason: "invalid" as const };
    }

    const hit = await findByLoginNumber(data.loginNumber);
    if (!hit) return { ok: false as const, reason: "invalid" as const };

    // 名簿に実在する児童だけログインさせる
    const state = await readClassState();
    if (!(state.students ?? []).some((s) => s.id === hit.studentId)) {
      return { ok: false as const, reason: "invalid" as const };
    }

    const gate = await getGate();
    await gate.clear();
    await gate.update({ role: "student", studentId: hit.studentId });
    await clearAttempts(key);
    return { ok: true as const };
  });

/** セッションの児童だけを返す。引数で他人を指定することはできない。 */
export const getStudentView = createServerFn({ method: "GET" }).handler(async () => {
  const { getGate, readClassState } = await import("@/lib/gate.server");
  const gate = await getGate();
  if (gate.data.role !== "student" || !gate.data.studentId) return null;
  return project(await readClassState(), gate.data.studentId);
});

export const studentDrawGacha = createServerFn({ method: "POST" }).handler(async () => {
  const { getGate, readClassState, writeClassState } = await import("@/lib/gate.server");
  const gate = await getGate();
  if (gate.data.role !== "student" || !gate.data.studentId) return null;
  const studentId = gate.data.studentId;

  const state = await readClassState();
  const view = project(state, studentId);
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
    studentId,
    prize: picked.name,
    cost,
    at: Date.now(),
  };
  const next = { ...state, gachaLog: [result, ...(state.gachaLog ?? [])].slice(0, 500) };
  await writeClassState(next);
  return { ok: true as const, prize: picked.name, view: project(next, studentId)! };
});

export const studentLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  await gate.clear();
  return { ok: true as const };
});
