/**
 * ゲーム要素（アバター・ペット・マイルーム）のアイテムマスター。
 * 既存の宿題・ポイント機能とは独立しており、ここにデータを足すだけでアイテムを増やせる。
 */

export type Rarity = "N" | "R" | "SR" | "SSR";
export type Style =
  | "cute"
  | "cool"
  | "fashion"
  | "funny"
  | "sporty"
  | "school"
  | "seasonal"
  | "event";

export type Category =
  | "face"
  | "hair"
  | "hairColor"
  | "skin"
  | "tops"
  | "bottoms"
  | "shoes"
  | "hat"
  | "glasses"
  | "mask"
  | "accessory"
  | "hold"
  | "pet"
  | "petItem"
  | "wallpaper"
  | "floor"
  | "furniture";

export type Item = {
  id: string;
  name: string;
  category: Category;
  subcategory?: string;
  rarity: Rarity;
  style: Style;
  isInitial: boolean;
  isGacha: boolean;
  season?: "spring" | "summer" | "autumn" | "winter";
  event?: "halloween" | "christmas" | "newyear" | "setsubun" | "tanabata";
  available: boolean;
  description: string;
  sortOrder: number;
  /** 見た目のパラメータ（SVGを描くときに使う） */
  art: Record<string, string>;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  face: "かお",
  hair: "かみがた",
  hairColor: "かみのいろ",
  skin: "はだのいろ",
  tops: "トップス",
  bottoms: "ボトムス",
  shoes: "くつ",
  hat: "ぼうし",
  glasses: "メガネ",
  mask: "マスク",
  accessory: "アクセサリー",
  hold: "もちもの",
  pet: "ペット",
  petItem: "ペットのアイテム",
  wallpaper: "かべがみ",
  floor: "ゆか",
  furniture: "かぐ",
};

export const RARITY_META: Record<Rarity, { label: string; tone: string; ring: string; weight: number }> = {
  N: { label: "N", tone: "bg-slate-200 text-slate-700", ring: "ring-slate-300", weight: 60 },
  R: { label: "R", tone: "bg-sky-200 text-sky-900", ring: "ring-sky-400", weight: 28 },
  SR: { label: "SR", tone: "bg-violet-200 text-violet-900", ring: "ring-violet-400", weight: 10 },
  SSR: { label: "SSR", tone: "bg-amber-200 text-amber-900", ring: "ring-amber-400", weight: 2 },
};

export const STYLE_LABEL: Record<Style, string> = {
  cute: "かわいい",
  cool: "かっこいい",
  fashion: "おしゃれ",
  funny: "おもしろい",
  sporty: "スポーティー",
  school: "学校生活",
  seasonal: "きせつ",
  event: "イベント",
};

let order = 0;
const it = (v: Omit<Item, "sortOrder" | "available"> & { available?: boolean }): Item => ({
  ...v,
  available: v.available ?? true,
  sortOrder: order++,
});

/* ---------------- かお ---------------- */

const FACES: [string, string, string, string][] = [
  // id, 名前, 目, 口
  ["genki", "げんき", "round", "grin"],
  ["yasashii", "やさしい", "happy", "smile"],
  ["akarui", "あかるい", "sparkle", "open"],
  ["cool", "クール", "cool", "flat"],
  ["omoshiro", "おもしろい", "wink", "grin"],
  ["kawaii", "かわいい", "big", "cat"],
  ["simple", "シンプル", "dot", "small"],
  ["nikoniko", "にこにこ", "happy", "grin"],
  ["kirakira", "きらきら", "star", "smile"],
  ["nemui", "ねむい", "sleepy", "small"],
  ["odoroki", "びっくり", "big", "open"],
  ["tanken", "たんけん", "cool", "smile"],
];

/* ---------------- かみがた ---------------- */

const HAIRS: [string, string][] = [
  ["short", "ショート"],
  ["veryshort", "ベリーショート"],
  ["bangs", "前髪ありショート"],
  ["nobangs", "前髪なしショート"],
  ["bob", "ボブ"],
  ["medium", "ミディアム"],
  ["long", "ロング"],
  ["straight", "ストレートロング"],
  ["fluffy", "ふんわりロング"],
  ["ponytail", "ポニーテール"],
  ["twin", "ツインテール"],
  ["bun", "おだんご"],
  ["curly", "くせ毛風"],
  ["sporty", "スポーティー"],
  ["spiky", "クール系"],
  ["unique", "こせいてき"],
];

const HAIR_COLORS: [string, string, string][] = [
  ["black", "黒", "#1f2430"],
  ["darkbrown", "こげ茶", "#3b2418"],
  ["brown", "茶色", "#6b4226"],
  ["lightbrown", "明るい茶色", "#a3703f"],
];
const HAIR_COLORS_GACHA: [string, string, string][] = [
  ["silver", "シルバー", "#c9ced8"],
  ["skyblue", "スカイブルー", "#6ec7ef"],
  ["pink", "ピンク", "#f49bc1"],
  ["mint", "ミント", "#7fd6b5"],
];

const SKINS: [string, string, string][] = [
  ["s1", "はだいろ1", "#f7d9c4"],
  ["s2", "はだいろ2", "#efc39c"],
  ["s3", "はだいろ3", "#d79a72"],
  ["s4", "はだいろ4", "#b1734b"],
  ["s5", "はだいろ5", "#84523a"],
];

const TEE_COLORS: [string, string, string][] = [
  ["red", "赤", "#ef4444"],
  ["blue", "青", "#3b82f6"],
  ["green", "緑", "#22c55e"],
  ["yellow", "黄色", "#facc15"],
  ["orange", "オレンジ", "#fb923c"],
  ["pink", "ピンク", "#f472b6"],
  ["purple", "むらさき", "#a78bfa"],
  ["skyblue", "水色", "#38bdf8"],
  ["white", "白", "#f8fafc"],
  ["black", "黒", "#334155"],
];

/* ---------------- アイテム一覧 ---------------- */

export const ITEMS: Item[] = [
  ...FACES.map(([id, name, eye, mouth]) =>
    it({
      id: `face_${id}`,
      name,
      category: "face",
      rarity: "N",
      style: "cute",
      isInitial: true,
      isGacha: false,
      description: `${name}なかおつき`,
      art: { eye, mouth },
    }),
  ),
  ...HAIRS.map(([id, name]) =>
    it({
      id: `hair_${id}`,
      name,
      category: "hair",
      rarity: "N",
      style: "fashion",
      isInitial: true,
      isGacha: false,
      description: `${name}のかみがた`,
      art: { shape: id },
    }),
  ),
  ...HAIR_COLORS.map(([id, name, color]) =>
    it({
      id: `hc_${id}`,
      name,
      category: "hairColor",
      rarity: "N",
      style: "fashion",
      isInitial: true,
      isGacha: false,
      description: `かみのいろ：${name}`,
      art: { color },
    }),
  ),
  ...HAIR_COLORS_GACHA.map(([id, name, color]) =>
    it({
      id: `hc_${id}`,
      name,
      category: "hairColor",
      rarity: "SR",
      style: "fashion",
      isInitial: false,
      isGacha: true,
      description: `とくべつなかみのいろ：${name}`,
      art: { color },
    }),
  ),
  ...SKINS.map(([id, name, color]) =>
    it({
      id: `skin_${id}`,
      name,
      category: "skin",
      rarity: "N",
      style: "cute",
      isInitial: true,
      isGacha: false,
      description: name,
      art: { color },
    }),
  ),

  /* 初期トップス：無地の色Tシャツ */
  ...TEE_COLORS.map(([id, name, color]) =>
    it({
      id: `tops_tee_${id}`,
      name: `${name}のTシャツ`,
      category: "tops",
      subcategory: "tee",
      rarity: "N",
      style: "school",
      isInitial: true,
      isGacha: false,
      description: "むじの色Tシャツ",
      art: { color, shape: "tee" },
    }),
  ),

  /* 初期ボトムス・くつ・メガネ・マスク・ぼうし */
  it({ id: "bottoms_pants", name: "ズボン", category: "bottoms", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "きほんのズボン", art: { color: "#475569", shape: "pants" } }),
  it({ id: "bottoms_skirt", name: "スカート", category: "bottoms", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "きほんのスカート", art: { color: "#475569", shape: "skirt" } }),
  it({ id: "shoes_basic", name: "きほんのくつ", category: "shoes", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "はきやすいくつ", art: { color: "#e2e8f0", shape: "shoe" } }),
  it({ id: "glasses_basic", name: "メガネ", category: "glasses", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "きほんのメガネ", art: { color: "#1f2937", shape: "glasses" } }),
  it({ id: "mask_basic", name: "マスク", category: "mask", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "きほんのマスク", art: { color: "#f8fafc", shape: "mask" } }),
  it({ id: "hat_green", name: "みどりのぼうし", category: "hat", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "はじめからもっているぼうし", art: { color: "#16a34a", shape: "cap" } }),

  /* ---- ガチャ：トップス ---- */
  it({ id: "tops_hoodie_blue", name: "青いパーカー", category: "tops", rarity: "N", style: "cool", isInitial: false, isGacha: true, description: "フードつきのパーカー", art: { color: "#2563eb", shape: "hoodie" } }),
  it({ id: "tops_hoodie_pink", name: "ピンクのパーカー", category: "tops", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "やわらかい色のパーカー", art: { color: "#f472b6", shape: "hoodie" } }),
  it({ id: "tops_polo", name: "ポロシャツ", category: "tops", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "えりつきのシャツ", art: { color: "#f8fafc", shape: "polo" } }),
  it({ id: "tops_sweat", name: "トレーナー", category: "tops", rarity: "N", style: "fashion", isInitial: false, isGacha: true, description: "あったかいトレーナー", art: { color: "#f59e0b", shape: "sweat" } }),
  it({ id: "tops_knit", name: "セーター", category: "tops", rarity: "R", style: "fashion", isInitial: false, isGacha: true, season: "winter", description: "もこもこのセーター", art: { color: "#c084fc", shape: "knit" } }),
  it({ id: "tops_cardigan", name: "カーディガン", category: "tops", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "はおれるカーディガン", art: { color: "#fbcfe8", shape: "cardigan" } }),
  it({ id: "tops_shirt", name: "シャツ", category: "tops", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "きちんとシャツ", art: { color: "#e0f2fe", shape: "shirt" } }),
  it({ id: "tops_jersey", name: "ジャージ", category: "tops", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "うごきやすいジャージ", art: { color: "#0ea5e9", shape: "jersey" } }),
  it({ id: "tops_sportswear", name: "スポーツウェア", category: "tops", rarity: "R", style: "sporty", isInitial: false, isGacha: true, description: "はしるのが楽しくなる", art: { color: "#10b981", shape: "sport" } }),
  it({ id: "tops_denim", name: "デニムジャケット", category: "tops", rarity: "R", style: "cool", isInitial: false, isGacha: true, description: "かっこいいデニム", art: { color: "#3b6ea5", shape: "denim" } }),
  it({ id: "tops_raincoat", name: "レインコート", category: "tops", rarity: "R", style: "seasonal", isInitial: false, isGacha: true, season: "summer", description: "雨の日にぴったり", art: { color: "#facc15", shape: "coat" } }),
  it({ id: "tops_ribbon", name: "リボンつきトップス", category: "tops", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "リボンがかわいい", art: { color: "#fda4af", shape: "tee", deco: "ribbon" } }),
  it({ id: "tops_frill", name: "フリルつきトップス", category: "tops", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "ふわふわフリル", art: { color: "#fbcfe8", shape: "tee", deco: "frill" } }),
  it({ id: "tops_heart", name: "ハート柄トップス", category: "tops", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ハートがいっぱい", art: { color: "#fb7185", shape: "tee", deco: "heart" } }),
  it({ id: "tops_flower", name: "花柄トップス", category: "tops", rarity: "N", style: "cute", isInitial: false, isGacha: true, season: "spring", description: "お花がさいている", art: { color: "#f9a8d4", shape: "tee", deco: "flower" } }),
  it({ id: "tops_animal", name: "どうぶつ柄トップス", category: "tops", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "どうぶつがいっぱい", art: { color: "#fde68a", shape: "tee", deco: "paw" } }),
  it({ id: "tops_dino", name: "きょうりゅうTシャツ", category: "tops", rarity: "R", style: "funny", isInitial: false, isGacha: true, description: "きょうりゅうがガオー", art: { color: "#34d399", shape: "tee", deco: "dino" } }),
  it({ id: "tops_frog", name: "カエルTシャツ", category: "tops", rarity: "N", style: "funny", isInitial: false, isGacha: true, description: "カエルがぴょん", art: { color: "#a3e635", shape: "tee", deco: "frog" } }),
  it({ id: "tops_cat", name: "ねこ柄Tシャツ", category: "tops", rarity: "N", style: "funny", isInitial: false, isGacha: true, description: "ねこがごろごろ", art: { color: "#fcd34d", shape: "tee", deco: "cat" } }),
  it({ id: "tops_space", name: "うちゅう柄Tシャツ", category: "tops", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "星とロケット", art: { color: "#1e293b", shape: "tee", deco: "star" } }),
  it({ id: "tops_food", name: "たべもの柄Tシャツ", category: "tops", rarity: "N", style: "funny", isInitial: false, isGacha: true, description: "おいしそうな柄", art: { color: "#fdba74", shape: "tee", deco: "food" } }),
  it({ id: "tops_street", name: "ストリート風パーカー", category: "tops", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "まちで目立つ", art: { color: "#111827", shape: "hoodie", deco: "star" } }),
  it({ id: "tops_gym", name: "体そう服", category: "tops", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "体いくの時間に", art: { color: "#ffffff", shape: "tee", deco: "line" } }),

  /* ---- ガチャ：ボトムス ---- */
  it({ id: "bottoms_short", name: "短パン", category: "bottoms", rarity: "N", style: "sporty", isInitial: false, isGacha: true, season: "summer", description: "すずしい短パン", art: { color: "#0ea5e9", shape: "shorts" } }),
  it({ id: "bottoms_half", name: "ハーフパンツ", category: "bottoms", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "うごきやすい", art: { color: "#475569", shape: "shorts" } }),
  it({ id: "bottoms_jeans", name: "ジーンズ", category: "bottoms", rarity: "N", style: "cool", isInitial: false, isGacha: true, description: "デニムのズボン", art: { color: "#3b6ea5", shape: "pants" } }),
  it({ id: "bottoms_cargo", name: "カーゴパンツ", category: "bottoms", rarity: "R", style: "cool", isInitial: false, isGacha: true, description: "ポケットいっぱい", art: { color: "#6b7280", shape: "pants", deco: "pocket" } }),
  it({ id: "bottoms_sweatpants", name: "スウェットパンツ", category: "bottoms", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "らくちん", art: { color: "#94a3b8", shape: "pants" } }),
  it({ id: "bottoms_sportpants", name: "スポーツパンツ", category: "bottoms", rarity: "R", style: "sporty", isInitial: false, isGacha: true, description: "はやく走れそう", art: { color: "#1d4ed8", shape: "pants", deco: "line" } }),
  it({ id: "bottoms_pleats", name: "プリーツスカート", category: "bottoms", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "ひだのスカート", art: { color: "#60a5fa", shape: "skirt", deco: "pleat" } }),
  it({ id: "bottoms_check", name: "チェック柄スカート", category: "bottoms", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "チェックがおしゃれ", art: { color: "#f87171", shape: "skirt", deco: "check" } }),
  it({ id: "bottoms_ribbonskirt", name: "リボンつきスカート", category: "bottoms", rarity: "SR", style: "cute", isInitial: false, isGacha: true, description: "リボンがゆれる", art: { color: "#f9a8d4", shape: "skirt", deco: "ribbon" } }),
  it({ id: "bottoms_wide", name: "ワイドパンツ", category: "bottoms", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "ゆったりズボン", art: { color: "#a16207", shape: "pants", deco: "wide" } }),

  /* ---- ガチャ：くつ ---- */
  it({ id: "shoes_sneaker", name: "スニーカー", category: "shoes", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "はしりやすい", art: { color: "#ffffff", shape: "shoe" } }),
  it({ id: "shoes_color", name: "カラースニーカー", category: "shoes", rarity: "N", style: "fashion", isInitial: false, isGacha: true, description: "あざやかな色", art: { color: "#f97316", shape: "shoe" } }),
  it({ id: "shoes_sport", name: "スポーツシューズ", category: "shoes", rarity: "R", style: "sporty", isInitial: false, isGacha: true, description: "体いくにぴったり", art: { color: "#2563eb", shape: "shoe", deco: "line" } }),
  it({ id: "shoes_uwabaki", name: "上ばき風シューズ", category: "shoes", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "学校のくつ", art: { color: "#f1f5f9", shape: "shoe", deco: "line" } }),
  it({ id: "shoes_sandal", name: "サンダル", category: "shoes", rarity: "N", style: "seasonal", isInitial: false, isGacha: true, season: "summer", description: "なつのサンダル", art: { color: "#38bdf8", shape: "sandal" } }),
  it({ id: "shoes_boots_rain", name: "長ぐつ", category: "shoes", rarity: "R", style: "seasonal", isInitial: false, isGacha: true, description: "雨の日も平気", art: { color: "#facc15", shape: "boots" } }),
  it({ id: "shoes_boots", name: "ブーツ", category: "shoes", rarity: "R", style: "cool", isInitial: false, isGacha: true, season: "winter", description: "あったかブーツ", art: { color: "#78350f", shape: "boots" } }),
  it({ id: "shoes_star", name: "きらきらスニーカー", category: "shoes", rarity: "SR", style: "cute", isInitial: false, isGacha: true, description: "星がひかる", art: { color: "#c084fc", shape: "shoe", deco: "star" } }),

  /* ---- ガチャ：ぼうし・あたま ---- */
  it({ id: "hat_cap", name: "キャップ", category: "hat", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "スポーティーなぼうし", art: { color: "#1d4ed8", shape: "cap" } }),
  it({ id: "hat_knit", name: "ニット帽", category: "hat", rarity: "N", style: "seasonal", isInitial: false, isGacha: true, season: "winter", description: "ふゆのぼうし", art: { color: "#ef4444", shape: "knit" } }),
  it({ id: "hat_straw", name: "麦わら帽子", category: "hat", rarity: "R", style: "seasonal", isInitial: false, isGacha: true, season: "summer", description: "なつのぼうし", art: { color: "#fbbf24", shape: "straw" } }),
  it({ id: "hat_bucket", name: "バケットハット", category: "hat", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "まるいハット", art: { color: "#60a5fa", shape: "bucket" } }),
  it({ id: "hat_beret", name: "ベレー帽", category: "hat", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "おしゃれなベレー", art: { color: "#f472b6", shape: "beret" } }),
  it({ id: "hat_ribbon", name: "リボン", category: "hat", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "あたまにリボン", art: { color: "#fb7185", shape: "ribbon" } }),
  it({ id: "hat_band", name: "カチューシャ", category: "hat", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "かわいいカチューシャ", art: { color: "#f9a8d4", shape: "band" } }),
  it({ id: "hat_crown", name: "王かん", category: "hat", rarity: "SSR", style: "cool", isInitial: false, isGacha: true, description: "とくべつな王かん", art: { color: "#fbbf24", shape: "crown" } }),
  it({ id: "hat_cat", name: "ねこ耳", category: "hat", rarity: "SR", style: "cute", isInitial: false, isGacha: true, description: "ねこになれる", art: { color: "#f8b4c8", shape: "cat" } }),
  it({ id: "hat_rabbit", name: "うさぎ耳", category: "hat", rarity: "SR", style: "cute", isInitial: false, isGacha: true, description: "うさぎになれる", art: { color: "#fde68a", shape: "rabbit" } }),
  it({ id: "hat_dino", name: "きょうりゅう帽", category: "hat", rarity: "SR", style: "funny", isInitial: false, isGacha: true, description: "せなかにトゲトゲ", art: { color: "#22c55e", shape: "dino" } }),
  it({ id: "hat_headphone", name: "ヘッドホン", category: "hat", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "おんがくをきこう", art: { color: "#0f172a", shape: "headphone" } }),
  it({ id: "hat_redwhite", name: "赤白ぼうし", category: "hat", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "体いくの赤白ぼうし", art: { color: "#ef4444", shape: "cap" } }),
  it({ id: "hat_santa", name: "サンタぼうし", category: "hat", rarity: "SR", style: "event", isInitial: false, isGacha: true, event: "christmas", description: "クリスマスげんてい", art: { color: "#dc2626", shape: "santa" } }),
  it({ id: "hat_oni", name: "おにのつの", category: "hat", rarity: "SR", style: "event", isInitial: false, isGacha: true, event: "setsubun", description: "せつぶんげんてい", art: { color: "#f59e0b", shape: "oni" } }),

  /* ---- ガチャ：メガネ・マスク ---- */
  it({ id: "glasses_sun", name: "サングラス", category: "glasses", rarity: "R", style: "cool", isInitial: false, isGacha: true, description: "クールなサングラス", art: { color: "#0f172a", shape: "sun" } }),
  it({ id: "glasses_round", name: "まるメガネ", category: "glasses", rarity: "N", style: "fashion", isInitial: false, isGacha: true, description: "まるいメガネ", art: { color: "#a16207", shape: "glasses" } }),
  it({ id: "glasses_star", name: "スターグラス", category: "glasses", rarity: "SR", style: "funny", isInitial: false, isGacha: true, description: "星のかたち", art: { color: "#f472b6", shape: "starglass" } }),
  it({ id: "mask_color", name: "カラーマスク", category: "mask", rarity: "N", style: "fashion", isInitial: false, isGacha: true, description: "色つきのマスク", art: { color: "#93c5fd", shape: "mask" } }),

  /* ---- ガチャ：アクセサリー・もちもの ---- */
  it({ id: "acc_scarf", name: "マフラー", category: "accessory", rarity: "R", style: "seasonal", isInitial: false, isGacha: true, season: "winter", description: "あったかマフラー", art: { color: "#ef4444", shape: "scarf" } }),
  it({ id: "acc_earmuff", name: "イヤーマフ", category: "accessory", rarity: "R", style: "cute", isInitial: false, isGacha: true, season: "winter", description: "みみがあったかい", art: { color: "#f9a8d4", shape: "earmuff" } }),
  it({ id: "acc_necklace", name: "ネックレス", category: "accessory", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "きらりとひかる", art: { color: "#fbbf24", shape: "necklace" } }),
  it({ id: "acc_watch", name: "うでどけい", category: "accessory", rarity: "R", style: "cool", isInitial: false, isGacha: true, description: "時間がわかる", art: { color: "#0ea5e9", shape: "watch" } }),
  it({ id: "acc_heart", name: "ハートアクセ", category: "accessory", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ハートのかざり", art: { color: "#fb7185", shape: "heart" } }),
  it({ id: "acc_star", name: "スターアクセ", category: "accessory", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "星のかざり", art: { color: "#facc15", shape: "star" } }),
  it({ id: "acc_flower", name: "花のアクセ", category: "accessory", rarity: "N", style: "seasonal", isInitial: false, isGacha: true, season: "spring", description: "さくらのかざり", art: { color: "#f9a8d4", shape: "flower" } }),
  it({ id: "hold_backpack", name: "リュック", category: "hold", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "せおえるリュック", art: { color: "#2563eb", shape: "bag" } }),
  it({ id: "hold_randoseru", name: "ランドセル", category: "hold", rarity: "R", style: "school", isInitial: false, isGacha: true, description: "学校のランドセル", art: { color: "#dc2626", shape: "bag" } }),
  it({ id: "hold_shoulder", name: "ショルダーバッグ", category: "hold", rarity: "N", style: "fashion", isInitial: false, isGacha: true, description: "かけられるバッグ", art: { color: "#a78bfa", shape: "bag" } }),
  it({ id: "hold_sportsbag", name: "スポーツバッグ", category: "hold", rarity: "R", style: "sporty", isInitial: false, isGacha: true, description: "しあいに行こう", art: { color: "#0f766e", shape: "bag" } }),
  it({ id: "hold_umbrella", name: "かさ", category: "hold", rarity: "N", style: "seasonal", isInitial: false, isGacha: true, description: "雨の日に", art: { color: "#38bdf8", shape: "umbrella" } }),
  it({ id: "hold_bottle", name: "水とう", category: "hold", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "水分ほきゅう", art: { color: "#f97316", shape: "bottle" } }),
  it({ id: "hold_plush", name: "ぬいぐるみ", category: "hold", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "だっこできる", art: { color: "#fbcfe8", shape: "plush" } }),
  it({ id: "hold_book", name: "本", category: "hold", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "よむのが楽しい", art: { color: "#16a34a", shape: "book" } }),
  it({ id: "hold_camera", name: "カメラ", category: "hold", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "しゃしんをとろう", art: { color: "#334155", shape: "camera" } }),
  it({ id: "hold_magnifier", name: "虫めがね", category: "hold", rarity: "R", style: "school", isInitial: false, isGacha: true, description: "たんけんにでかけよう", art: { color: "#a16207", shape: "magnifier" } }),
  it({ id: "hold_net", name: "虫とりあみ", category: "hold", rarity: "R", style: "seasonal", isInitial: false, isGacha: true, season: "summer", description: "なつのたんけん", art: { color: "#22c55e", shape: "net" } }),
  it({ id: "hold_uchiwa", name: "うちわ", category: "hold", rarity: "N", style: "seasonal", isInitial: false, isGacha: true, season: "summer", description: "すずしくなる", art: { color: "#38bdf8", shape: "fan" } }),
  it({ id: "hold_star_wish", name: "たんざく", category: "hold", rarity: "SR", style: "event", isInitial: false, isGacha: true, event: "tanabata", description: "たなばたげんてい", art: { color: "#a78bfa", shape: "book" } }),

  /* ---- ガチャ：コスチューム（トップス＋ボトムスのかわり） ---- */
  it({ id: "tops_dino_suit", name: "きょうりゅう着ぐるみ", category: "tops", rarity: "SSR", style: "funny", isInitial: false, isGacha: true, description: "ぜんしんきょうりゅう", art: { color: "#16a34a", shape: "suit", deco: "dino" } }),
  it({ id: "tops_space_suit", name: "うちゅう服", category: "tops", rarity: "SSR", style: "cool", isInitial: false, isGacha: true, description: "うちゅうへ出発", art: { color: "#e2e8f0", shape: "suit", deco: "star" } }),
  it({ id: "tops_magic", name: "まほうつかいセット", category: "tops", rarity: "SSR", style: "cute", isInitial: false, isGacha: true, description: "まほうがつかえそう", art: { color: "#7c3aed", shape: "suit", deco: "star" } }),
  it({ id: "tops_ninja", name: "にんじゃ風セット", category: "tops", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "しのびあし", art: { color: "#1f2937", shape: "suit" } }),
  it({ id: "tops_hero", name: "ヒーロー風セット", category: "tops", rarity: "SSR", style: "cool", isInitial: false, isGacha: true, description: "みんなをまもる", art: { color: "#dc2626", shape: "suit", deco: "star" } }),
  it({ id: "tops_pirate", name: "かいぞく風セット", category: "tops", rarity: "SR", style: "funny", isInitial: false, isGacha: true, description: "たからさがしへ", art: { color: "#7c2d12", shape: "suit" } }),
  it({ id: "tops_ghost", name: "おばけいしょう", category: "tops", rarity: "SR", style: "event", isInitial: false, isGacha: true, event: "halloween", description: "ハロウィンげんてい", art: { color: "#f8fafc", shape: "suit", deco: "ghost" } }),
  it({ id: "tops_robot", name: "ロボット風いしょう", category: "tops", rarity: "SSR", style: "funny", isInitial: false, isGacha: true, description: "ピコピコうごく", art: { color: "#64748b", shape: "suit", deco: "line" } }),
  it({ id: "tops_kimono", name: "お正月コーデ", category: "tops", rarity: "SR", style: "event", isInitial: false, isGacha: true, event: "newyear", description: "あけましておめでとう", art: { color: "#be123c", shape: "suit", deco: "flower" } }),
  it({ id: "tops_pajama", name: "パジャマセット", category: "tops", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "おやすみコーデ", art: { color: "#bfdbfe", shape: "suit", deco: "star" } }),
  it({ id: "tops_explorer", name: "たんけん家セット", category: "tops", rarity: "SR", style: "cool", isInitial: false, isGacha: true, season: "autumn", description: "ぼうけんへ出発", art: { color: "#ca8a04", shape: "suit" } }),
  it({ id: "tops_onepiece", name: "花がらワンピース", category: "tops", rarity: "R", style: "cute", isInitial: false, isGacha: true, season: "spring", description: "はるのワンピース", art: { color: "#fbcfe8", shape: "suit", deco: "flower" } }),
  it({ id: "tops_salopette", name: "サロペット", category: "tops", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "オーバーオール", art: { color: "#3b6ea5", shape: "suit" } }),

  /* ---- ペット ---- */
  it({ id: "pet_dog", name: "いぬ", category: "pet", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "げんきないぬ", art: { kind: "dog", color: "#d9a066" } }),
  it({ id: "pet_cat", name: "ねこ", category: "pet", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "きまぐれなねこ", art: { kind: "cat", color: "#94a3b8" } }),
  it({ id: "pet_rabbit", name: "うさぎ", category: "pet", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ぴょんぴょんうさぎ", art: { kind: "rabbit", color: "#f8fafc" } }),
  it({ id: "pet_bear", name: "くま", category: "pet", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "もふもふのくま", art: { kind: "bear", color: "#a16207" } }),
  it({ id: "pet_hamster", name: "ハムスター", category: "pet", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ちいさなともだち", art: { kind: "hamster", color: "#fcd34d" } }),
  it({ id: "pet_bird", name: "ことり", category: "pet", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "うたがじょうず", art: { kind: "bird", color: "#38bdf8" } }),
  it({ id: "pet_panda", name: "パンダ", category: "pet", rarity: "SR", style: "funny", isInitial: false, isGacha: true, description: "ごろごろパンダ", art: { kind: "panda", color: "#f8fafc" } }),
  it({ id: "pet_fox", name: "きつね", category: "pet", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "かしこいきつね", art: { kind: "fox", color: "#fb923c" } }),
  it({ id: "pet_penguin", name: "ペンギン", category: "pet", rarity: "SR", style: "funny", isInitial: false, isGacha: true, description: "よちよちあるく", art: { kind: "penguin", color: "#1e293b" } }),
  it({ id: "pet_dino", name: "きょうりゅう", category: "pet", rarity: "SSR", style: "cool", isInitial: false, isGacha: true, description: "オリジナルのきょうりゅう", art: { kind: "dino", color: "#22c55e" } }),

  /* ---- ペットのアイテム ---- */
  it({ id: "pi_hat", name: "ペットのぼうし", category: "petItem", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ちいさなぼうし", art: { slot: "hat", color: "#ef4444" } }),
  it({ id: "pi_cap", name: "ペットのキャップ", category: "petItem", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "スポーティー", art: { slot: "hat", color: "#2563eb" } }),
  it({ id: "pi_ribbon", name: "ペットのリボン", category: "petItem", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "あたまにリボン", art: { slot: "hat", color: "#f472b6" } }),
  it({ id: "pi_collar", name: "くびわ", category: "petItem", rarity: "N", style: "cool", isInitial: false, isGacha: true, description: "かっこいいくびわ", art: { slot: "collar", color: "#0f172a" } }),
  it({ id: "pi_collar_star", name: "星のくびわ", category: "petItem", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "星がひかる", art: { slot: "collar", color: "#facc15" } }),
  it({ id: "pi_cape", name: "ペットのマント", category: "petItem", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "ヒーローみたい", art: { slot: "body", color: "#dc2626" } }),
  it({ id: "pi_shirt", name: "ペットの服", category: "petItem", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "おしゃれな服", art: { slot: "body", color: "#38bdf8" } }),
  it({ id: "pi_glasses", name: "ペットのメガネ", category: "petItem", rarity: "R", style: "funny", isInitial: false, isGacha: true, description: "はかせみたい", art: { slot: "face", color: "#1f2937" } }),

  /* ---- マイルーム：かべがみ・ゆか ---- */
  it({ id: "wall_plain", name: "しろいかべ", category: "wallpaper", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "シンプルなかべ", art: { color: "#f1f5f9" } }),
  it({ id: "wall_sky", name: "そらのかべ", category: "wallpaper", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "青いそら", art: { color: "#bae6fd" } }),
  it({ id: "wall_pink", name: "ピンクのかべ", category: "wallpaper", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "やさしいピンク", art: { color: "#fbcfe8" } }),
  it({ id: "wall_star", name: "星もようのかべ", category: "wallpaper", rarity: "SR", style: "cool", isInitial: false, isGacha: true, description: "よぞらのかべ", art: { color: "#1e293b", deco: "star" } }),
  it({ id: "wall_forest", name: "みどりのかべ", category: "wallpaper", rarity: "R", style: "cool", isInitial: false, isGacha: true, description: "しぜんいっぱい", art: { color: "#bbf7d0" } }),
  it({ id: "wall_sports", name: "スポーツのかべ", category: "wallpaper", rarity: "R", style: "sporty", isInitial: false, isGacha: true, description: "うんどうがすき", art: { color: "#fed7aa", deco: "line" } }),
  it({ id: "floor_wood", name: "木のゆか", category: "floor", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "きほんのゆか", art: { color: "#d6b487" } }),
  it({ id: "floor_carpet", name: "カーペット", category: "floor", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ふかふか", art: { color: "#fda4af" } }),
  it({ id: "floor_tatami", name: "たたみ", category: "floor", rarity: "R", style: "school", isInitial: false, isGacha: true, description: "わしつ風", art: { color: "#bbf7d0" } }),
  it({ id: "floor_tile", name: "タイルのゆか", category: "floor", rarity: "R", style: "cool", isInitial: false, isGacha: true, description: "つるつる", art: { color: "#cbd5e1" } }),

  /* ---- マイルーム：かぐ ---- */
  it({ id: "fn_desk", name: "つくえ", category: "furniture", subcategory: "desk", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "べんきょうづくえ", art: { kind: "desk", color: "#b45309" } }),
  it({ id: "fn_chair", name: "イス", category: "furniture", subcategory: "chair", rarity: "N", style: "school", isInitial: true, isGacha: false, description: "すわれるイス", art: { kind: "chair", color: "#0ea5e9" } }),
  it({ id: "fn_bed", name: "ベッド", category: "furniture", subcategory: "bed", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ぐっすりねむれる", art: { kind: "bed", color: "#93c5fd" } }),
  it({ id: "fn_shelf", name: "たな", category: "furniture", subcategory: "shelf", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "ものをおける", art: { kind: "shelf", color: "#a16207" } }),
  it({ id: "fn_bookshelf", name: "本だな", category: "furniture", subcategory: "shelf", rarity: "R", style: "school", isInitial: false, isGacha: true, description: "本がいっぱい", art: { kind: "bookshelf", color: "#7c2d12" } }),
  it({ id: "fn_plush", name: "ぬいぐるみ", category: "furniture", subcategory: "deco", rarity: "R", style: "cute", isInitial: false, isGacha: true, description: "おへやのなかま", art: { kind: "plush", color: "#f9a8d4" } }),
  it({ id: "fn_plant", name: "しょくぶつ", category: "furniture", subcategory: "deco", rarity: "N", style: "cool", isInitial: false, isGacha: true, description: "みどりがきもちいい", art: { kind: "plant", color: "#22c55e" } }),
  it({ id: "fn_clock", name: "とけい", category: "furniture", subcategory: "wall", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "じかんがわかる", art: { kind: "clock", color: "#f8fafc" } }),
  it({ id: "fn_poster", name: "ポスター", category: "furniture", subcategory: "wall", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "かべのかざり", art: { kind: "poster", color: "#a78bfa" } }),
  it({ id: "fn_window", name: "まど", category: "furniture", subcategory: "wall", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "そとが見える", art: { kind: "window", color: "#bae6fd" } }),
  it({ id: "fn_light", name: "しょうめい", category: "furniture", subcategory: "wall", rarity: "R", style: "fashion", isInitial: false, isGacha: true, description: "おへやを明るく", art: { kind: "light", color: "#fde68a" } }),
  it({ id: "fn_rug", name: "ラグ", category: "furniture", subcategory: "floor", rarity: "N", style: "cute", isInitial: false, isGacha: true, description: "ゆかのかざり", art: { kind: "rug", color: "#fca5a5" } }),
  it({ id: "fn_box", name: "しゅうのう", category: "furniture", subcategory: "floor", rarity: "N", style: "school", isInitial: false, isGacha: true, description: "かたづけよう", art: { kind: "box", color: "#94a3b8" } }),
  it({ id: "fn_ball", name: "ボール", category: "furniture", subcategory: "deco", rarity: "N", style: "sporty", isInitial: false, isGacha: true, description: "スポーツがすき", art: { kind: "ball", color: "#f97316" } }),
  it({ id: "fn_tree_xmas", name: "クリスマスツリー", category: "furniture", subcategory: "deco", rarity: "SR", style: "event", isInitial: false, isGacha: true, event: "christmas", description: "クリスマスげんてい", art: { kind: "tree", color: "#16a34a" } }),
];

export const ITEM_BY_ID: Record<string, Item> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const itemsOf = (category: Category) => ITEMS.filter((i) => i.category === category);

/** はじめから使えるアイテム（初回アバター作成でつかう） */
export const INITIAL_ITEM_IDS = ITEMS.filter((i) => i.isInitial).map((i) => i.id);

/** アバターの「1カテゴリに1つだけ」装備するところ */
export const AVATAR_SLOTS: Category[] = [
  "face",
  "hair",
  "hairColor",
  "skin",
  "tops",
  "bottoms",
  "shoes",
  "hat",
  "glasses",
  "mask",
  "accessory",
  "hold",
];

export const ROOM_SLOTS: Category[] = ["wallpaper", "floor"];
export const MAX_FURNITURE = 6;
