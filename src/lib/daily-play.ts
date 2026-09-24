/**
 * 短時間利用のための「1日の利用ルール」と「宿題コンプリート」の計算。
 * 既存のポイント計算・宿題記録には手を入れず、読むだけで判定する。
 */
import type { CollCategory } from "@/lib/collection-catalog";
import type { AppState, Status } from "@/lib/homework-store";

export type UsageRules = {
  /** 1日のガチャ回数 */
  gachaPerDay: number;
  /** カテゴリごとの1日の変更回数 */
  customPerDay: Record<CollCategory, number>;
  /** 宿題コンプリート5回ごとのボーナス点 */
  completeBonus: number;
};

export const DEFAULT_USAGE_RULES: UsageRules = {
  gachaPerDay: 1,
  customPerDay: { background: 1, icon: 1, frame: 1, sound: 1, effect: 1 },
  completeBonus: 5,
};

export const normalizeUsageRules = (raw?: Partial<UsageRules> | null): UsageRules => ({
  gachaPerDay: clampInt(raw?.gachaPerDay, DEFAULT_USAGE_RULES.gachaPerDay),
  customPerDay: {
    ...DEFAULT_USAGE_RULES.customPerDay,
    ...Object.fromEntries(
      Object.entries(raw?.customPerDay ?? {}).map(([k, v]) => [k, clampInt(v, 1)]),
    ),
  } as Record<CollCategory, number>,
  completeBonus: clampInt(raw?.completeBonus, DEFAULT_USAGE_RULES.completeBonus),
});

function clampInt(v: unknown, fallback: number) {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 999) : fallback;
}

/** 日本時間の日付（YYYY-MM-DD）。日次の回数はこの日付で切りかわる */
export const jstDay = (now = Date.now()) => new Date(now + 9 * 3600_000).toISOString().slice(0, 10);

/** 合格とみなす状態（提出済み・直し完了・学校でやった） */
const PASS: Status[] = ["submitted", "fixed", "school"];

const toStatus = (v: Status | boolean | undefined): Status =>
  v === true ? "submitted" : !v ? "none" : (v as Status);

export type CompleteStats = {
  /** これまでの宿題コンプリート回数 */
  total: number;
  /** いまの連続コンプリート回数 */
  streak: number;
  /** 今日コンプリートしたか */
  today: boolean;
};

/**
 * 宿題コンプリートの判定。
 * ・その日の対象宿題 = その日にクラスのだれかに記録がある宿題（今日は「今日の宿題」も含める）
 * ・対象宿題がない日は判定しない（連続も途切れない）
 * ・対象宿題がすべて合格（提出済み／直し完了／学校でやった）ならコンプリート
 * ・今日がまだ未完了のときは、連続を途切れさせない（一日が終わっていないため）
 */
export function completeStats(
  state: Partial<AppState>,
  studentId: string,
  today: string,
): CompleteStats {
  const records = state.records ?? {};
  const todayTargets = (state.assignments ?? []).filter((a) => a.inToday).map((a) => a.id);
  const dates = new Set(Object.keys(records));
  if (todayTargets.length) dates.add(today);

  let total = 0;
  let streak = 0;
  let doneToday = false;
  for (const date of [...dates].filter((d) => d <= today).sort()) {
    const day = records[date] ?? {};
    const targets = new Set<string>();
    for (const rec of Object.values(day)) for (const id of Object.keys(rec ?? {})) targets.add(id);
    if (date === today) for (const id of todayTargets) targets.add(id);
    if (!targets.size) continue;
    const mine = day[studentId] ?? {};
    const ok = [...targets].every((id) => PASS.includes(toStatus(mine[id])));
    if (ok) {
      total += 1;
      streak += 1;
      if (date === today) doneToday = true;
    } else if (date !== today) {
      streak = 0;
    }
  }
  return { total, streak, today: doneToday };
}

/** ボーナスの記録ID（到達回数ごとに1つだけ。同じIDは二度と追加しない） */
export const completeBonusId = (studentId: string, milestone: number) =>
  `cb_${studentId}_${milestone}`;

/** 到達ずみのマイルストーン（5, 10, 15, …） */
export const reachedMilestones = (total: number) =>
  Array.from({ length: Math.floor(total / 5) }, (_, i) => (i + 1) * 5);

/* ---------- セットコレクション（既存景品の名前からテーマでまとめる） ---------- */

export type CollSet = {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
  exclude?: string[];
};

export const COLL_SETS: CollSet[] = [
  { id: "star", label: "星空", icon: "⭐", keywords: ["星", "スター", "すいせい", "りゅうせい", "ほしがでる"], exclude: ["ハムスター"] },
  { id: "space", label: "宇宙", icon: "🪐", keywords: ["宇宙", "ギャラクシー", "ぎんが", "ロケット", "うちゅう", "ユーフォー"] },
  { id: "sea", label: "海と水", icon: "🌊", keywords: ["海", "さかな", "クジラ", "サメ", "タコ", "カニ", "ウォーター", "オーシャン", "かいてい", "しんかい", "みずべ", "しゃぼん"] },
  { id: "nature", label: "しぜん", icon: "🌳", keywords: ["森", "もり", "そうげん", "たけばやし", "はたけ", "フォレスト", "さくら", "青空", "くもぞら"] },
  { id: "sports", label: "スポーツ", icon: "⚽", keywords: ["スポーツ", "サッカー", "やきゅう", "バスケ", "スタジアム", "サーキット", "レーシングカー", "トロフィー"] },
  { id: "sweets", label: "おやつ", icon: "🍰", keywords: ["お菓子", "ケーキ", "キャンディ", "いちご", "ミント", "レモン", "ソーダ", "ピーチ", "グレープ", "ライム", "おすし", "ラーメン"] },
  { id: "magic", label: "まほう", icon: "🔮", keywords: ["まほう", "ユニコーン", "クリスタル", "プリズム", "オーロラ", "にじ", "レインボー"] },
  { id: "dragon", label: "ドラゴン", icon: "🐉", keywords: ["ドラゴン", "きょうりゅう"] },
  { id: "gold", label: "ゴールド", icon: "👑", keywords: ["ゴールド", "おうかん"] },
  { id: "black", label: "ブラック", icon: "🖤", keywords: ["ブラック"] },
];

export function setMembers<T extends { id: string; name: string }>(set: CollSet, items: T[]) {
  return items.filter(
    (i) =>
      set.keywords.some((k) => i.name.includes(k)) &&
      !(set.exclude ?? []).some((k) => i.name.includes(k)),
  );
}
