/**
 * 内蔵景品（154種類）の照合。
 * id / 名前 / カテゴリー / レアリティ / 初期所持 / ガチャ排出 / 表示順 が
 * 基準ファイル（scripts/catalog-baseline.json）と同じかを確かめる。
 *
 *   bun run scripts/verify-catalog.ts
 */
import baseline from "./catalog-baseline.json";

import { COLL_ITEMS } from "../src/lib/collection-catalog";

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
    if (cur[k] !== b[k]) problems.push(`変更: ${b.id}.${String(k)} ${String(b[k])} → ${String(cur[k])}`);
  }
}
for (const r of now) if (!(baseline as Row[]).some((b) => b.id === r.id)) problems.push(`追加: ${r.id}`);

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
console.log("照合OK: 変更・欠落・重複はありません");
