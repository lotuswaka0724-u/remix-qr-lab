import { AnimatePresence, motion } from "motion/react";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";

import { getPushPublicKey, removePushSubscription, savePushSubscription } from "@/lib/push.functions";

/* ---------------- なおしバナー（画面をひらいているとき） ---------------- */

export type RedoBannerItem = { id: string; message: string };

export function RedoBanner({
  items,
  onOpen,
  onClose,
}: {
  items: RedoBannerItem[];
  onOpen: () => void;
  onClose: () => void;
}) {
  const open = items.length > 0;
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(onClose, 9000);
    return () => window.clearTimeout(t);
  }, [open, items, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="redo-banner"
          role="alert"
          className="redo-banner-wrap fixed inset-x-0 z-[60] flex justify-center px-3"
          initial={{ y: -140, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -140, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          <motion.div
            className="redo-banner relative flex w-full max-w-xl items-center gap-3 overflow-hidden rounded-3xl px-4 py-3"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.6, bottom: 0.1 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -36) onClose();
            }}
          >
            <span className="redo-banner-shine" aria-hidden />
            <motion.span
              className="redo-banner-star grid h-11 w-11 shrink-0 place-content-center rounded-2xl text-2xl"
              aria-hidden
              initial={{ rotate: -40, scale: 0.4 }}
              animate={{ rotate: [0, -12, 12, 0], scale: [1.25, 1] }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              🌟
            </motion.span>
            <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
              {items.slice(0, 3).map((it, i) => (
                <motion.span
                  key={it.id}
                  className="block truncate font-display text-base font-bold"
                  initial={{ x: 18, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.12 + i * 0.08 }}
                >
                  {it.message}
                </motion.span>
              ))}
              {items.length > 3 && (
                <span className="block text-xs opacity-80">ほか {items.length - 3} こ</span>
              )}
              <span className="redo-banner-hint mt-0.5 block text-[11px] font-bold">タップして 宿題を見る →</span>
            </button>
            <button
              type="button"
              aria-label="とじる"
              onClick={onClose}
              className="redo-banner-close grid h-8 w-8 shrink-0 place-content-center rounded-full text-sm font-bold"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- なおし通知の受け取り（ホーム画面アプリ） ---------------- */

type PushState = "loading" | "unsupported" | "needs-home" | "default" | "on" | "denied" | "error";

const SW_URL = "/push-sw.js";

function keyBytes(b64: string) {
  const t = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(t + "=".repeat((4 - (t.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
const supported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** 現在の端末の通知登録をサーバーへ記録（ログイン中の児童に紐付け） */
export function usePushSubscription() {
  const getKey = useServerFn(getPushPublicKey);
  const save = useServerFn(savePushSubscription);
  const remove = useServerFn(removePushSubscription);
  const [state, setState] = useState<PushState>("loading");

  const record = useCallback(
    async (sub: PushSubscription) => {
      const j = sub.toJSON();
      const res = await save({
        data: { endpoint: j.endpoint ?? "", p256dh: j.keys?.["p256dh"] ?? "", auth: j.keys?.["auth"] ?? "" },
      });
      return res.ok;
    },
    [save],
  );

  useEffect(() => {
    if (!supported()) {
      setState(isIOS() && !isStandalone() ? "needs-home" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") return setState("denied");
    if (Notification.permission !== "granted") return setState("default");
    let off = false;
    // 許可ずみの端末：ログイン中の児童を届け先として記録しなおす（端末の共用に対応）
    void navigator.serviceWorker
      .getRegistration(SW_URL)
      .then(async (reg) => {
        const sub = await reg?.pushManager.getSubscription();
        if (off) return;
        if (!sub) return setState("default");
        setState((await record(sub)) ? "on" : "error");
      })
      .catch(() => !off && setState("default"));
    return () => {
      off = true;
    };
  }, [record]);

  const enable = useCallback(async () => {
    if (!supported()) return;
    setState("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "default");
      const key = await getKey({});
      if (!key) return setState("error");
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
      setState((await record(sub)) ? "on" : "error");
    } catch {
      setState("error");
    }
  }, [getKey, record]);

  /** ログアウト時：この端末を届け先から外す（端末の許可はそのまま） */
  const detach = useCallback(async () => {
    try {
      if (!supported()) return;
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) await remove({ data: { endpoint: sub.endpoint } });
    } catch {
      /* 外せなくてもログアウトは続ける */
    }
  }, [remove]);

  return { state, enable, detach };
}

export function PushOptIn({ api }: { api: ReturnType<typeof usePushSubscription> }) {
  const { state, enable } = api;
  if (state === "loading" || state === "unsupported") return null;

  if (state === "on") {
    return (
      <div className="redo-optin redo-optin-on flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold">
        <span className="redo-optin-bell" aria-hidden>🔔</span>
        なおし通知 オン
        <span className="ml-auto text-xs font-normal opacity-80">直しになったら おしらせするよ</span>
      </div>
    );
  }

  return (
    <section className="redo-optin relative overflow-hidden rounded-3xl p-4">
      <span className="redo-banner-shine" aria-hidden />
      <div className="flex flex-wrap items-center gap-3">
        <motion.span
          className="redo-optin-bell grid h-12 w-12 shrink-0 place-content-center rounded-2xl text-2xl"
          aria-hidden
          animate={{ rotate: [0, -14, 12, -8, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.4 }}
        >
          🔔
        </motion.span>
        <div className="min-w-[180px] flex-1">
          <p className="font-display text-base font-bold">なおし通知</p>
          {state === "needs-home" && (
            <p className="text-xs opacity-85">
              Safari の 共有ボタン（□↑）→「ホーム画面に追加」をして、ホーム画面のアイコンから ひらいてね。
            </p>
          )}
          {state === "default" && (
            <p className="text-xs opacity-85">直しになったら iPad に おしらせが とどくよ。</p>
          )}
          {state === "denied" && (
            <p className="text-xs opacity-85">
              通知がオフになっています。「設定」→「通知」から オンにしてね。
            </p>
          )}
          {state === "error" && (
            <p className="text-xs opacity-85">うまく とうろくできませんでした。もういちど ためしてね。</p>
          )}
        </div>
        {(state === "default" || state === "error") && (
          <motion.button
            type="button"
            onClick={() => void enable()}
            whileTap={{ scale: 0.94 }}
            className="student-command redo-optin-btn rounded-full px-5 py-2 font-display text-sm font-bold"
          >
            通知を受け取る
          </motion.button>
        )}
      </div>
    </section>
  );
}
