import { describe, expect, it } from "vitest";

import { COLL_ITEMS, COLL_ITEM_BY_ID, namePlateStyle } from "@/lib/collection-catalog";

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

  it("先生画面用は画像を読まない", () => {
    expect(namePlateStyle("bg_gold", true).art).not.toContain("url(");
    expect(namePlateStyle("bg_dragonlair", true).art).not.toContain("url(");
  });

  it("未知のIDや背景以外のIDはシンプルにもどる", () => {
    expect(namePlateStyle("nope").id).toBe("bg_simple");
    expect(namePlateStyle("ic_cat").id).toBe("bg_simple");
  });
});
