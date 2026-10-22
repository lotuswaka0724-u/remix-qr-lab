import { createServerFn } from "@tanstack/react-start";

/** 児童用：なおし通知の受け取り登録 */

export const getPushPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  if (gate.data.role !== "student") return null;
  const { vapidPublicKey } = await import("@/lib/webpush.server");
  try {
    return vapidPublicKey();
  } catch {
    return null;
  }
});

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

export const savePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { endpoint: string; p256dh: string; auth: string }) => ({
    endpoint: clean(d?.endpoint, 1000),
    p256dh: clean(d?.p256dh, 200),
    auth: clean(d?.auth, 100),
  }))
  .handler(async ({ data }) => {
    const { getGate } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "student" || !gate.data.studentId) return { ok: false as const };
    if (!/^https:\/\//.test(data.endpoint) || !data.p256dh || !data.auth) return { ok: false as const };
    const { saveSubscription } = await import("@/lib/push.server");
    return { ok: await saveSubscription(gate.data.studentId, data) };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .inputValidator((d: { endpoint: string }) => ({ endpoint: clean(d?.endpoint, 1000) }))
  .handler(async ({ data }) => {
    const { getGate } = await import("@/lib/gate.server");
    const gate = await getGate();
    if (gate.data.role !== "student" || !gate.data.studentId) return { ok: false as const };
    const { removeSubscription } = await import("@/lib/push.server");
    await removeSubscription(gate.data.studentId, data.endpoint);
    return { ok: true as const };
  });
