import { createHash, timingSafeEqual } from "node:crypto";

import { useSession } from "@tanstack/react-start/server";

import type { AppState } from "@/lib/homework-store";

export type GateSession = { role?: "teacher" | "student"; studentId?: string };

const ROW_ID = "default";

export function sessionConfig() {
  return {
    password: process.env["SESSION_SECRET"]!,
    name: "shukudai-gate",
    maxAge: 60 * 60 * 24 * 30,
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
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
  return ((data?.data ?? {}) as Partial<AppState>) ?? {};
}

export async function writeClassState(state: Partial<AppState>) {
  const db = await admin();
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
