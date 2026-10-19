import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { playCrystalChime, vibrate } from "@/lib/feedback";

const THRESHOLD = 86;
const MAX = 150;

type Phase = "idle" | "pull" | "ready" | "loading" | "done";

/** 児童画面専用：クリスタルが光をためる、ひっぱって更新 */
export default function CrystalPullRefresh({
  disabled,
  onRefresh,
  children,
}: {
  disabled?: boolean;
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
}) {
  const y = useMotionValue(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const start = useRef<number | null>(null);
  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const progress = useTransform(y, [0, THRESHOLD], [0, 1], { clamp: true });
  const pillY = useTransform(y, [0, MAX], [-70, 46]);
  const scale = useTransform(progress, [0, 1], [0.55, 1]);
  const rotate = useTransform(y, [0, MAX], [0, 300]);
  const glow = useTransform(progress, (p) => `drop-shadow(0 0 ${4 + p * 18}px oklch(0.85 0.16 ${210 + p * 90}))`);
  const contentY = useTransform(y, (v) => v * 0.35);
  const squish = useTransform(y, [0, MAX], [1, 1.06]);

  const dRef = useRef(disabled);
  dRef.current = disabled;
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (dRef.current || phaseRef.current === "loading" || phaseRef.current === "done") return;
      if (window.scrollY > 0 || e.touches.length !== 1) return;
      start.current = e.touches[0]!.clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (start.current === null) return;
      const dy = e.touches[0]!.clientY - start.current;
      if (dy <= 0 || window.scrollY > 0) {
        if (phaseRef.current !== "idle") {
          y.set(0);
          setP("idle");
        }
        return;
      }
      if (e.cancelable) e.preventDefault();
      // ラバーバンド：ひくほど重くなる
      const v = MAX * (1 - Math.exp(-dy / 220));
      y.set(v);
      const next = v >= THRESHOLD ? "ready" : "pull";
      if (next !== phaseRef.current) {
        if (next === "ready") vibrate(12);
        setP(next);
      }
    };
    const onEnd = async () => {
      if (start.current === null) return;
      start.current = null;
      if (phaseRef.current !== "ready") {
        setP("idle");
        void animate(y, 0, { type: "spring", stiffness: 420, damping: 32 });
        return;
      }
      setP("loading");
      void animate(y, THRESHOLD, { type: "spring", stiffness: 380, damping: 26 });
      try {
        await Promise.all([refreshRef.current(), new Promise((r) => setTimeout(r, 650))]);
      } catch {
        /* 取得失敗でも画面はそのまま */
      }
      playCrystalChime();
      setP("done");
      await new Promise((r) => setTimeout(r, 620));
      await animate(y, 0, { type: "spring", stiffness: 260, damping: 24 });
      setP("idle");
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [y]);

  const label =
    phase === "ready" ? "はなして更新！" : phase === "loading" ? "クリスタル通信中…" : phase === "done" ? "最新になったよ！" : "ひっぱって更新";

  return (
    <>
      <motion.div
        className={`ptr-pill ptr-${phase}`}
        style={{ y: pillY, scaleY: squish, opacity: useTransform(y, [0, 24], [0, 1]) }}
        aria-live="polite"
        role="status"
      >
        <span className="ptr-shimmer" aria-hidden />
        <motion.span className="ptr-crystal-wrap" style={{ scale, filter: glow }} aria-hidden>
          <motion.svg
            viewBox="0 0 40 40"
            className="ptr-crystal"
            style={{ rotate: phase === "loading" || phase === "done" ? undefined : rotate }}
          >
            <defs>
              <linearGradient id="ptr-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.92 0.12 200)" />
                <stop offset="55%" stopColor="oklch(0.72 0.2 290)" />
                <stop offset="100%" stopColor="oklch(0.85 0.15 340)" />
              </linearGradient>
            </defs>
            <polygon points="20,2 34,10 38,20 34,30 20,38 6,30 2,20 6,10" fill="url(#ptr-g)" opacity="0.9" />
            <polygon points="20,2 26,20 20,38 14,20" fill="oklch(1 0 0 / 0.35)" />
            <polygon points="2,20 38,20 20,24" fill="oklch(1 0 0 / 0.18)" />
          </motion.svg>
          {phase === "ready" && <span className="ptr-ring" />}
          {phase === "done" && (
            <span className="ptr-burst">
              {Array.from({ length: 10 }, (_, i) => (
                <i key={i} style={{ "--a": `${i * 36}deg` } as React.CSSProperties} />
              ))}
            </span>
          )}
        </motion.span>
        <motion.span key={label} className="ptr-label" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          {label}
        </motion.span>
      </motion.div>
      <motion.div style={{ y: contentY }} className={phase === "done" ? "ptr-content ptr-content-pop" : "ptr-content"}>
        {children}
      </motion.div>
    </>
  );
}
