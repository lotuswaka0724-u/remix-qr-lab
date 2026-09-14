import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * わすれましたQR用の「改ざん検知できるトークン」。
 * 児童ID・宿題ID・状態（FORGOT）をサーバーの秘密鍵で署名する。
 * 秘密鍵はサーバー側だけにあり、クライアントには一切出さない。
 */

export type HwTokenPayload = {
  v: 1;
  /** 状態（いまは FORGOT のみ） */
  k: "FORGOT";
  /** 児童ID */
  s: string;
  /** 宿題ID */
  a: string;
};

export const HW_TOKEN_PREFIX = "HWT1:";

const secret = () =>
  process.env["SESSION_SECRET"] ?? process.env["STUDENT_CODE_SALT"] ?? "hw-token-fallback";

const b64url = (buf: Buffer) => buf.toString("base64url");

const sign = (payload: string) =>
  b64url(createHmac("sha256", secret()).update(payload, "utf8").digest()).slice(0, 32);

export function makeHwToken(p: HwTokenPayload): string {
  const payload = b64url(Buffer.from(JSON.stringify(p), "utf8"));
  return `${HW_TOKEN_PREFIX}${payload}.${sign(payload)}`;
}

export function readHwToken(text: string): HwTokenPayload | null {
  const raw = text.trim();
  if (!raw.startsWith(HW_TOKEN_PREFIX)) return null;
  const body = raw.slice(HW_TOKEN_PREFIX.length);
  const dot = body.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = body.slice(0, dot);
  const sig = body.slice(dot + 1);
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as HwTokenPayload;
    if (p?.v !== 1 || p.k !== "FORGOT" || !p.s || !p.a) return null;
    return { v: 1, k: "FORGOT", s: String(p.s), a: String(p.a) };
  } catch {
    return null;
  }
}
