import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

import { CountUp } from "@/components/StudentProgress";
import { playCompleteFanfare, vibrate } from "@/lib/feedback";
import { nextCompleteBonus } from "@/lib/student-progress";

type Props = {
  open: boolean;
  onClose: () => void;
  name: string;
  streak: number;
  total: number;
};

const COLORS = ["#7dd3fc", "#c4b5fd", "#f9e27d", "#ffffff", "#a5f3fc", "#f0abfc"];
const TITLE = "COMPLETE!".split("");

/** 児童画面専用：今日の宿題がぜんぶそろったときの、オーロラ×クリスタルの演出 */
export default function CompleteCelebration({ open, onClose, name, streak, total }: Props) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const bonus = nextCompleteBonus(total);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    const timers: number[] = [];
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    playCompleteFanfare();
    vibrate([18, 50, 18, 50, 70]);

    // 紙ふぶき（canvas-confetti）はブラウザでだけ読み込む
    void import("canvas-confetti").then(({ default: confetti }) => {
      if (stopped || reduce) return;
      const star = { shapes: ["star"] as confetti.Shape[], colors: COLORS, zIndex: 90, disableForReducedMotion: true };
      const gem = confetti.shapeFromText?.({ text: "💎", scalar: 1.6 });
      confetti({ ...star, particleCount: 90, spread: 100, startVelocity: 42, scalar: 1.1, origin: { x: 0.5, y: 0.45 } });
      timers.push(
        window.setTimeout(() => {
          if (stopped) return;
          confetti({ colors: COLORS, zIndex: 90, particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, startVelocity: 55 });
          confetti({ colors: COLORS, zIndex: 90, particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, startVelocity: 55 });
        }, 380),
      );
      const end = Date.now() + 1800;
      const shower = () => {
        if (stopped || Date.now() > end) return;
        confetti({
          ...star,
          shapes: gem ? [gem, "star"] : ["star"],
          particleCount: 3,
          gravity: 0.6,
          ticks: 260,
          scalar: 1.2,
          startVelocity: 8,
          origin: { x: Math.random(), y: -0.05 },
        });
        timers.push(window.setTimeout(shower, 120));
      };
      timers.push(window.setTimeout(shower, 700));
    });

    timers.push(window.setTimeout(() => closeRef.current(), 7000));
    return () => {
      stopped = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="complete-fx"
          role="dialog"
          aria-modal="true"
          aria-label="今日の宿題 コンプリート"
          className="complete-fx fixed inset-0 z-[80] grid place-items-center overflow-hidden px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
          onClick={onClose}
        >
          <span className="complete-fx-wash" aria-hidden />
          <motion.span
            className="complete-fx-rays"
            aria-hidden
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />

          <div className="relative grid place-items-center text-center">
            {[0, 0.25, 0.5].map((d) => (
              <motion.span
                key={d}
                className="complete-fx-ring"
                aria-hidden
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 1.6, delay: 0.15 + d, repeat: 1, repeatDelay: 0.6, ease: "easeOut" }}
              />
            ))}

            <motion.svg
              viewBox="0 0 120 120"
              className="complete-fx-gem h-32 w-32"
              aria-hidden
              initial={{ scale: 0, rotate: -160, y: 30 }}
              animate={{ scale: 1, rotate: 0, y: [30, 0, -6, 0] }}
              transition={{ type: "spring", stiffness: 180, damping: 13, y: { duration: 2.4, times: [0, 0.35, 0.7, 1] } }}
            >
              <defs>
                <linearGradient id="cfx-g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#e0f7ff" />
                  <stop offset="0.45" stopColor="#7dd3fc" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
                <linearGradient id="cfx-g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="60,6 100,34 100,86 60,114 20,86 20,34" fill="url(#cfx-g1)" stroke="#f0fbff" strokeWidth="2.5" />
              <polygon points="60,6 100,34 60,48 20,34" fill="url(#cfx-g2)" opacity="0.7" />
              <polyline points="20,34 60,48 100,34 M60,48 60,114" fill="none" stroke="#f0fbff" strokeOpacity="0.55" strokeWidth="1.5" />
              <motion.path
                d="M40 62l14 14 27-30"
                fill="none"
                stroke="#0b1530"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
              />
            </motion.svg>

            <h2 className="complete-fx-title mt-4 flex font-display text-5xl font-bold tracking-wider sm:text-6xl" aria-label="COMPLETE!">
              {TITLE.map((ch, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  initial={{ y: 40, opacity: 0, rotateX: -90, scale: 0.6 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.5 + i * 0.05 }}
                >
                  {ch}
                </motion.span>
              ))}
            </h2>

            <motion.p
              className="mt-2 font-display text-xl font-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
            >
              {name} さん、今日の宿題 ぜんぶ できたね！
            </motion.p>

            <motion.div
              className="complete-fx-stats mt-5 grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 18, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 18, delay: 1.3 }}
            >
              <div className="complete-fx-stat rounded-3xl px-5 py-3">
                <p className="text-xs font-bold opacity-80">🔥 れんぞく</p>
                <p className="font-display text-4xl font-bold">
                  <CountUp value={streak} duration={1.4} />
                  <span className="ml-1 text-base">回</span>
                </p>
              </div>
              <div className="complete-fx-stat rounded-3xl px-5 py-3">
                <p className="text-xs font-bold opacity-80">✅ 通算</p>
                <p className="font-display text-4xl font-bold">
                  <CountUp value={total} duration={1.4} />
                  <span className="ml-1 text-base">回</span>
                </p>
              </div>
            </motion.div>

            <motion.p
              className="complete-fx-bonus mt-3 rounded-full px-4 py-1.5 text-sm font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
            >
              🎁 あと {bonus.left} 回で コンプリートボーナス！
            </motion.p>

            <motion.button
              type="button"
              className="student-command complete-fx-close mt-6 rounded-full px-10 py-3 font-display text-lg font-bold"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.92 }}
              transition={{ delay: 1.9, type: "spring", stiffness: 300, damping: 18 }}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              やったね！
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
