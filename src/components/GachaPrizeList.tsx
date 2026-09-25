import { useState } from "react";

import { COLL_CATEGORIES, COLL_ITEMS, COLL_RARITY_META } from "@/lib/collection-catalog";

const CAT_LABEL: Record<string, string> = {
  background: "背景",
  icon: "アイコン",
  frame: "フレーム",
  sound: "効果音",
  effect: "エフェクト",
};

/** 先生用：ガチャ景品の確認（表示のみ・データは変更しない） */
export default function GachaPrizeList() {
  const [open, setOpen] = useState(false);
  return (
    <section className="paper-card p-4">
      <button type="button" className="font-display text-base font-bold" onClick={() => setOpen(!open)}>
        {open ? "▼" : "▶"} ガチャ景品一覧（{COLL_ITEMS.length}種）
      </button>
      {open &&
        COLL_CATEGORIES.map((c) => {
          const items = COLL_ITEMS.filter((i) => i.category === c);
          return (
            <div key={c} className="mt-3">
              <h3 className="text-sm font-bold">
                {CAT_LABEL[c] ?? c}（{items.length}）
              </h3>
              <ul className="mt-1 grid grid-cols-2 gap-1 text-xs sm:grid-cols-4">
                {items.map((i) => (
                  <li key={i.id} className="rounded border border-border px-2 py-1">
                    <b>{COLL_RARITY_META[i.rarity].label ?? i.rarity}</b> {i.name}
                    {i.initial ? "（初期）" : i.obtainable === false ? "（停止）" : ""}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
    </section>
  );
}
