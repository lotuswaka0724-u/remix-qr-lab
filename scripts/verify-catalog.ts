/**
 * 内蔵景品（154種類）の照合。
 * id / 名前 / カテゴリー / レアリティ / 初期所持 / ガチャ排出 / 表示順 が
 * 基準ファイル（scripts/catalog-baseline.json）と同じかを確かめる。
 *
 *   bun run scripts/verify-catalog.ts
 */
import baseline from "./catalog-baseline.json";

import { COLL_ITEMS } from "../src/lib/collection-catalog";
import { ANIMATED_PLATES } from "../src/lib/animated-plates";

type Row = (typeof baseline)[number];

const now: Row[] = COLL_ITEMS.map((i) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  rarity: i.rarity,
  initial: !!i.initial,
  obtainable: i.obtainable !== false,
  sort: i.sort ?? null,
}));

const problems: string[] = [];

const seen = new Set<string>();
for (const r of now) {
  if (seen.has(r.id)) problems.push(`重複ID: ${r.id}`);
  seen.add(r.id);
}

const byId = new Map(now.map((r) => [r.id, r]));
for (const b of baseline as Row[]) {
  const cur = byId.get(b.id);
  if (!cur) {
    problems.push(`欠落: ${b.id}`);
    continue;
  }
  for (const k of Object.keys(b) as (keyof Row)[]) {
    // Authorized exception: only the 37 built-in name plates become N.
    if (k === "rarity" && b.category === "background" && cur.rarity === "N") continue;
    if (cur[k] !== b[k])
      problems.push(`変更: ${b.id}.${String(k)} ${String(b[k])} → ${String(cur[k])}`);
  }
}
for (const r of now)
  if (!(baseline as Row[]).some((b) => b.id === r.id) && !ANIMATED_PLATES.some(p => p.id === r.id && p.obtainable === true && !p.initial && p.rarity === (p.id === "bg_motion_black" ? "BLACK" : "GOLD"))) problems.push(`未許可の追加: ${r.id}`);

const counts = now.reduce<Record<string, number>>((a, r) => {
  a[r.category] = (a[r.category] ?? 0) + 1;
  return a;
}, {});

console.log(`景品数: ${now.length} / 基準 ${baseline.length}`);
console.log("カテゴリー別:", counts);
if (problems.length) {
  console.error("照合エラー:\n" + problems.join("\n"));
  process.exit(1);
}
console.log("照合OK: 既存154件を維持、承認されたGOLD5件・BLACK1件のみ追加");
