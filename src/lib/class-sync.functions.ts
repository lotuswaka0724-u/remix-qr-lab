import { createServerFn } from "@tanstack/react-start";

import type { AppState } from "@/lib/homework-store";

/** 先生用：合言葉ログイン・クラスデータの読み書き */

export const gateStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  return { role: gate.data.role ?? null, studentId: gate.data.studentId ?? null };
});

export const teacherLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => ({ password: String(data.password ?? "") }))
  .handler(async ({ data }) => {
    const { getGate, safeEqual } = await import("@/lib/gate.server");
    const expected = process.env["TEACHER_PASSWORD"];
    if (!expected) return { ok: false as const };
    if (!safeEqual(data.password, expected)) return { ok: false as const };
    const gate = await getGate();
    await gate.clear();
    await gate.update({ role: "teacher" });
    return { ok: true as const };
  });

export const gateLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  await gate.clear();
  return { ok: true as const };
});

export const getClassState = createServerFn({ method: "GET" }).handler(async () => {
  const { getGate, readClassState } = await import("@/lib/gate.server");
  const gate = await getGate();
  if (gate.data.role !== "teacher") return null;
  return (await readClassState()) as Partial<AppState>;
});

export const saveClassState = createServerFn({ method: "POST" })
  .inputValidator((data: { state: Partial<AppState> }) => data)
  .handler(async ({ data }) => {
    const { getGate, writeClassState } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "teacher") return { ok: false as const };
    await writeClassState(data.state);
    return { ok: true as const };
  });

/** 先生用：名簿（年度・学年・クラス・出席番号・氏名）をログイン用の台帳に登録する */
export const syncStudentDirectory = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      rows: {
        studentId: string;
        fiscalYear: number;
        grade: number;
        classNumber: number;
        attendanceNumber: number;
        name: string;
      }[];
    }) => data,
  )
  .handler(async ({ data, context: _context }) => {
    const { getGate, upsertDirectory } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "teacher") return { ok: false as const };
    const rows = data.rows.filter(
      (r) =>
        r.studentId &&
        Number.isInteger(r.fiscalYear) &&
        Number.isInteger(r.grade) &&
        Number.isInteger(r.classNumber) &&
        Number.isInteger(r.attendanceNumber) &&
        r.fiscalYear > 0 &&
        r.grade > 0 &&
        r.classNumber > 0 &&
        r.attendanceNumber > 0,
    );
    await upsertDirectory(rows);
    return { ok: true as const, count: rows.length };
  });
