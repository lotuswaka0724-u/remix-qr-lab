import { p256 } from "@noble/curves/p256";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";

/** Web Push（RFC 8291 aes128gcm + VAPID）。workerd でも動くよう WebCrypto と noble のみ使用 */

const enc = new TextEncoder();
const b64u = (b: Uint8Array) =>
  btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const cat = (...a: Uint8Array[]) => {
  const out = new Uint8Array(a.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of a) {
    out.set(x, o);
    o += x.length;
  }
  return out;
};

function vapidKeys() {
  const seed = process.env["VAPID_SEED"];
  if (!seed) throw new Error("VAPID_SEED missing");
  const priv = sha256(enc.encode(`vapid:${seed}`));
  return { priv, pub: p256.getPublicKey(priv, false) };
}

export const vapidPublicKey = () => b64u(vapidKeys().pub);

export type PushSub = { endpoint: string; p256dh: string; auth: string };

async function encrypt(sub: PushSub, payload: Uint8Array) {
  const uaPub = fromB64u(sub.p256dh);
  const authSecret = fromB64u(sub.auth);
  const asPriv = p256.utils.randomPrivateKey();
  const asPub = p256.getPublicKey(asPriv, false);
  const shared = p256.getSharedSecret(asPriv, uaPub).slice(1, 33);
  const prkKey = hmac(sha256, authSecret, shared);
  const ikm = hmac(sha256, prkKey, cat(enc.encode("WebPush: info\0"), uaPub, asPub, new Uint8Array([1])));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = hmac(sha256, salt, ikm);
  const cek = hmac(sha256, prk, cat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1]))).slice(0, 16);
  const nonce = hmac(sha256, prk, cat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1]))).slice(0, 12);
  const key = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, cat(payload, new Uint8Array([2]))),
  );
  const rs = new Uint8Array([0, 0, 16, 0]);
  return cat(salt, rs, new Uint8Array([65]), asPub, ct);
}

function vapidHeader(endpoint: string) {
  const { priv, pub } = vapidKeys();
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(
    enc.encode(
      JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:noreply@lotus-qr-scaner.lovable.app" }),
    ),
  );
  const sig = p256.sign(sha256(enc.encode(`${head}.${body}`)), priv).toCompactRawBytes();
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${b64u(pub)}`;
}

/** 送信。戻り値 "gone" は購読が無効（削除してよい） */
export async function sendPush(sub: PushSub, data: unknown): Promise<"ok" | "gone" | "error"> {
  try {
    const body = await encrypt(sub, enc.encode(JSON.stringify(data)));
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidHeader(sub.endpoint),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: "86400",
        Urgency: "high",
      },
      body,
    });
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}
