/**
 * 正式アバター素材。
 * 添付された素材シートから背景を除去して切り出した画像だけを、
 * 256px グリッドのアトラスとして登録している。
 */
export const OFFICIAL_AVATAR_ATLAS =
  "/__l5e/assets-v1/5e259949-a157-47cb-b6b3-cef55db7484d/avatar-official-atlas.png";

export const OFFICIAL_ATLAS_COLUMNS = 8;
export const OFFICIAL_ATLAS_ROWS = 9;

export const OFFICIAL_SPRITES = {
  "acc-backpack": 0,
  "acc-glasses": 1,
  "bottom-cargo": 2,
  "bottom-dress-pink": 3,
  "bottom-half": 4,
  "bottom-jeans-blue": 5,
  "bottom-jeans": 6,
  "bottom-pants": 7,
  "bottom-short-blue": 8,
  "bottom-skirt": 9,
  "bottom-sweat-light": 10,
  "bottom-sweat": 11,
  "bottom-swim-pink": 12,
  "bottom-swim": 13,
  "boy-base": 14,
  "boy-face-angry": 15,
  "boy-face-calm": 16,
  "boy-face-excited": 17,
  "boy-face-happy": 18,
  "boy-face-sleepy": 19,
  "boy-face-smile": 20,
  "boy-face-surprise": 21,
  "boy-face-wink": 22,
  "girl-base": 23,
  "girl-face-angry": 24,
  "girl-face-calm": 25,
  "girl-face-excited": 26,
  "girl-face-happy": 27,
  "girl-face-sleepy": 28,
  "girl-face-smile": 29,
  "girl-face-surprise": 30,
  "girl-face-wink": 31,
  "hair-bob": 32,
  "hair-bun": 33,
  "hair-cap": 34,
  "hair-fluffy": 35,
  "hair-half": 36,
  "hair-long": 37,
  "hair-longboy": 38,
  "hair-mash": 39,
  "hair-pony": 40,
  "hair-short": 41,
  "hair-spiky": 42,
  "hair-twin": 43,
  "hat-cap": 44,
  "hat-cat": 45,
  "hat-crown": 46,
  "hat-ribbon": 47,
  "hat-straw-ribbon": 48,
  "hat-straw": 49,
  "shoes-boots": 50,
  "shoes-loafer": 51,
  "shoes-pink": 52,
  "shoes-rain": 53,
  "shoes-skate": 54,
  "shoes-sneaker": 55,
  "top-cardigan": 56,
  "top-dress-blue": 57,
  "top-hoodie-blue": 58,
  "top-hoodie-pink": 59,
  "top-jacket-blue": 60,
  "top-sport-blue": 61,
  "top-sweater-blue": 62,
  "top-sweater-pink": 63,
  "top-tshirt-blue": 64,
  "top-tshirt-pink": 65,
  "top-uniform-blue": 66,
  "top-uniform-pink": 67,
} as const;

export type OfficialSpriteName = keyof typeof OFFICIAL_SPRITES;

const HAIR: Record<string, OfficialSpriteName> = {
  hair_short: "hair-short",
  hair_veryshort: "hair-mash",
  hair_bangs: "hair-fluffy",
  hair_nobangs: "hair-longboy",
  hair_bob: "hair-bob",
  hair_medium: "hair-half",
  hair_long: "hair-long",
  hair_straight: "hair-long",
  hair_fluffy: "hair-twin",
  hair_ponytail: "hair-pony",
  hair_twin: "hair-twin",
  hair_bun: "hair-bun",
  hair_curly: "hair-fluffy",
  hair_sporty: "hair-mash",
  hair_spiky: "hair-spiky",
  hair_unique: "hair-cap",
};

const FACE_KIND: Record<string, string> = {
  face_genki: "happy",
  face_yasashii: "calm",
  face_akarui: "excited",
  face_cool: "angry",
  face_omoshiro: "wink",
  face_kawaii: "smile",
  face_simple: "calm",
  face_nikoniko: "happy",
  face_kirakira: "excited",
  face_nemui: "sleepy",
  face_odoroki: "surprise",
  face_tanken: "angry",
};

const TOPS: Record<string, OfficialSpriteName> = {
  tops_hoodie_blue: "top-hoodie-blue",
  tops_hoodie_pink: "top-hoodie-pink",
  tops_polo: "top-tshirt-blue",
  tops_sweat: "top-sweater-blue",
  tops_knit: "top-sweater-pink",
  tops_cardigan: "top-cardigan",
  tops_shirt: "top-uniform-blue",
  tops_jersey: "top-sport-blue",
  tops_sportswear: "top-sport-blue",
  tops_denim: "top-jacket-blue",
  tops_ribbon: "top-tshirt-pink",
  tops_frill: "top-cardigan",
  tops_gym: "top-tshirt-blue",
  tops_onepiece: "top-dress-blue",
};

const BOTTOMS: Record<string, OfficialSpriteName> = {
  bottoms_pants: "bottom-pants",
  bottoms_skirt: "bottom-skirt",
  bottoms_short: "bottom-short-blue",
  bottoms_half: "bottom-half",
  bottoms_jeans: "bottom-jeans",
  bottoms_cargo: "bottom-cargo",
  bottoms_sweatpants: "bottom-sweat",
  bottoms_sportpants: "bottom-sweat-light",
  bottoms_pleats: "bottom-skirt",
  bottoms_check: "bottom-dress-pink",
  bottoms_ribbonskirt: "bottom-skirt",
  bottoms_wide: "bottom-jeans-blue",
};

const SHOES: Record<string, OfficialSpriteName> = {
  shoes_basic: "shoes-sneaker",
  shoes_sneaker: "shoes-sneaker",
  shoes_color: "shoes-pink",
  shoes_sport: "shoes-skate",
  shoes_uwabaki: "shoes-loafer",
  shoes_sandal: "shoes-pink",
  shoes_boots_rain: "shoes-rain",
  shoes_boots: "shoes-boots",
  shoes_star: "shoes-skate",
};

const HATS: Record<string, OfficialSpriteName> = {
  hat_green: "hat-cap",
  hat_cap: "hat-cap",
  hat_knit: "hat-ribbon",
  hat_straw: "hat-straw",
  hat_bucket: "hat-straw",
  hat_beret: "hat-ribbon",
  hat_ribbon: "hat-ribbon",
  hat_band: "hat-cat",
  hat_crown: "hat-crown",
  hat_cat: "hat-cat",
  hat_rabbit: "hat-ribbon",
  hat_redwhite: "hat-cap",
};

export const isGirlBase = (hairId?: string) =>
  !!hairId && ["hair_bob", "hair_medium", "hair_long", "hair_straight", "hair_fluffy", "hair_ponytail", "hair_twin", "hair_bun"].includes(hairId);

export function officialSpriteForItem(itemId: string, base: "boy" | "girl" = "boy"): OfficialSpriteName | undefined {
  if (HAIR[itemId]) return HAIR[itemId];
  if (TOPS[itemId]) return TOPS[itemId];
  if (BOTTOMS[itemId]) return BOTTOMS[itemId];
  if (SHOES[itemId]) return SHOES[itemId];
  if (HATS[itemId]) return HATS[itemId];
  if (itemId.startsWith("face_")) return `${base}-face-${FACE_KIND[itemId] ?? "happy"}` as OfficialSpriteName;
  if (itemId.startsWith("glasses_")) return "acc-glasses";
  if (itemId.startsWith("hold_") && ["hold_backpack", "hold_randoseru", "hold_shoulder", "hold_sportsbag"].includes(itemId)) return "acc-backpack";
  if (itemId.startsWith("tops_tee_")) return itemId.endsWith("pink") || itemId.endsWith("red") ? "top-tshirt-pink" : "top-tshirt-blue";
  return undefined;
}