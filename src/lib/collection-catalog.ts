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
  /** 画像素材のパス（例: /icons/cat.png）。入れると絵文字より優先して表示する */
  image?: string;
  /** 一覧表示だけに使うサムネイル画像。本体の素材とは別に管理する */
  thumb?: string;
  /** 一覧での表示順（小さいほど先。未設定は登録順） */
  sort?: number;
  /** ガチャで手に入るか（false にすると出ない。未設定は true） */
  obtainable?: boolean;
  /** 素材の出どころ（lovable-ai / elevenlabs / klipy / teacher など） */
  provider?: string;
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
  {
    label: string;
    tone: string;
    ring: string;
    weight: number;
    minRank: "NORMAL" | "GOLD" | "BLACK";
  }
> = {
  N: {
    label: "N",
    tone: "bg-slate-200 text-slate-700",
    ring: "ring-slate-300",
    weight: 55,
    minRank: "NORMAL",
  },
  R: {
    label: "R",
    tone: "bg-sky-200 text-sky-900",
    ring: "ring-sky-400",
    weight: 27,
    minRank: "NORMAL",
  },
  SR: {
    label: "SR",
    tone: "bg-violet-200 text-violet-900",
    ring: "ring-violet-400",
    weight: 13,
    minRank: "NORMAL",
  },
  SSR: {
    label: "SSR",
    tone: "bg-fuchsia-200 text-fuchsia-900",
    ring: "ring-fuchsia-500",
    weight: 6,
    minRank: "NORMAL",
  },
  GOLD: {
    label: "GOLD",
    tone: "bg-amber-200 text-amber-900",
    ring: "ring-amber-400",
    weight: 4,
    minRank: "GOLD",
  },
  BLACK: {
    label: "BLACK",
    tone: "bg-slate-900 text-amber-200",
    ring: "ring-slate-900",
    weight: 1,
    minRank: "BLACK",
  },
};

export const COLL_RARITY_ORDER: CollRarity[] = ["N", "R", "SR", "SSR", "GOLD", "BLACK"];

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

/**
 * アイコン。`image` に画像パス（例: "/icons/cat.png"）を入れると、絵文字ではなく
 * その画像を表示する。画像を用意するまでは絵文字が仮の見た目になる。
 */
const icon = (
  id: string,
  name: string,
  rarity: CollRarity,
  emoji: string,
  initial = false,
  image?: string,
  sort?: number,
): CollItem => ({
  id: `ic_${id}`,
  name,
  category: "icon",
  rarity,
  description: `${name}のアイコン`,
  initial,
  ...(image ? { image } : {}),
  ...(sort !== undefined ? { sort } : {}),
  art: { emoji, ...(image ? { image } : {}) },
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

const sound = (
  id: string,
  name: string,
  rarity: CollRarity,
  tune: string,
  description: string,
  initial = false,
): CollItem => ({
  id: `sd_${id}`,
  name,
  category: "sound",
  rarity,
  description,
  initial,
  art: { tune },
});

const effect = (
  id: string,
  name: string,
  rarity: CollRarity,
  fx: string,
  description: string,
  initial = false,
): CollItem => ({
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
  bg(
    "pop",
    "ポップ",
    "N",
    "linear-gradient(135deg,#fef08a,#fda4af 50%,#a5b4fc)",
    "カラフルでたのしい",
  ),
  bg(
    "sports",
    "スポーツ",
    "R",
    "linear-gradient(135deg,#fdba74,#f97316 60%,#7c2d12)",
    "うんどうがすき",
  ),
  bg(
    "sweets",
    "お菓子",
    "R",
    "linear-gradient(135deg,#fde68a,#f9a8d4 60%,#fbcfe8)",
    "あまいおかしの国",
  ),
  bg(
    "sakura",
    "はるのさくら",
    "R",
    "linear-gradient(160deg,#fce7f3,#f9a8d4 70%,#fb7185)",
    "きせつの背景",
  ),
  bg(
    "sunset",
    "ゆうやけ",
    "R",
    "linear-gradient(160deg,#fed7aa,#fb7185 55%,#7c3aed)",
    "きれいな夕やけ",
  ),
  bg("night", "星空", "SR", "linear-gradient(160deg,#0f172a,#1e3a8a 60%,#312e81)", "たくさんの星"),
  bg(
    "space",
    "宇宙",
    "SR",
    "radial-gradient(circle at 30% 20%,#6366f1,#0f172a 70%)",
    "うちゅうへ出発",
  ),
  bg(
    "aurora",
    "オーロラ",
    "SR",
    "linear-gradient(135deg,#34d399,#22d3ee 45%,#818cf8)",
    "空にゆれる光",
  ),
  bg(
    "gold",
    "ゴールドルーム",
    "GOLD",
    "linear-gradient(135deg,#fffbe6,#fcd34d 45%,#b45309)",
    "ゴールドだけの背景",
  ),
  bg(
    "black",
    "ブラックギャラクシー",
    "BLACK",
    "radial-gradient(circle at 70% 25%,#facc15 0%,#111827 45%,#000000 100%)",
    "さいこうきゅうの背景",
  ),

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
  frame(
    "colorful",
    "カラフル",
    "R",
    "conic-gradient(#f87171,#fbbf24,#34d399,#60a5fa,#a78bfa,#f87171)",
    "ぐるっとカラフル",
  ),
  frame("star", "スター", "R", "linear-gradient(135deg,#fde68a,#f59e0b)", "星のかがやき"),
  frame("heart", "ハート", "R", "linear-gradient(135deg,#fb7185,#f472b6)", "ハートのふち"),
  frame("water", "ウォーター", "R", "linear-gradient(135deg,#38bdf8,#0ea5e9)", "水のながれ"),
  frame("thunder", "いなずま", "SR", "linear-gradient(135deg,#fef08a,#7c3aed)", "ビリビリ光る"),
  frame("fire", "ほのお", "SR", "linear-gradient(135deg,#fb923c,#dc2626)", "もえる炎"),
  frame(
    "rainbow",
    "レインボー",
    "SR",
    "conic-gradient(#ef4444,#f97316,#facc15,#22c55e,#3b82f6,#a855f7,#ef4444)",
    "にじいろのふち",
  ),
  frame(
    "gold",
    "ゴールドクラウン",
    "GOLD",
    "linear-gradient(135deg,#fff7cc,#f6c453,#b8860b)",
    "ゴールドだけのフレーム",
  ),
  frame(
    "black",
    "ブラックプレミアム",
    "BLACK",
    "linear-gradient(135deg,#facc15,#0b1220 45%,#facc15)",
    "さいこうきゅうのフレーム",
  ),

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

  /* ============================================================
   * 追加コレクション（80種類）
   * 外部サービスを使わず、内蔵の絵文字・CSSだけで見た目を作っている。
   * 後から image / thumb に実素材のパスを足せば、そのまま差し替えできる。
   * ============================================================ */

  /* ---------- 追加アイコン（34） ---------- */
  icon("tiger", "とら", "N", "🐯"),
  icon("rabbit", "うさぎ", "N", "🐰"),
  icon("bear", "くま", "N", "🐻"),
  icon("koala", "コアラ", "N", "🐨"),
  icon("monkey", "さる", "N", "🐵"),
  icon("hamster", "ハムスター", "N", "🐹"),
  icon("chick", "ひよこ", "N", "🐤"),
  icon("owl", "ふくろう", "N", "🦉"),
  icon("turtle", "かめ", "N", "🐢"),
  icon("fish", "さかな", "N", "🐟"),
  icon("bee", "はち", "N", "🐝"),
  icon("butterfly", "ちょうちょ", "N", "🦋"),
  icon("whale", "クジラ", "R", "🐋"),
  icon("shark", "サメ", "R", "🦈"),
  icon("eagle", "ワシ", "R", "🦅"),
  icon("octopus", "タコ", "R", "🐙"),
  icon("crab", "カニ", "R", "🦀"),
  icon("hedgehog", "ハリネズミ", "R", "🦔"),
  icon("wolf", "オオカミ", "R", "🐺"),
  icon("lion", "ライオン", "R", "🦁"),
  icon("elephant", "ゾウ", "R", "🐘"),
  icon("giraffe", "キリン", "R", "🦒"),
  icon("kangaroo", "カンガルー", "R", "🦘"),
  icon("peacock", "クジャク", "R", "🦚"),
  icon("astronaut", "うちゅうひこうし", "SR", "🧑‍🚀"),
  icon("ninja", "にんじゃ", "SR", "🥷"),
  icon("knight", "きし", "SR", "🛡️"),
  icon("wand", "まほうのつえ", "SR", "🪄"),
  icon("ufo", "ユーフォー", "SR", "🛸"),
  icon("comet", "すいせい", "SR", "☄️"),
  icon("starhero", "星のゆうしゃ", "SSR", "🌟"),
  icon("galaxywhale", "ぎんがクジラ", "SSR", "🌌"),
  icon("golddragon", "ゴールドドラゴン", "GOLD", "🐲"),
  icon("blackstar", "ブラックスター", "BLACK", "✴️"),

  /* ---------- 追加マイページ背景（23） ---------- */
  bg("dawn", "あさやけ", "N", "linear-gradient(160deg,#fde68a,#fb923c 60%,#f472b6)", "朝のそら"),
  bg("cloud", "くもぞら", "N", "linear-gradient(160deg,#f1f5f9,#cbd5e1 60%,#94a3b8)", "しろい雲"),
  bg(
    "meadow",
    "そうげん",
    "N",
    "linear-gradient(160deg,#d9f99d,#65a30d 70%,#365314)",
    "ひろい草原",
  ),
  bg(
    "desert",
    "さばく",
    "N",
    "linear-gradient(160deg,#fef3c7,#fbbf24 65%,#b45309)",
    "あつい砂ばく",
  ),
  bg(
    "snow",
    "ゆきげしき",
    "N",
    "linear-gradient(160deg,#ffffff,#dbeafe 60%,#93c5fd)",
    "しずかな雪",
  ),
  bg(
    "bamboo",
    "たけばやし",
    "N",
    "linear-gradient(160deg,#dcfce7,#16a34a 70%,#14532d)",
    "竹のみち",
  ),
  bg("pond", "みずべ", "N", "linear-gradient(160deg,#cffafe,#22d3ee 65%,#0e7490)", "すずしい水べ"),
  bg("field", "はたけ", "N", "linear-gradient(160deg,#fef9c3,#a3e635 60%,#4d7c0f)", "みのりの畑"),
  bg(
    "strawberry",
    "いちご",
    "R",
    "linear-gradient(135deg,#fee2e2,#fb7185 60%,#be123c)",
    "あまいいちご",
  ),
  bg(
    "mint",
    "ミント",
    "R",
    "linear-gradient(135deg,#ecfdf5,#6ee7b7 60%,#0d9488)",
    "ひんやりミント",
  ),
  bg(
    "lemon",
    "レモン",
    "R",
    "linear-gradient(135deg,#fefce8,#facc15 60%,#ca8a04)",
    "さわやかレモン",
  ),
  bg(
    "island",
    "そらのしま",
    "R",
    "linear-gradient(160deg,#bfdbfe,#38bdf8 55%,#15803d)",
    "空にうかぶ島",
  ),
  bg(
    "deepsea",
    "かいてい",
    "R",
    "linear-gradient(160deg,#0ea5e9,#0c4a6e 65%,#082f49)",
    "ふかい海のなか",
  ),
  bg("morning", "もりのあさ", "R", "linear-gradient(160deg,#fef9c3,#86efac 55%,#166534)", "朝の森"),
  bg(
    "stadium",
    "スタジアム",
    "R",
    "linear-gradient(135deg,#bbf7d0,#22c55e 55%,#1e3a8a)",
    "しあいの日",
  ),
  bg(
    "circuit",
    "サーキット",
    "R",
    "linear-gradient(135deg,#e2e8f0,#475569 55%,#dc2626)",
    "スピードの世界",
  ),
  bg(
    "galaxy",
    "ぎんが",
    "SR",
    "radial-gradient(circle at 40% 35%,#a78bfa,#1e1b4b 70%)",
    "うずまく銀河",
  ),
  bg(
    "meteor",
    "りゅうせいぐん",
    "SR",
    "linear-gradient(160deg,#1e293b,#3730a3 55%,#f59e0b)",
    "ながれ星の夜",
  ),
  bg(
    "lightforest",
    "ひかりのもり",
    "SR",
    "radial-gradient(circle at 50% 80%,#bbf7d0,#065f46 60%,#052e16)",
    "光る森",
  ),
  bg(
    "castle",
    "まほうのしろ",
    "SR",
    "linear-gradient(160deg,#c7d2fe,#6d28d9 60%,#1e1b4b)",
    "まほうのお城",
  ),
  bg(
    "trench",
    "しんかい",
    "SR",
    "radial-gradient(circle at 50% 20%,#22d3ee,#083344 55%,#020617)",
    "まっくらな深海",
  ),
  bg(
    "crystal",
    "クリスタルパレス",
    "SSR",
    "linear-gradient(135deg,#ecfeff,#a5f3fc 40%,#6366f1)",
    "すきとおる宮でん",
  ),
  bg(
    "dragonlair",
    "ドラゴンのすみか",
    "SSR",
    "radial-gradient(circle at 30% 70%,#fb923c,#7f1d1d 55%,#1c1917)",
    "ドラゴンのいる場所",
  ),

  /* ---------- 追加アイコンフレーム（23） ---------- */
  frame("purple", "パープル", "N", "#a855f7", "おちついた紫"),
  frame("orange", "オレンジ", "N", "#f97316", "あかるいオレンジ"),
  frame("yellow", "イエロー", "N", "#eab308", "げんきな黄色"),
  frame("gray", "グレー", "N", "#64748b", "しぶいグレー"),
  frame("brown", "ブラウン", "N", "#92400e", "木のいろ"),
  frame("teal", "ティール", "N", "#14b8a6", "すずしい青みどり"),
  frame("red", "レッド", "N", "#ef4444", "つよい赤"),
  frame("navy", "ネイビー", "N", "#1e3a8a", "ふかい青"),
  frame("sunset", "サンセット", "R", "linear-gradient(135deg,#fbbf24,#f43f5e)", "夕やけのふち"),
  frame("ocean", "オーシャン", "R", "linear-gradient(135deg,#67e8f9,#1d4ed8)", "うみのふち"),
  frame("forest", "フォレスト", "R", "linear-gradient(135deg,#86efac,#166534)", "もりのふち"),
  frame("candy", "キャンディ", "R", "linear-gradient(135deg,#f9a8d4,#c084fc)", "あまいいろ"),
  frame("soda", "ソーダ", "R", "linear-gradient(135deg,#a5f3fc,#60a5fa)", "しゅわしゅわ"),
  frame("grape", "グレープ", "R", "linear-gradient(135deg,#c4b5fd,#6d28d9)", "ぶどうのいろ"),
  frame("peach", "ピーチ", "R", "linear-gradient(135deg,#fed7aa,#fb7185)", "ももいろ"),
  frame("lime", "ライム", "R", "linear-gradient(135deg,#d9f99d,#4d7c0f)", "みずみずしい緑"),
  frame(
    "crystalfr",
    "クリスタル",
    "SR",
    "linear-gradient(135deg,#ecfeff,#67e8f9,#818cf8)",
    "すきとおるふち",
  ),
  frame(
    "galaxyfr",
    "ギャラクシー",
    "SR",
    "conic-gradient(#1e1b4b,#6366f1,#a855f7,#1e1b4b)",
    "うちゅうのふち",
  ),
  frame("aurorafr", "オーロラ", "SR", "linear-gradient(135deg,#34d399,#818cf8)", "ゆれる光のふち"),
  frame("dragonfr", "ドラゴン", "SR", "linear-gradient(135deg,#f97316,#7f1d1d)", "ドラゴンのふち"),
  frame(
    "storm",
    "サンダーストーム",
    "SR",
    "linear-gradient(135deg,#93c5fd,#1e293b)",
    "あらしのふち",
  ),
  frame(
    "prism",
    "プリズム",
    "SSR",
    "conic-gradient(#f0abfc,#a5f3fc,#fde68a,#bbf7d0,#f0abfc)",
    "ひかりをわけるふち",
  ),
  frame("neon", "ネオンリング", "SSR", "linear-gradient(135deg,#22d3ee,#f0abfc)", "光るネオン"),
];

/* ============================================================
 * 実素材（本物の画像・音・アニメ）を内蔵景品にわりあてる。
 * id・名前・カテゴリー・レアリティ・排出設定は一切かえない。素材だけを足す。
 * 素材が読めないときは、もとの絵文字・グラデーション・内蔵音にもどる。
 * ============================================================ */

type RealAsset = { id: string; url: string; provider?: string };

/** 画像がよめなかったときのために、もとの見た目をうしろにかさねる */
const layered = (url: string, base?: string) =>
  `url("${url}") center / cover no-repeat${base ? `, ${base}` : ""}`;

const REAL_ASSETS: RealAsset[] = [
  // アイコン（AI画像生成 / PNG透過）
  { id: "ic_cat", url: "/prizes/icons/cat.png", provider: "lovable-ai" },
  { id: "ic_dog", url: "/prizes/icons/dog.png", provider: "lovable-ai" },
  { id: "ic_panda", url: "/prizes/icons/panda.png", provider: "lovable-ai" },
  { id: "ic_frog", url: "/prizes/icons/frog.png", provider: "lovable-ai" },
  { id: "ic_fox", url: "/prizes/icons/fox.png", provider: "lovable-ai" },
  { id: "ic_penguin", url: "/prizes/icons/penguin.png", provider: "lovable-ai" },
  { id: "ic_sushi", url: "/prizes/icons/sushi.png", provider: "lovable-ai" },
  { id: "ic_ramen", url: "/prizes/icons/ramen.png", provider: "lovable-ai" },
  { id: "ic_cake", url: "/prizes/icons/cake.png", provider: "lovable-ai" },
  { id: "ic_soccer", url: "/prizes/icons/soccer.png", provider: "lovable-ai" },
  { id: "ic_baseball", url: "/prizes/icons/baseball.png", provider: "lovable-ai" },
  { id: "ic_basket", url: "/prizes/icons/basket.png", provider: "lovable-ai" },
  { id: "ic_train", url: "/prizes/icons/train.png", provider: "lovable-ai" },
  { id: "ic_rocket", url: "/prizes/icons/rocket.png", provider: "lovable-ai" },
  { id: "ic_car", url: "/prizes/icons/car.png", provider: "lovable-ai" },
  { id: "ic_dino", url: "/prizes/icons/dino.png", provider: "lovable-ai" },
  { id: "ic_ghost", url: "/prizes/icons/ghost.png", provider: "lovable-ai" },
  { id: "ic_alien", url: "/prizes/icons/alien.png", provider: "lovable-ai" },
  { id: "ic_robot", url: "/prizes/icons/robot.png", provider: "lovable-ai" },
  { id: "ic_rainbow", url: "/prizes/icons/rainbow.png", provider: "lovable-ai" },
  { id: "ic_volcano", url: "/prizes/icons/volcano.png", provider: "lovable-ai" },
  { id: "ic_dragon", url: "/prizes/icons/dragon.png", provider: "lovable-ai" },
  { id: "ic_unicorn", url: "/prizes/icons/unicorn.png", provider: "lovable-ai" },
  { id: "ic_wizard", url: "/prizes/icons/wizard.png", provider: "lovable-ai" },
  { id: "ic_trophy", url: "/prizes/icons/trophy.png", provider: "lovable-ai" },
  { id: "ic_crown", url: "/prizes/icons/crown.png", provider: "lovable-ai" },
  { id: "ic_tiger", url: "/prizes/icons/tiger.png", provider: "lovable-ai" },
  { id: "ic_rabbit", url: "/prizes/icons/rabbit.png", provider: "lovable-ai" },
  { id: "ic_bear", url: "/prizes/icons/bear.png", provider: "lovable-ai" },
  { id: "ic_koala", url: "/prizes/icons/koala.png", provider: "lovable-ai" },
  { id: "ic_monkey", url: "/prizes/icons/monkey.png", provider: "lovable-ai" },
  { id: "ic_hamster", url: "/prizes/icons/hamster.png", provider: "lovable-ai" },
  { id: "ic_chick", url: "/prizes/icons/chick.png", provider: "lovable-ai" },
  { id: "ic_owl", url: "/prizes/icons/owl.png", provider: "lovable-ai" },
  { id: "ic_turtle", url: "/prizes/icons/turtle.png", provider: "lovable-ai" },
  { id: "ic_fish", url: "/prizes/icons/fish.png", provider: "lovable-ai" },
  { id: "ic_bee", url: "/prizes/icons/bee.png", provider: "lovable-ai" },
  { id: "ic_butterfly", url: "/prizes/icons/butterfly.png", provider: "lovable-ai" },
  { id: "ic_whale", url: "/prizes/icons/whale.png", provider: "lovable-ai" },
  { id: "ic_shark", url: "/prizes/icons/shark.png", provider: "lovable-ai" },
  { id: "ic_eagle", url: "/prizes/icons/eagle.png", provider: "lovable-ai" },
  { id: "ic_octopus", url: "/prizes/icons/octopus.png", provider: "lovable-ai" },
  { id: "ic_crab", url: "/prizes/icons/crab.png", provider: "lovable-ai" },
  { id: "ic_knight", url: "/prizes/icons/knight.png", provider: "lovable-ai" },
  { id: "ic_wand", url: "/prizes/icons/wand.png", provider: "lovable-ai" },
  { id: "ic_ufo", url: "/prizes/icons/ufo.png", provider: "lovable-ai" },
  { id: "ic_comet", url: "/prizes/icons/comet.png", provider: "lovable-ai" },
  { id: "ic_starhero", url: "/prizes/icons/starhero.png", provider: "lovable-ai" },
  { id: "ic_galaxywhale", url: "/prizes/icons/galaxywhale.png", provider: "lovable-ai" },
  { id: "ic_golddragon", url: "/prizes/icons/golddragon.png", provider: "lovable-ai" },
  { id: "ic_blackstar", url: "/prizes/icons/blackstar.png", provider: "lovable-ai" },
  { id: "ic_hedgehog", url: "/prizes/icons/hedgehog.png", provider: "lovable-ai" },
  { id: "ic_wolf", url: "/prizes/icons/wolf.png", provider: "lovable-ai" },
  { id: "ic_lion", url: "/prizes/icons/lion.png", provider: "lovable-ai" },
  { id: "ic_elephant", url: "/prizes/icons/elephant.png", provider: "lovable-ai" },
  { id: "ic_giraffe", url: "/prizes/icons/giraffe.png", provider: "lovable-ai" },
  { id: "ic_kangaroo", url: "/prizes/icons/kangaroo.png", provider: "lovable-ai" },
  { id: "ic_peacock", url: "/prizes/icons/peacock.png", provider: "lovable-ai" },
  { id: "ic_astronaut", url: "/prizes/icons/astronaut.png", provider: "lovable-ai" },
  { id: "ic_ninja", url: "/prizes/icons/ninja.png", provider: "lovable-ai" },
  // フレーム（AI画像生成 / PNG透過）
  { id: "fr_gold", url: "/prizes/frames/gold.png", provider: "lovable-ai" },
  { id: "fr_black", url: "/prizes/frames/black.png", provider: "lovable-ai" },
  { id: "fr_prism", url: "/prizes/frames/prism.png", provider: "lovable-ai" },
  { id: "fr_neon", url: "/prizes/frames/neon.png", provider: "lovable-ai" },
  // 背景（AI画像生成 / JPG）
  { id: "bg_gold", url: "/prizes/bg/gold.jpg", provider: "lovable-ai" },
  { id: "bg_black", url: "/prizes/bg/black.jpg", provider: "lovable-ai" },
  { id: "bg_crystal", url: "/prizes/bg/crystal.jpg", provider: "lovable-ai" },
  { id: "bg_dragonlair", url: "/prizes/bg/dragonlair.jpg", provider: "lovable-ai" },
  // 効果音（ElevenLabs 効果音生成 / MP3）
  { id: "sd_pico", url: "/prizes/sounds/pico.mp3", provider: "elevenlabs" },
  { id: "sd_pon", url: "/prizes/sounds/pon.mp3", provider: "elevenlabs" },
  { id: "sd_kira", url: "/prizes/sounds/kira.mp3", provider: "elevenlabs" },
  { id: "sd_chime", url: "/prizes/sounds/chime.mp3", provider: "elevenlabs" },
  { id: "sd_coin", url: "/prizes/sounds/coin.mp3", provider: "elevenlabs" },
  { id: "sd_sparkle", url: "/prizes/sounds/sparkle.mp3", provider: "elevenlabs" },
  { id: "sd_levelup", url: "/prizes/sounds/levelup.mp3", provider: "elevenlabs" },
  { id: "sd_fanfare", url: "/prizes/sounds/fanfare.mp3", provider: "elevenlabs" },
  { id: "sd_gold", url: "/prizes/sounds/gold.mp3", provider: "elevenlabs" },
  { id: "sd_black", url: "/prizes/sounds/black.mp3", provider: "elevenlabs" },
  // 読み取りエフェクト（KLIPY のアニメ素材。保存せず配信URLをそのまま表示する）
  {
    id: "ef_stars",
    url: "https://static.klipy.com/ii/c98c4a4935d23b95805f0befee091d8a/d3/a6/gLOdk4fv.gif",
    provider: "klipy",
  },
  {
    id: "ef_bubble",
    url: "https://static.klipy.com/ii/a5166a66b33e26d783bf95ac62ea3cdb/4f/fe/wfDKG8JB.gif",
    provider: "klipy",
  },
  {
    id: "ef_glitter",
    url: "https://static.klipy.com/ii/c98c4a4935d23b95805f0befee091d8a/d5/84/JAqu2L8b.gif",
    provider: "klipy",
  },
  {
    id: "ef_ring",
    url: "https://static.klipy.com/ii/c98c4a4935d23b95805f0befee091d8a/11/58/eY5etlLo.gif",
    provider: "klipy",
  },
  {
    id: "ef_coin",
    url: "https://static.klipy.com/ii/c98c4a4935d23b95805f0befee091d8a/70/cf/aB9r1qed.gif",
    provider: "klipy",
  },
  {
    id: "ef_confetti",
    url: "https://static.klipy.com/ii/c98c4a4935d23b95805f0befee091d8a/bf/a3/Lr5yHhPq.gif",
    provider: "klipy",
  },
  {
    id: "ef_starfall",
    url: "https://static.klipy.com/ii/c98c4a4935d23b95805f0befee091d8a/10/8a/Hs1j9E7Y.gif",
    provider: "klipy",
  },
  {
    id: "ef_gold",
    url: "https://static.klipy.com/ii/4bbcf901ea0d5dec489bd8c608d7f1fd/8a/e9/ysRbo5x5T8f5qZ.gif",
    provider: "klipy",
  },
  {
    id: "ef_black",
    url: "https://static.klipy.com/ii/40e5f3c9157feea5d28a6b4ad3880d85/9e/d7/f7hlhIFw.gif",
    provider: "klipy",
  },
];

/** 実素材のわりあて（id・レアリティ等は変えない） */
for (const a of REAL_ASSETS) {
  const at = COLL_ITEMS.findIndex((i) => i.id === a.id);
  if (at < 0) continue;
  const base = COLL_ITEMS[at]!;
  const provider = a.provider ? { provider: a.provider } : {};
  switch (base.category) {
    case "background":
      COLL_ITEMS[at] = {
        ...base,
        ...provider,
        art: { ...base.art, css: layered(a.url, base.art["css"]) },
      };
      break;
    case "frame":
      COLL_ITEMS[at] = {
        ...base,
        ...provider,
        art: { ...base.art, ring: layered(a.url, base.art["ring"]) },
      };
      break;
    case "sound":
      COLL_ITEMS[at] = { ...base, ...provider, asset: a.url };
      break;
    case "icon":
    case "effect":
    default:
      COLL_ITEMS[at] = { ...base, ...provider, image: a.url, art: { ...base.art, image: a.url } };
      break;
  }
}

export const COLL_ITEM_BY_ID: Record<string, CollItem> = Object.fromEntries(
  COLL_ITEMS.map((i) => [i.id, i]),
);

/** その景品の素材の出どころ（KLIPY などの表示に使う） */
export const itemProvider = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.provider ?? null;

/** 実素材が入っている景品の数（カテゴリー別） */
export const REAL_ASSET_IDS = REAL_ASSETS.map((a) => a.id);

export const collItemsOf = (category: CollCategory) =>
  COLL_ITEMS.filter((i) => i.category === category).sort(
    (a, b) => (a.sort ?? 999) - (b.sort ?? 999),
  );

export const COLL_INITIAL_IDS = COLL_ITEMS.filter((i) => i.initial).map((i) => i.id);

export const COLL_CATEGORIES: CollCategory[] = ["background", "icon", "frame", "sound", "effect"];

/** 画面に出すときの見た目（背景CSS・フレームのふち色など） */
export const backgroundCss = (id?: string) =>
  COLL_ITEM_BY_ID[id ?? ""]?.art["css"] ?? COLL_ITEM_BY_ID["bg_simple"]!.art["css"]!;

export const frameRing = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["ring"] ?? null;

export const iconEmoji = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["emoji"] ?? null;

/** 画像素材（あれば絵文字より優先してつかう） */
export const iconImage = (id?: string) =>
  COLL_ITEM_BY_ID[id ?? ""]?.image ?? COLL_ITEM_BY_ID[id ?? ""]?.art["image"] ?? null;

/** アイテムのレアリティ段階（演出の豪華さに使う） */
export const itemTier = (id?: string) => RARITY_TIER[COLL_ITEM_BY_ID[id ?? ""]?.rarity ?? "N"];

/** 演出キー（fx / tune）からレアリティ段階を引く */
export const tierOfArt = (key: "fx" | "tune", value?: string | null) => {
  if (!value) return 1 as const;
  const item = COLL_ITEMS.find((i) => i.art[key] === value);
  return RARITY_TIER[item?.rarity ?? "N"];
};

export const soundTune = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["tune"] ?? null;

export const effectFx = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.art["fx"] ?? null;

/** 効果音の音声ファイル（未設定なら内蔵の音をつかう） */
export const soundAsset = (id?: string) => COLL_ITEM_BY_ID[id ?? ""]?.asset ?? null;

/** エフェクトの画像素材（先生が登録したPNGなど。なければ内蔵の演出） */
export const effectImage = (id?: string) =>
  COLL_ITEM_BY_ID[id ?? ""]?.image ?? COLL_ITEM_BY_ID[id ?? ""]?.art["image"] ?? null;

/** 演出キー（tune）から音ファイルをひく。なければ内蔵音にもどる */
export const tuneAsset = (tune?: string | null) =>
  (tune ? COLL_ITEMS.find((i) => i.art["tune"] === tune)?.asset : null) ?? null;

/** 演出キー（fx）からアニメ素材をひく。なければ内蔵のアニメにもどる */
export const fxImage = (fx?: string | null) =>
  fx ? (COLL_ITEMS.find((i) => i.art["fx"] === fx)?.image ?? null) : null;

/* ============================================================
 * 先生が管理画面から登録した景品を、上のマスターに合流させる仕組み。
 * サーバー・画面のどちらからも同じ関数で登録する（idが同じなら上書き）。
 * ============================================================ */

export type CustomPrizeLike = {
  id: string;
  name: string;
  category: CollCategory;
  rarity: CollRarity;
  assetUrl: string;
  thumbUrl?: string | null;
  description: string;
  obtainable: boolean;
  sort: number;
};

function toCollItem(p: CustomPrizeLike): CollItem {
  const base = {
    id: p.id,
    name: p.name,
    category: p.category,
    rarity: p.rarity,
    description: p.description || p.name,
    obtainable: p.obtainable,
    sort: p.sort,
    ...(p.thumbUrl ? { thumb: p.thumbUrl } : {}),
  };
  switch (p.category) {
    case "background":
      return { ...base, art: { css: `url("${p.assetUrl}") center / cover no-repeat` } };
    case "icon":
      return { ...base, image: p.assetUrl, art: { emoji: "🎁", image: p.assetUrl } };
    case "frame":
      return { ...base, art: { ring: `url("${p.assetUrl}") center / cover no-repeat` } };
    case "sound":
      return { ...base, asset: p.assetUrl, art: { tune: "kira" } };
    case "effect":
    default:
      return { ...base, image: p.assetUrl, art: { fx: "glitter", image: p.assetUrl } };
  }
}

/** これまでに登録した「先生が追加した景品」のid（消されたときに取りのぞくため） */
const customIds = new Set<string>();

/**
 * 先生が登録した景品をマスターに反映する（何度呼んでも安全）。
 * 渡された一覧にない「先生が追加した景品」はマスターから取りのぞく（削除に追従する）。
 * もともと内蔵のアイテムには一切さわらない。
 */
export function registerCustomItems(list: CustomPrizeLike[]) {
  const alive = new Set<string>();
  for (const p of list) {
    if (!p?.id || !p.assetUrl) continue;
    const item = toCollItem(p);
    alive.add(item.id);
    customIds.add(item.id);
    const at = COLL_ITEMS.findIndex((i) => i.id === item.id);
    if (at >= 0) COLL_ITEMS[at] = item;
    else COLL_ITEMS.push(item);
    COLL_ITEM_BY_ID[item.id] = item;
  }
  for (const id of [...customIds]) {
    if (alive.has(id)) continue;
    const at = COLL_ITEMS.findIndex((i) => i.id === id);
    if (at >= 0) COLL_ITEMS.splice(at, 1);
    delete COLL_ITEM_BY_ID[id];
    customIds.delete(id);
  }
}

/** 一覧用のサムネイル（未設定なら本体の画像をつかう） */
export const itemThumb = (id?: string) =>
  COLL_ITEM_BY_ID[id ?? ""]?.thumb ?? COLL_ITEM_BY_ID[id ?? ""]?.image ?? null;

/* ============================================================
 * 内蔵景品（154種類）の「素材だけ」を差し替える仕組み。
 * id・名前・カテゴリー・レアリティ・排出設定は変えず、見た目／音だけを上書きする。
 * 差し替えをやめたら、もとの内蔵の見た目にもどる。
 * ============================================================ */

export type PrizeOverrideLike = {
  prizeId: string;
  assetUrl: string;
  thumbUrl?: string | null;
};

/** 差し替え前のすがた（もどすときに使う） */
const originalItems = new Map<string, CollItem>();
const overriddenIds = new Set<string>();

function withAsset(base: CollItem, assetUrl: string, thumbUrl?: string | null): CollItem {
  const thumb = thumbUrl ? { thumb: thumbUrl } : {};
  switch (base.category) {
    case "background":
      return {
        ...base,
        ...thumb,
        art: { ...base.art, css: `url("${assetUrl}") center / cover no-repeat` },
      };
    case "icon":
      return { ...base, ...thumb, image: assetUrl, art: { ...base.art, image: assetUrl } };
    case "frame":
      return {
        ...base,
        ...thumb,
        art: { ...base.art, ring: `url("${assetUrl}") center / cover no-repeat` },
      };
    case "sound":
      return { ...base, ...thumb, asset: assetUrl };
    case "effect":
    default:
      return { ...base, ...thumb, image: assetUrl, art: { ...base.art, image: assetUrl } };
  }
}

/**
 * 素材の差し替えを反映する（何度呼んでも安全）。
 * 一覧にない差し替えはもとにもどす。先生が追加した景品（cx_）には手を出さない。
 */
export function applyAssetOverrides(list: PrizeOverrideLike[]) {
  const alive = new Set<string>();
  for (const o of list) {
    if (!o?.prizeId || !o.assetUrl) continue;
    const base = originalItems.get(o.prizeId) ?? COLL_ITEM_BY_ID[o.prizeId];
    if (!base) continue;
    if (!originalItems.has(o.prizeId)) originalItems.set(o.prizeId, base);
    const next = withAsset(base, o.assetUrl, o.thumbUrl ?? null);
    const at = COLL_ITEMS.findIndex((i) => i.id === o.prizeId);
    if (at >= 0) COLL_ITEMS[at] = next;
    COLL_ITEM_BY_ID[o.prizeId] = next;
    overriddenIds.add(o.prizeId);
    alive.add(o.prizeId);
  }
  for (const id of [...overriddenIds]) {
    if (alive.has(id)) continue;
    const base = originalItems.get(id);
    overriddenIds.delete(id);
    if (!base) continue;
    const at = COLL_ITEMS.findIndex((i) => i.id === id);
    if (at >= 0) COLL_ITEMS[at] = base;
    COLL_ITEM_BY_ID[id] = base;
  }
}

/** その景品が先生の素材に差し替え済みかどうか */
export const isOverridden = (id: string) => overriddenIds.has(id);
