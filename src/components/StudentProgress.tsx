import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

import { RANK_STYLE } from "@/lib/rank-style";
import type { Rank, RankRules } from "@/lib/homework-store";
import { nextCompleteBonus, nextRankInfo } from "@/lib/student-progress";

/** 0 から目標の数まで、ふわっとカウントアップする数字 */
export function CountUp({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const c = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [mv, value, duration]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

const RANK_GEM: Record<Rank, string> = { NORMAL: "💠", GOLD: "👑", BLACK: "🖤" };

type Props = {
  streak: number;
  total: number;
  completeToday: boolean;
  earned: number;
  rankRules: RankRules;
  /** 今日の宿題のこり */
  left: number;
  /** "full" = 連続とランクの両方、"rank" = ランクだけ、"streak" = 連続だけ */
  variant?: "full" | "rank" | "streak";
};

/** 児童ページ：れんぞくコンプリートと、つぎのランクまでのカード */
export default function StudentProgress({
  streak,
  total,
  completeToday,
  earned,
  rankRules,
  left,
  variant = "full",
}: Props) {
  const info = nextRankInfo(rankRules, earned);
  const bonus = nextCompleteBonus(total);
  const hot = streak >= 3;

  const streakCard = (
    <motion.div
      className={`stu-streak student-inset relative overflow-hidden rounded-3xl p-4 ${hot ? "stu-streak-hot" : ""}`}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <span className="stu-streak-aura" aria-hidden />
      <div className="relative flex items-center gap-3">
        <motion.span
          className="stu-flame grid h-16 w-16 shrink-0 place-content-center rounded-2xl text-4xl"
          aria-hidden
          animate={streak > 0 ? { scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {streak > 0 ? "🔥" : "🌱"}
        </motion.span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted-foreground">れんぞくコンプリート</p>
          <p className="font-display text-3xl font-bold leading-tight">
            <span className="stu-streak-num">
              <CountUp value={streak} />
            </span>
            <span className="ml-1 text-base">回</span>
          </p>
        </div>
        <span
          className={`stu-today-chip shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            completeToday || left === 0 ? "stu-today-done" : ""
          }`}
        >
          {completeToday || left === 0 ? "✓ きょう コンプリート" : `きょう あと ${left} こ`}
        </span>
      </div>
      <div className="relative mt-3 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="stu-mini rounded-2xl px-2 py-2">
          <p className="text-muted-foreground">✅ 通算コンプリート</p>
          <p className="font-display text-lg font-bold">
            <CountUp value={total} /> 回
          </p>
        </div>
        <div className="stu-mini rounded-2xl px-2 py-2">
          <p className="text-muted-foreground">🎁 ボーナスまで</p>
          <p className="font-display text-lg font-bold">
            あと <CountUp value={bonus.left} /> 回
          </p>
        </div>
      </div>
    </motion.div>
  );

  const rankCard = (
    <motion.div
      className={`stu-rank student-inset relative overflow-hidden rounded-3xl p-4 stu-rank-${info.current.toLowerCase()}`}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.08 }}
    >
      <div className="flex items-center gap-2">
        <span className="stu-rank-badge rounded-full px-3 py-1 font-display text-xs font-bold tracking-widest">
          {RANK_GEM[info.current]} {RANK_STYLE[info.current].label}
        </span>
        {info.next && (
          <>
            <motion.span
              className="text-muted-foreground"
              aria-hidden
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            >
              ›››
            </motion.span>
            <span className="stu-rank-badge stu-rank-next rounded-full px-3 py-1 font-display text-xs font-bold tracking-widest">
              {RANK_GEM[info.next]} {RANK_STYLE[info.next].label}
            </span>
          </>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          通算 <b className="font-display text-sm text-foreground"><CountUp value={earned} /></b> pt
        </span>
      </div>

      <p className="mt-3 font-display text-lg font-bold">
        {info.next ? (
          <>
            {RANK_STYLE[info.next].label} まで あと{" "}
            <span className="stu-rank-need text-3xl">
              <CountUp value={info.need} />
            </span>{" "}
            pt
          </>
        ) : (
          <>さいこうランク {RANK_STYLE[info.current].label} たっせい！</>
        )}
      </p>

      <div className="stu-rank-track mt-2 h-4 overflow-hidden rounded-full">
        <motion.div
          className="stu-rank-fill relative h-full rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.max(4, info.ratio * 100)}%` }}
          transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <span className="stu-rank-shine" aria-hidden />
        </motion.div>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        ガチャでポイントをつかっても、ランクは さがりません
      </p>
    </motion.div>
  );

  if (variant === "rank") return <section className="kid-panel p-3">{rankCard}</section>;
  if (variant === "streak") return <section className="kid-panel p-3">{streakCard}</section>;
  return (
    <section className="kid-panel grid gap-3 p-3 md:grid-cols-2">
      {streakCard}
      {rankCard}
    </section>
  );
}
