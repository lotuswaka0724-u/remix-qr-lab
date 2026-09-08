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
    await gate.update({ role: "teacher", studentId: undefined });
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

/** 先生用：合言葉を持っていない児童に4桁の合言葉を自動発行する */
export const ensureStudentCodes = createServerFn({ method: "POST" }).handler(async () => {
  const { getGate, readClassState, writeClassState, saveCode, listCodedStudentIds } = await import(
    "@/lib/gate.server"
  );
  const gate = await getGate();
  if (gate.data.role !== "teacher") return null;

  const state = (await readClassState()) as Partial<AppState>;
  const students = state.students ?? [];
  const codes: Record<string, string> = { ...(state.codes ?? {}) };
  const existing = new Set(await listCodedStudentIds());

  let changed = false;
  for (const s of students) {
    if (existing.has(s.id) && codes[s.id]) continue;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    await saveCode(s.id, code);
    codes[s.id] = code;
    changed = true;
  }
  if (changed) await writeClassState({ ...state, codes });
  return codes;
});

/** 先生用：合言葉を作り直す */
export const resetStudentCode = createServerFn({ method: "POST" })
  .inputValidator((data: { studentId: string }) => ({ studentId: String(data.studentId) }))
  .handler(async ({ data }) => {
    const { getGate, readClassState, writeClassState, saveCode } = await import(
      "@/lib/gate.server"
    );
    const gate = await getGate();
    if (gate.data.role !== "teacher") return null;
    const state = (await readClassState()) as Partial<AppState>;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    await saveCode(data.studentId, code);
    const codes = { ...(state.codes ?? {}), [data.studentId]: code };
    await writeClassState({ ...state, codes });
    return { code };
  });
