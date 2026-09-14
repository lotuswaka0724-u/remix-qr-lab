import { createServerFn } from "@tanstack/react-start";

/** わすれましたQR（1回の読み取りで完結する署名つきQR）の発行と検証 */

/** 先生だけが発行できる。児童×宿題ごとの署名つきトークンを返す。 */
export const makeForgotTokens = createServerFn({ method: "POST" })
  .inputValidator((data: { rows: { studentId: string; assignmentId: string }[] }) => ({
    rows: (data.rows ?? [])
      .map((r) => ({ studentId: String(r.studentId ?? ""), assignmentId: String(r.assignmentId ?? "") }))
      .filter((r) => r.studentId && r.assignmentId)
      .slice(0, 2000),
  }))
  .handler(async ({ data }) => {
    const { getGate } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "teacher") return { ok: false as const, tokens: [] };
    const { makeHwToken } = await import("@/lib/hwqr.server");
    return {
      ok: true as const,
      tokens: data.rows.map((r) => ({
        studentId: r.studentId,
        assignmentId: r.assignmentId,
        token: makeHwToken({ v: 1, k: "FORGOT", s: r.studentId, a: r.assignmentId }),
      })),
    };
  });

/** 読み取ったQRの署名を検証する。署名が正しいときだけ児童ID・宿題IDを返す。 */
export const verifyForgotToken = createServerFn({ method: "POST" })
  .inputValidator((data: { text: string }) => ({ text: String(data.text ?? "").slice(0, 2000) }))
  .handler(async ({ data }) => {
    const { readHwToken } = await import("@/lib/hwqr.server");
    const p = readHwToken(data.text);
    if (!p) return { ok: false as const };
    return { ok: true as const, studentId: p.s, assignmentId: p.a, state: "FORGOT" as const };
  });
