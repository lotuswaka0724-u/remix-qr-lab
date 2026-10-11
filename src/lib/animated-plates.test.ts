import { describe, it, expect } from "vitest";
import { ANIMATED_PLATES } from "./animated-plates";
import { COLL_ITEMS, COLL_INITIAL_IDS, COLL_RARITY_META } from "./collection-catalog";
import baseline from "../../scripts/catalog-baseline.json";

describe("ガチャ対象外の動くプレート", () => {
  it("新規6件の正式レア度を登録", () => {
    expect(ANIMATED_PLATES.map(p => [p.id,p.rarity])).toEqual([
      ["bg_motion_cyan","SR"], ["bg_motion_violet","SR"], ["bg_motion_crystal","SSR"],
      ["bg_motion_neon","SSR"], ["bg_motion_gold","GOLD"], ["bg_motion_black","BLACK"],
    ]);
    expect(new Set(COLL_ITEMS.map(i => i.id)).size).toBe(160);
  });
  it("新規6件を抽選・初期所持から除外", () => {
    expect(ANIMATED_PLATES).toHaveLength(6);
    for (const p of ANIMATED_PLATES) {
      expect(p.obtainable).toBe(false);
      expect(Boolean(p.initial)).toBe(false);
      expect(COLL_INITIAL_IDS).not.toContain(p.id);
      expect(COLL_ITEMS.find(i => i.id === p.id)).toEqual(p);
    }
  });
  for (const rank of ["NORMAL","GOLD","BLACK"] as const) {
    it(`${rank}の候補ID・重み合計・全既存景品の当選率は不変`, () => {
      const order = { NORMAL:0,GOLD:1,BLACK:2 };
      const before = baseline.map(i => ({...i, rarity:i.category === "background" ? "N" as const : i.rarity}));
      const eligible = (i: {initial?: boolean; obtainable?: boolean; rarity: string}) => !i.initial && i.obtainable !== false && order[COLL_RARITY_META[i.rarity as keyof typeof COLL_RARITY_META].minRank] <= order[rank];
      const oldPool = before.filter(eligible);
      const pool = COLL_ITEMS.filter(eligible);
      expect(pool.map(i => i.id)).toEqual(oldPool.map(i => i.id));
      const weight = (i: {rarity: string}) => COLL_RARITY_META[i.rarity as keyof typeof COLL_RARITY_META].weight;
      const oldTotal = oldPool.reduce((n,i) => n+weight(i),0);
      const total = pool.reduce((n,i) => n+weight(i),0);
      expect(total).toBe(oldTotal);
      expect(pool.map(i => weight(i)/total)).toEqual(oldPool.map(i => weight(i)/oldTotal));
    });
  }
  it("既存の抽選重みは55/27/13/6/4/1", () => {
    expect(Object.values(COLL_RARITY_META).map(i => i.weight)).toEqual([55,27,13,6,4,1]);
  });
});