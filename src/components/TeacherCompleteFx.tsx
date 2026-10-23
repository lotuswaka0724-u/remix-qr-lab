import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { playCompleteFanfare } from "@/lib/feedback";

/** 教師画面：今日の提出状況が100%になった瞬間の達成演出（表示のみ） */
export default function TeacherCompleteFx({ pct, total }: { pct: number; total: number }) {
  const [open, setOpen] = useState(false);
  const prev = useRef<number | null>(null);

  const play = () => {
    setOpen(true);
    try {
      playCompleteFanfare();
    } catch {
      /* 音が出なくても演出は続ける */
    }
    void import("canvas-confetti").then(({ default: confetti }) => {
      const colors = ["#7dd3fc", "#c4b5fd", "#fde68a", "#f0abfc", "#ffffff"];
      const end = Date.now() + 1600;
      const burst = () => {
        confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.35 }, colors, shapes: ["star"], zIndex: 90, disableForReducedMotion: true });
        confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.35 }, colors, shapes: ["star"], zIndex: 90, disableForReducedMotion: true });
        if (Date.now() < end) requestAnimationFrame(burst);
      };
      confetti({ particleCount: 140, spread: 110, startVelocity: 48, origin: { y: 0.3 }, colors, zIndex: 90, disableForReducedMotion: true });
      burst();
    });
  };

  useEffect(() => {
    const was = prev.current;
    prev.current = pct;
    if (was !== null && was < 100 && pct === 100 && total > 0) play();
  }, [pct, total]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 5200);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <>
      {pct === 100 && total > 0 && (
        <button type="button" onClick={play} className="tcfx-replay rounded-full px-2.5 py-0.5 text-xs font-bold">
          ✨ もう一度見る
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            className="tcfx-overlay"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.div className="tcfx-ring" initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 3.2, opacity: 0 }} transition={{ duration: 1.4, ease: "easeOut" }} />
            <motion.div className="tcfx-ring tcfx-ring-2" initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 1.4, delay: 0.25, ease: "easeOut" }} />
            <motion.div
              className="tcfx-card"
              initial={{ scale: 0.6, y: 30, rotateX: 35, opacity: 0 }}
              animate={{ scale: 1, y: 0, rotateX: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 16 }}
            >
              <motion.div className="tcfx-crown" animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity }}>
                👑
              </motion.div>
              <p className="tcfx-pct font-display">100%</p>
              <p className="tcfx-title font-display">
                {"全員提出コンプリート！".split("").map((c, i) => (
                  <motion.span key={i} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 + i * 0.05, type: "spring", stiffness: 300, damping: 14 }}>
                    {c}
                  </motion.span>
                ))}
              </p>
              <p className="tcfx-sub">今日の宿題がすべてそろいました 🎉</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
