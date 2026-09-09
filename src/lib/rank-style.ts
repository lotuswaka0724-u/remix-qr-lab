import type { Rank } from "@/lib/homework-store";

export type RankStyle = {
  /** カードや演出に出すラベル */
  label: string;
  /** 児童向けの日本語の呼び方 */
  jp: string;
  /** 印刷カードの色づかい */
  card: string;
  /** カードのランクバッジ */
  badge: string;
  /** 画面演出の色 */
  fxWash: string;
  fxPanel: string;
  fxRing: string;
  fxText: string;
  confetti: string[];
  /** 紙吹雪の枚数（ランクが上がるほど豪華に） */
  pieces: number;
};

/** ランクごとの見た目。あとからランクを増やすときはここに足すだけでよい */
export const RANK_STYLE: Record<Rank, RankStyle> = {
  NORMAL: {
    label: "NORMAL",
    jp: "ノーマル",
    card: "bg-white text-[#0f172a] border-[#bfdbfe]",
    badge: "bg-[#dbeafe] text-[#1d4ed8]",
    fxWash: "bg-success/25",
    fxPanel: "bg-card/95 ring-success/40",
    fxRing: "border-success",
    fxText: "text-success",
    confetti: ["var(--success)", "var(--accent)", "var(--primary)"],
    pieces: 14,
  },
  GOLD: {
    label: "GOLD",
    jp: "ゴールド",
    card: "bg-[linear-gradient(135deg,#fffbe6,#fde68a_45%,#f6c453)] text-[#4a3608] border-[#d9a441]",
    badge: "bg-[#b8860b] text-white",
    fxWash: "bg-[#f6c453]/35",
    fxPanel: "bg-[#fffdf3]/95 ring-[#d9a441]/60",
    fxRing: "border-[#d9a441]",
    fxText: "text-[#a8760b]",
    confetti: ["#f6c453", "#fde68a", "#d9a441", "#fff7cc"],
    pieces: 26,
  },
  BLACK: {
    label: "BLACK",
    jp: "ブラック",
    card: "bg-[linear-gradient(135deg,#0b1220,#1f2937_55%,#111827)] text-[#f8fafc] border-[#0b1220]",
    badge: "bg-[#f8fafc] text-[#0b1220]",
    fxWash: "bg-[#0b1220]/45",
    fxPanel: "bg-[#0b1220]/95 ring-[#e5e7eb]/50 text-[#f8fafc]",
    fxRing: "border-[#e5e7eb]",
    fxText: "text-[#facc15]",
    confetti: ["#f8fafc", "#facc15", "#94a3b8", "#38bdf8"],
    pieces: 40,
  },
};
