import type { CollItem } from "./collection-catalog";

/** Reserved items: neither initial equipment nor part of any gacha pool. */
export const ANIMATED_PLATES: CollItem[] = [
  { id: "bg_motion_cyan", name: "CYANプレート", rarity: "SR", description: "精密なネオン回路を流れるシアンの光", category: "background", obtainable: false, art: { css: "linear-gradient(90deg,var(--plate-cyan),var(--plate-base) 12% 88%,var(--plate-cyan))" } },
  { id: "bg_motion_violet", name: "VIOLETプレート", rarity: "SR", description: "宇宙の曲線と揺らめく紫のオーラ", category: "background", obtainable: false, art: { css: "linear-gradient(90deg,var(--plate-violet),var(--plate-base) 12% 88%,var(--plate-rose))" } },
  { id: "bg_motion_crystal", name: "CRYSTALプレート", rarity: "SSR", description: "透明な結晶のファセットと偏光の反射", category: "background", obtainable: false, art: { css: "linear-gradient(90deg,var(--plate-pearl),var(--plate-base) 12% 88%,var(--plate-cyan))" } },
  { id: "bg_motion_neon", name: "NEONプレート", rarity: "SSR", description: "多重の光路を走るゲームコンソール", category: "background", obtainable: false, art: { css: "linear-gradient(90deg,var(--plate-cyan),var(--plate-base) 12% 88%,var(--plate-rose))" } },
  { id: "bg_motion_gold", name: "GOLDプレート", rarity: "GOLD", description: "彫刻された金属と静かな金色のきらめき", category: "background", obtainable: false, art: { css: "linear-gradient(90deg,var(--plate-gold),var(--plate-base) 12% 88%,var(--plate-gold))" } },
  { id: "bg_motion_black", name: "BLACKプレート", rarity: "BLACK", description: "黒曜石の装甲に交差するシアンと紫の光", category: "background", obtainable: false, art: { css: "linear-gradient(90deg,var(--plate-violet),var(--plate-base) 12% 88%,var(--plate-cyan))" } },
];

export function animatedPlateKind(id?: string) {
  return ANIMATED_PLATES.find(item => item.id === id)?.id.replace("bg_motion_", "");
}