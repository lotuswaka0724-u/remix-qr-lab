import { createHash, timingSafeEqual } from "node:crypto";

import { useSession } from "@tanstack/react-start/server";

import { freezeCompleteBonuses, type AppState } from "@/lib/homework-store";
import { normalizeUsageRules } from "@/lib/daily-play";

export type GateSession = { role?: "teacher" | "student"; studentId?: string };

const ROW_ID = "default";

export function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "shukudai-gate",
    maxAge: 60 * 60 * 24 * 30,
    // プレビューはiframe内（クロスサイト）で表示されるため、SameSite=None が必要
    cookie: { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" },
  };
}

export const getGate = () => useSession<GateSession>(sessionConfig());

export function safeEqual(a: string, b: string) {
  const x = createHash("sha256").update(a, "utf8").digest();
  const y = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(x, y);
}

export const hashCode = (studentId: string, code: string) =>
  createHash("sha256")
    .update(`${studentId}:${code}:${process.env["STUDENT_CODE_SALT"] ?? ""}`, "utf8")
    .digest("hex");

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readClassState(): Promise<Partial<AppState>> {
  const db = await admin();
  const { data } = await db.from("class_state").select("data").eq("id", ROW_ID).maybeSingle();
  return (data?.data ?? {}) as Partial<AppState>;
}

export async function writeClassState(incoming: Partial<AppState>) {
  const db = await admin();
  // ボーナス確定記録は消さない：保存済みと受け取った分を合わせ、未確定の到達分は「変更前の設定値」で確定する
  const prev = await readClassState();
  const union = new Map<string, NonNullable<AppState["completeBonusLog"]>[number]>();
  for (const e of [...(incoming.completeBonusLog ?? []), ...(prev.completeBonusLog ?? [])]) union.set(e.id, e);
  const prevAmount = normalizeUsageRules(prev.usageRules ?? incoming.usageRules).completeBonus;
  const state: Partial<AppState> = {
    ...incoming,
    completeBonusLog: freezeCompleteBonuses({ ...incoming, completeBonusLog: [...union.values()] }, prevAmount),
  };
  await db
    .from("class_state")
    .upsert({ id: ROW_ID, data: state as never, updated_at: new Date().toISOString() });
}

export async function getCodeHash(studentId: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("student_codes")
    .select("code_hash")
    .eq("student_id", studentId)
    .maybeSingle();
  return data?.code_hash ?? null;
}

export async function listCodedStudentIds(): Promise<string[]> {
  const db = await admin();
  const { data } = await db.from("student_codes").select("student_id");
  return (data ?? []).map((r) => r.student_id);
}

export async function saveCode(studentId: string, code: string) {
  const db = await admin();
  await db.from("student_codes").upsert({
    student_id: studentId,
    code_hash: hashCode(studentId, code),
    updated_at: new Date().toISOString(),
  });
}

/* ---------- 児童名簿（年度・学年・クラス・出席番号） ---------- */

export type DirectoryRow = {
  studentId: string;
  fiscalYear: number;
  grade: number;
  classNumber: number;
  attendanceNumber: number;
  name: string;
};

export function loginNumberOf(r: Omit<DirectoryRow, "studentId" | "name">) {
  return `${r.fiscalYear}${r.grade}${r.classNumber}${r.attendanceNumber}`;
}

export async function upsertDirectory(rows: DirectoryRow[]) {
  const db = await admin();
  if (!rows.length) return;
  await db.from("student_directory").upsert(
    rows.map((r) => ({
      student_id: r.studentId,
      fiscal_year: r.fiscalYear,
      grade: r.grade,
      class_number: r.classNumber,
      attendance_number: r.attendanceNumber,
      name: r.name,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "student_id" },
  );
}

/** ログイン番号に一致する児童。1人に定まらないときは null（取り違え防止） */
export async function findByLoginNumber(loginNumber: string): Promise<{ studentId: string } | null> {
  const db = await admin();
  const { data } = await db
    .from("student_directory")
    .select("student_id")
    .eq("login_number", loginNumber)
    .limit(2);
  if (!data || data.length !== 1) return null;
  return { studentId: data[0]!.student_id };
}

/* ---------- ログイン試行の制限 ---------- */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/** true = これ以上ためせない */
export async function tooManyAttempts(key: string): Promise<boolean> {
  const db = await admin();
  const now = Date.now();
  const { data } = await db
    .from("login_attempts")
    .select("count, window_start")
    .eq("key", key)
    .maybeSingle();

  const fresh = !data || now - new Date(data.window_start).getTime() > WINDOW_MS;
  const count = fresh ? 1 : data!.count + 1;
  await db.from("login_attempts").upsert({
    key,
    count,
    window_start: fresh ? new Date(now).toISOString() : data!.window_start,
    updated_at: new Date(now).toISOString(),
  });
  return count > MAX_ATTEMPTS;
}

export async function clearAttempts(key: string) {
  const db = await admin();
  await db.from("login_attempts").delete().eq("key", key);
}
