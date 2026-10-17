import { describe, it, expect } from "vitest";
import { ANIMATED_PLATES } from "./animated-plates";
import { COLL_ITEMS, COLL_INITIAL_IDS, COLL_RARITY_META } from "./collection-catalog";
import baseline from "../../scripts/catalog-baseline.json";

describe("高レアリティ景品の動くプレート", () => {
  it("新規6件の正式レア度を登録", () => {
    expect(ANIMATED_PLATES.map(p => [p.id,p.rarity])).toEqual([
      ["bg_motion_cyan","GOLD"], ["bg_motion_violet","GOLD"], ["bg_motion_crystal","GOLD"],
      ["bg_motion_neon","GOLD"], ["bg_motion_gold","GOLD"], ["bg_motion_black","BLACK"],
    ]);
    expect(new Set(COLL_ITEMS.map(i => i.id)).size).toBe(160);
  });
  it("新規6件を抽選対象にして初期所持からは除外", () => {
    expect(ANIMATED_PLATES).toHaveLength(6);
    for (const p of ANIMATED_PLATES) {
      expect(p.obtainable).toBe(true);
      expect(Boolean(p.initial)).toBe(false);
      expect(COLL_INITIAL_IDS).not.toContain(p.id);
      expect(COLL_ITEMS.find(i => i.id === p.id)).toEqual(p);
    }
  });
  for (const rank of ["NORMAL","GOLD","BLACK"] as const) {
    it(`${rank}の既存候補と重みを維持し、許可ランクの追加分のみ抽選に含める`, () => {
      const order = { NORMAL:0,GOLD:1,BLACK:2 };
      const before = baseline.map(i => ({...i, rarity:i.category === "background" ? "N" as const : i.rarity}));
      const eligible = (i: {initial?: boolean; obtainable?: boolean; rarity: string}) => !i.initial && i.obtainable !== false && order[COLL_RARITY_META[i.rarity as keyof typeof COLL_RARITY_META].minRank] <= order[rank];
      const oldPool = before.filter(eligible);
      const pool = COLL_ITEMS.filter(eligible);
      const addedIds = rank === "NORMAL" ? [] : rank === "GOLD"
        ? ["bg_motion_cyan", "bg_motion_violet", "bg_motion_crystal", "bg_motion_neon", "bg_motion_gold"]
        : ["bg_motion_cyan", "bg_motion_violet", "bg_motion_crystal", "bg_motion_neon", "bg_motion_gold", "bg_motion_black"];
      const existingPool = pool.filter(i => !i.id.startsWith("bg_motion_"));
      expect(existingPool.map(i => i.id)).toEqual(oldPool.map(i => i.id));
      expect(pool.filter(i => i.id.startsWith("bg_motion_")).map(i => i.id)).toEqual(addedIds);
      const weight = (i: {rarity: string}) => COLL_RARITY_META[i.rarity as keyof typeof COLL_RARITY_META].weight;
      const oldTotal = oldPool.reduce((n,i) => n+weight(i),0);
      const total = pool.reduce((n,i) => n+weight(i),0);
      expect(existingPool.map(weight)).toEqual(oldPool.map(weight));
      expect(total).toBe(oldTotal + (rank === "NORMAL" ? 0 : rank === "GOLD" ? 20 : 21));
    });
  }
  it("既存の抽選重みは55/27/13/6/4/1", () => {
    expect(Object.values(COLL_RARITY_META).map(i => i.weight)).toEqual([55,27,13,6,4,1]);
  });
});