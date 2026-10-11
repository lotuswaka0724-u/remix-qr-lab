import { describe, expect, it } from "vitest";

import { COLL_ITEMS, COLL_ITEM_BY_ID, COLL_RARITY_META, namePlateStyle, applyAssetOverrides } from "@/lib/collection-catalog";
import { NAME_PLATE_ASSETS } from "@/lib/name-plate-assets";
import baseline from "../../scripts/catalog-baseline.json";

describe("ネームプレート", () => {
  it("背景アイテム37件のIDと種類はそのまま", () => {
    const bgs = COLL_ITEMS.filter((i) => i.category === "background");
    expect(bgs).toHaveLength(37);
    expect(bgs.every((i) => i.id.startsWith("bg_"))).toBe(true);
    expect(COLL_ITEMS).toHaveLength(154);
  });

  it("表示名は「〇〇プレート」", () => {
    expect(COLL_ITEM_BY_ID["bg_sky"]!.name).toBe("青空プレート");
    expect(COLL_ITEM_BY_ID["bg_gold"]!.name).toBe("ゴールドプレート");
    expect(COLL_ITEM_BY_ID["bg_simple"]!.name).toBe("シンプルプレート");
  });

  it("初期装備「シンプル」は初期所持・ガチャ対象外のまま", () => {
    expect(COLL_ITEM_BY_ID["bg_simple"]!.initial).toBe(true);
  });
  it("ネームプレート37件だけN、他117件のレア度・ID・排出条件を維持", () => {
    expect(COLL_ITEMS.filter(i => i.category === "background" && i.rarity === "N")).toHaveLength(37);
    for (const before of baseline) {
      const item = COLL_ITEM_BY_ID[before.id];
      expect(item?.category).toBe(before.category);
      expect(item?.rarity).toBe(before.category === "background" ? "N" : before.rarity);
      expect(Boolean(item?.initial)).toBe(before.initial);
      expect(item?.obtainable !== false).toBe(before.obtainable);
    }
    expect(Object.values(COLL_RARITY_META).map(r=>r.weight)).toEqual([55,27,13,6,4,1]);
  });
  it("37件の素材を全IDに対応、装備なしもシンプル素材で表示", () => {
    expect(Object.keys(NAME_PLATE_ASSETS)).toHaveLength(37);
    for (const i of COLL_ITEMS.filter(i=>i.category === "background")) {
      expect(NAME_PLATE_ASSETS[i.id]).toBeTruthy();
      expect(namePlateStyle(i.id).art).toContain("url(");
      expect(namePlateStyle(i.id).plain).toBe(false);
    }
    expect(namePlateStyle().id).toBe("bg_simple");
  });
  it("先生差し替えを優先、背景画像のCSS略記で表示を壊さない", () => {
    applyAssetOverrides([{prizeId:"bg_sky",assetUrl:"/test-plate.webp"}]);
    expect(namePlateStyle("bg_sky").art).toBe('url("/test-plate.webp")');
    expect(namePlateStyle("bg_sky",true).art).not.toContain("url(");
    applyAssetOverrides([]);
    expect(namePlateStyle("bg_sky").art).not.toContain("/test-plate.webp");
  });

  it("先生画面用は画像を読まない", () => {
    expect(namePlateStyle("bg_gold", true).art).not.toContain("url(");
    expect(namePlateStyle("bg_dragonlair", true).art).not.toContain("url(");
  });

  it("未知のIDや背景以外のIDはシンプルにもどる", () => {
    expect(namePlateStyle("nope").id).toBe("bg_simple");
    expect(namePlateStyle("ic_cat").id).toBe("bg_simple");
  });
});
