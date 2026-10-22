import type { AppState } from "@/lib/homework-store";
import { newRedosAllDates, redoMessage } from "@/lib/redo-notify";
import { sendPush } from "@/lib/webpush.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function saveSubscription(studentId: string, s: { endpoint: string; p256dh: string; auth: string }) {
  const db = await admin();
  // 同じ端末で別の児童がログインしたら、届け先をその児童に付け替える
  const { error } = await db
    .from("push_subscriptions")
    .upsert({ endpoint: s.endpoint, student_id: studentId, p256dh: s.p256dh, auth: s.auth }, { onConflict: "endpoint" });
  return !error;
}

export async function removeSubscription(studentId: string, endpoint: string) {
  const db = await admin();
  await db.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("student_id", studentId);
}

/** 新しく「直し」になった宿題を、その児童の端末へ通知する。失敗しても保存には影響させない */
export async function notifyNewRedos(prev: Partial<AppState>, next: Partial<AppState>) {
  const redos = newRedosAllDates(prev, next);
  if (!redos.length) return 0;
  const db = await admin();
  const ids = [...new Set(redos.map((r) => r.studentId))];
  const { data: subs } = await db.from("push_subscriptions").select("endpoint, student_id, p256dh, auth").in("student_id", ids);
  if (!subs?.length) return 0;
  const gone: string[] = [];
  let sent = 0;
  await Promise.allSettled(
    redos.flatMap((r) =>
      subs
        .filter((s) => s.student_id === r.studentId)
        .map(async (s) => {
          const res = await sendPush(s, { title: redoMessage(r.name), body: "", tag: `redo-${r.assignmentId}` });
          if (res === "gone") gone.push(s.endpoint);
          if (res === "ok") sent++;
        }),
    ),
  );
  if (gone.length) await db.from("push_subscriptions").delete().in("endpoint", gone);
  return sent;
}
