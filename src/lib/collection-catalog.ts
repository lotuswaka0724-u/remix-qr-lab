/**
 * ガチャで集めるコレクションアイテムのマスター。
 * マイページ背景／アイコン／アイコンフレーム／QR読み取り効果音／QR読み取りエフェクト の5カテゴリー。
 *
 * ここにデータを足すだけでアイテムを増やせる。将来アバター素材を追加するときも
 * 同じ構造（id / category / rarity / name / asset / art）で足せるようにしてある。
 */

export type CollRarity = "N" | "R" | "SR" | "SSR" | "GOLD" | "BLACK";

/** 演出の豪華さの段階（1=シンプル … 4=最高） */
export const RARITY_TIER: Record<CollRarity, 1 | 2 | 3 | 4> = {
  N: 1,
  R: 2,
  SR: 3,
  SSR: 4,
  GOLD: 4,
  BLACK: 4,
};

export type CollCategory = "background" | "icon" | "frame" | "sound" | "effect";

export type CollItem = {
  id: string;
  name: string;
  category: CollCategory;
  rarity: CollRarity;
  description: string;
  /** はじめから持っているアイテム（ガチャには出ない） */
  initial?: boolean;
  /** 将来、画像や音声ファイルに差し替えるための場所。未設定なら内蔵の描画・音をつかう */
  asset?: string;
  art: Record<string, string>;
};

export const COLL_CATEGORY_LABEL: Record<CollCategory, string> = {
  background: "マイページ背景",
  icon: "アイコン",
  frame: "アイコンフレーム",
  sound: "読み取り効果音",
  effect: "読み取りエフェクト",
};

export const COLL_CATEGORY_ICON: Record<CollCategory, string> = {
  background: "🖼️",
  icon: "😀",
  frame: "⭕",
  sound: "🔔",
  effect: "✨",
};

export const COLL_RARITY_META: Record<
  CollRarity,
  { label: string; tone: string; ring: string; weight: number; minRank: "NORMAL" | "GOLD" | "BLACK" }
> = {
  N: { label: "N", tone: "bg-slate-200 text-slate-700", ring: "ring-slate-300", weight: 55, minRank: "NORMAL" },
  R: { label: "R", tone: "bg-sky-200 text-sky-900", ring: "ring-sky-400", weight: 27, minRank: "NORMAL" },
  SR: { label: "SR", tone: "bg-violet-200 text-violet-900", ring: "ring-violet-400", weight: 13, minRank: "NORMAL" },
  GOLD: { label: "GOLD", tone: "bg-amber-200 text-amber-900", ring: "ring-amber-400", weight: 4, minRank: "GOLD" },
  BLACK: { label: "BLACK", tone: "bg-slate-900 text-amber-200", ring: "ring-slate-900", weight: 1, minRank: "BLACK" },
};

export const COLL_RARITY_ORDER: CollRarity[] = ["N", "R", "SR", "GOLD", "BLACK"];

const bg = (
  id: string,
  name: string,
  rarity: CollRarity,
  css: string,
  description: string,
  initial = false,
): CollItem => ({
  id: `bg_${id}`,
  name,
  category: "background",
  rarity,
  description,
  initial,
  art: { css },
});

const icon = (id: string, name: string, rarity: CollRarity, emoji: string, initial = false): CollItem => ({
  id: `ic_${id}`,
  name,
  category: "icon",
  rarity,
  description: `${name}のアイコン`,
  initial,
  art: { emoji },
});

const frame = (
  id: string,
  name: string,
  rarity: CollRarity,
  ring: string,
  description: string,
  initial = false,
): CollItem => ({
  id: `fr_${id}`,
  name,
  category: "frame",
  rarity,
  description,
  initial,
  art: { ring },
});

const sound = (id: string, name: string, rarity: CollRarity, tune: string, description: string, initial = false): CollItem => ({
  id: `sd_${id}`,
  name,
  category: "sound",
  rarity,
  description,
  initial,
  art: { tune },
});

const effect = (id: string, name: string, rarity: CollRarity, fx: string, description: string, initial = false): CollItem => ({
  id: `ef_${id}`,
  name,
  category: "effect",
  rarity,
  description,
  initial,
  art: { fx },
});

export const COLL_ITEMS: CollItem[] = [
  /* ---------- マイページ背景 ---------- */
  bg("simple", "シンプル", "N", "linear-gradient(160deg,#f8fafc,#e2e8f0)", "まっさらな背景", true),
  bg("sky", "青空", "N", "linear-gradient(160deg,#bae6fd,#7dd3fc 60%,#e0f2fe)", "きもちいい青い空"),
  bg("sea", "海", "N", "linear-gradient(160deg,#67e8f9,#0891b2 70%,#075985)", "きらきらの海"),
  bg("forest", "森", "N", "linear-gradient(160deg,#bbf7d0,#4ade80 65%,#15803d)", "みどりの森"),
  bg("pop", "ポップ", "N", "linear-gradient(135deg,#fef08a,#fda4af 50%,#a5b4fc)", "カラフルでたのしい"),
  bg("sports", "スポーツ", "R", "linear-gradient(135deg,#fdba74,#f97316 60%,#7c2d12)", "うんどうがすき"),
  bg("sweets", "お菓子", "R", "linear-gradient(135deg,#fde68a,#f9a8d4 60%,#fbcfe8)", "あまいおかしの国"),
  bg("sakura", "はるのさくら", "R", "linear-gradient(160deg,#fce7f3,#f9a8d4 70%,#fb7185)", "きせつの背景"),
  bg("sunset", "ゆうやけ", "R", "linear-gradient(160deg,#fed7aa,#fb7185 55%,#7c3aed)", "きれいな夕やけ"),
  bg("night", "星空", "SR", "linear-gradient(160deg,#0f172a,#1e3a8a 60%,#312e81)", "たくさんの星"),
  bg("space", "宇宙", "SR", "radial-gradient(circle at 30% 20%,#6366f1,#0f172a 70%)", "うちゅうへ出発"),
  bg("aurora", "オーロラ", "SR", "linear-gradient(135deg,#34d399,#22d3ee 45%,#818cf8)", "空にゆれる光"),
  bg("gold", "ゴールドルーム", "GOLD", "linear-gradient(135deg,#fffbe6,#fcd34d 45%,#b45309)", "ゴールドだけの背景"),
  bg("black", "ブラックギャラクシー", "BLACK", "radial-gradient(circle at 70% 25%,#facc15 0%,#111827 45%,#000000 100%)", "さいこうきゅうの背景"),

  /* ---------- アイコン ---------- */
  icon("cat", "ねこ", "N", "🐱", true),
  icon("dog", "いぬ", "N", "🐶"),
  icon("panda", "パンダ", "N", "🐼"),
  icon("frog", "カエル", "N", "🐸"),
  icon("fox", "きつね", "N", "🦊"),
  icon("penguin", "ペンギン", "N", "🐧"),
  icon("sushi", "おすし", "N", "🍣"),
  icon("ramen", "ラーメン", "N", "🍜"),
  icon("cake", "ケーキ", "N", "🍰"),
  icon("soccer", "サッカー", "N", "⚽"),
  icon("baseball", "やきゅう", "N", "⚾"),
  icon("basket", "バスケ", "R", "🏀"),
  icon("train", "でんしゃ", "R", "🚄"),
  icon("rocket", "ロケット", "R", "🚀"),
  icon("car", "レーシングカー", "R", "🏎️"),
  icon("dino", "きょうりゅう", "R", "🦖"),
  icon("ghost", "おばけ", "R", "👻"),
  icon("alien", "うちゅうじん", "R", "👽"),
  icon("robot", "ロボット", "R", "🤖"),
  icon("rainbow", "にじ", "R", "🌈"),
  icon("volcano", "かざん", "SR", "🌋"),
  icon("dragon", "ドラゴン", "SR", "🐉"),
  icon("unicorn", "ユニコーン", "SR", "🦄"),
  icon("wizard", "まほうつかい", "SR", "🧙"),
  icon("trophy", "トロフィー", "GOLD", "🏆"),
  icon("crown", "おうかん", "BLACK", "👑"),

  /* ---------- アイコンフレーム ---------- */
  frame("simple", "シンプル", "N", "#94a3b8", "きほんのフレーム", true),
  frame("blue", "ブルー", "N", "#3b82f6", "さわやかな青"),
  frame("green", "グリーン", "N", "#22c55e", "げんきなみどり"),
  frame("pink", "ピンク", "N", "#f472b6", "やさしいピンク"),
  frame("colorful", "カラフル", "R", "conic-gradient(#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f87171)", "ぐるっとカラフル"),
  frame("star", "スター", "R", "linear-gradient(135deg,#fde68a,#f59e0b)", "星のかがやき"),
  frame("heart", "ハート", "R", "linear-gradient(135deg,#fb7185,#f472b6)", "ハートのふち"),
  frame("water", "ウォーター", "R", "linear-gradient(135deg,#38bdf8,#0ea5e9)", "水のながれ"),
  frame("thunder", "いなずま", "SR", "linear-gradient(135deg,#fef08a,#7c3aed)", "ビリビリ光る"),
  frame("fire", "ほのお", "SR", "linear-gradient(135deg,#fb923c,#dc2626)", "もえる炎"),
  frame("rainbow", "レインボー", "SR", "conic-gradient(#ef4444,#f97316,#facc15,#22c55e,#3b82f6,#a855f7,#ef4444)", "にじいろのふち"),
  frame("gold", "ゴールドクラウン", "GOLD", "linear-gradient(135deg,#fff7cc,#f6c453,#b8860b)", "ゴールドだけのフレーム"),
  frame("black", "ブラックプレミアム", "BLACK", "linear-gradient(135deg,#facc15,#0b1220 45%,#facc15)", "さいこうきゅうのフレーム"),

  /* ---------- QR読み取り効果音 ---------- */
  sound("pico", "ピコン", "N", "pico", "みじかく ピコン", true),
  sound("pon", "ポン", "N", "pon", "やさしい ポン"),
  sound("kira", "キラッ", "N", "kira", "たかい音で キラッ"),
  sound("chime", "チャイム", "N", "chime", "ポーンとチャイム"),
  sound("coin", "コイン", "R", "coin", "コインをゲットした音"),
  sound("sparkle", "キラキラ", "R", "sparkle", "キラキラひろがる音"),
  sound("levelup", "レベルアップ", "SR", "levelup", "つよくなった音"),
  sound("fanfare", "ファンファーレ", "SR", "fanfare", "おめでとうの音"),
  sound("gold", "ゴールドファンファーレ", "GOLD", "gold", "ゴールドだけの豪華な音"),
  sound("black", "ブラックシンフォニー", "BLACK", "black", "いちばん豪華な音"),

  /* ---------- QR読み取りエフェクト ---------- */
  effect("spark", "小さな光", "N", "spark", "ぽわっと光る", true),
  effect("pop", "ポンッ", "N", "pop", "ポンッとひろがる"),
  effect("stars", "ほしがでる", "N", "stars", "星がぴょこん"),
  effect("bubble", "しゃぼん玉", "N", "bubble", "ふわふわうかぶ"),
  effect("glitter", "キラキラ", "R", "glitter", "キラキラがまう"),
  effect("ring", "光のリング", "R", "ring", "光の輪がひろがる"),
  effect("coin", "コインラッシュ", "R", "coin", "コインがふってくる"),
  effect("confetti", "カラフル紙ふぶき", "SR", "confetti", "いろとりどりの紙ふぶき"),
  effect("starfall", "スターシャワー", "SR", "starfall", "星がふりそそぐ"),
  effect("gold", "ゴールドバースト", "GOLD", "gold", "金色の大きな光"),
  effect("black", "ブラックオーロラ", "BLACK", "black", "さいこうきゅうの大演出"),
];

export const COLL_ITEM_BY_ID: Record<string, CollItem> = Object.fromEntries(
  COLL_ITEMS.map((i) => [i.id, i]),
);

export const collItemsOf = (category: CollCategory) =>
  COLL_ITEMS.filter((i) => i.category === category);

export const COLL_INITIAL_IDS = COLL_ITEMS.filter((i) => i.initial).map((i) => i.id);

export const COLL_CATEGORIES: CollCategory[] = ["background", "icon", "frame", "sound", "effect"];

/** 画面に出すときの見た目（背景CSS・フレームのふち色など） */
export const backgroundCss = (id?: string) =>
  COLL_ITEM_BY_ID[id ?? ""]?.art["css"] ?? COLL_ITEM_BY_ID["bg_simple"]!.art["css"]!;

export const frameRing = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["ring"] ?? null;

export const iconEmoji = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["emoji"] ?? null;

export const soundTune = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["tune"] ?? null;

export const effectFx = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["fx"] ?? null;
