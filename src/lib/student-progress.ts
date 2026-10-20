/**
 * 児童ページの「つぎのランクまで」「つぎのボーナスまで」の表示用計算。
 * ランク判定（rankOfPoints）と同じ通算ポイント・同じ基準を読むだけで、保存や付与はしない。
 */
import { RANK_ORDER, rankOfPoints, type Rank, type RankRules } from "@/lib/homework-store";

export type NextRankInfo = {
  current: Rank;
  /** つぎのランク（さいこうランクなら null） */
  next: Rank | null;
  /** つぎのランクまで あと何pt */
  need: number;
  /** いまのランクの中での進み具合（0〜1） */
  ratio: number;
};

export function nextRankInfo(rules: RankRules, earned: number): NextRankInfo {
  const current = rankOfPoints(rules, earned);
  const idx = RANK_ORDER.indexOf(current);
  const next = RANK_ORDER.slice(idx + 1).find((r) => (rules[r] ?? 0) > earned) ?? null;
  if (!next) return { current, next: null, need: 0, ratio: 1 };
  const from = rules[current] ?? 0;
  const to = rules[next] ?? 0;
  const span = Math.max(1, to - from);
  return {
    current,
    next,
    need: Math.max(0, to - earned),
    ratio: Math.min(1, Math.max(0, (earned - from) / span)),
  };
}

/** コンプリートボーナス（5回ごと）のつぎの到達回数と、あと何回か */
export function nextCompleteBonus(total: number, every = 5) {
  const at = (Math.floor(total / every) + 1) * every;
  return { at, left: at - total };
}
