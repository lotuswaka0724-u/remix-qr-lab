/**
 * リデザイン前の基準スナップショットを作る／比べるためのスクリプト。
 * アプリからは import されません（ビルド対象外）。
 *
 * 作成:  bun --preload ./baseline/asset-stub.ts ./baseline/snapshot.ts write
 * 比較:  bun --preload ./baseline/asset-stub.ts ./baseline/snapshot.ts check
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const OUT = join(import.meta.dir, "snapshot.json");

const cat = await import("../src/lib/collection-catalog.ts");

const PROTECTED_FILES = [
  "src/lib/collection-catalog.ts",
  "src/lib/collection.functions.ts",
  "src/lib/homework-store.ts",
  "src/lib/student.functions.ts",
  "src/lib/class-sync.functions.ts",
  "src/lib/gate.server.ts",
  "src/lib/hwqr.server.ts",
  "src/lib/hwqr.functions.ts",
  "src/lib/prizes.functions.ts",
  "src/lib/game.functions.ts",
  "src/lib/game-settings.ts",
  "src/lib/daily-play.ts",
  "src/routes/__root.tsx",
  "src/routes/api/public/prize-asset.$file.tsx",
];

const sha = (buf: Buffer | string) => createHash("sha256").update(buf).digest("hex");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

function build() {
  const items = cat.COLL_ITEMS.map((i: Record<string, unknown>, order: number) => ({
    order,
    id: i.id,
    name: i.name,
    category: i.category,
    rarity: i.rarity,
    weight: cat.COLL_RARITY_META[i.rarity as keyof typeof cat.COLL_RARITY_META].weight,
    minRank: cat.COLL_RARITY_META[i.rarity as keyof typeof cat.COLL_RARITY_META].minRank,
    initial: i.initial,
    obtainable: i.obtainable ?? null,
    inGachaPool: !i.initial && i.obtainable !== false,
    description: i.description,
    provider: i.provider ?? null,
    image: i.image ?? null,
    asset: i.asset ?? null,
    art: i.art,
  }));

  const count = (f: (i: (typeof items)[number]) => string) =>
    items.reduce<Record<string, number>>((a, i) => ((a[f(i)] = (a[f(i)] ?? 0) + 1), a), {});

  const rankOrder = { NORMAL: 0, GOLD: 1, BLACK: 2 } as const;
  const odds = Object.fromEntries(
    (["NORMAL", "GOLD", "BLACK"] as const).map((rank) => {
      const pool = items.filter(
        (i) => i.inGachaPool && rankOrder[i.minRank as keyof typeof rankOrder] <= rankOrder[rank],
      );
      const total = pool.reduce((a, i) => a + i.weight, 0);
      const byRarity: Record<string, { items: number; percent: number }> = {};
      for (const i of pool) {
        const r = (byRarity[i.rarity as string] ??= { items: 0, percent: 0 });
        r.items++;
        r.percent += (i.weight / total) * 100;
      }
      for (const r of Object.values(byRarity)) r.percent = Math.round(r.percent * 100) / 100;
      return [rank, { poolSize: pool.length, totalWeight: total, byRarity }];
    }),
  );

  const assets = ["public", "src/assets"]
    .flatMap((d) => walk(join(ROOT, d)))
    .map((p) => ({ path: relative(ROOT, p), bytes: statSync(p).size, sha256: sha(readFileSync(p)) }))
    .sort((a, b) => a.path.localeCompare(b.path));

  const routes = walk(join(ROOT, "src/routes"))
    .map((p) => relative(ROOT, p))
    .filter((p) => p.endsWith(".tsx"))
    .sort();

  return {
    summary: {
      totalItems: items.length,
      byCategory: count((i) => i.category as string),
      byRarity: count((i) => i.rarity as string),
      initialIds: cat.COLL_INITIAL_IDS,
      gachaPoolSize: items.filter((i) => i.inGachaPool).length,
      realAssetIds: cat.REAL_ASSET_IDS.length,
      idListSha256: sha(items.map((i) => i.id).join("\n")),
      itemsSha256: sha(JSON.stringify(items)),
    },
    rarityMeta: cat.COLL_RARITY_META,
    rarityOrder: cat.COLL_RARITY_ORDER,
    categories: cat.COLL_CATEGORIES,
    categoryLabels: cat.COLL_CATEGORY_LABEL,
    gachaOddsByRank: odds,
    routes,
    protectedFiles: PROTECTED_FILES.map((f) => ({ path: f, sha256: sha(readFileSync(join(ROOT, f))) })),
    assets,
    items,
  };
}

const mode = process.argv[2] ?? "check";
const current = build();

if (mode === "write") {
  writeFileSync(OUT, JSON.stringify(current, null, 2) + "\n");
  console.log(`wrote ${relative(ROOT, OUT)}`, current.summary);
} else {
  const base = JSON.parse(readFileSync(OUT, "utf8")) as ReturnType<typeof build>;
  const problems: string[] = [];
  const baseById = new Map(base.items.map((i) => [i.id, i]));
  const curById = new Map(current.items.map((i) => [i.id, i]));
  for (const id of baseById.keys()) if (!curById.has(id)) problems.push(`景品IDが消えた: ${id}`);
  for (const id of curById.keys()) if (!baseById.has(id)) problems.push(`景品IDが増えた: ${id}`);
  for (const [id, b] of baseById) {
    const c = curById.get(id);
    if (!c) continue;
    for (const k of ["name", "category", "rarity", "weight", "minRank", "initial", "obtainable", "inGachaPool"] as const)
      if (JSON.stringify(b[k]) !== JSON.stringify(c[k])) problems.push(`${id}.${k}: ${JSON.stringify(b[k])} → ${JSON.stringify(c[k])}`);
  }
  if (JSON.stringify(base.rarityMeta) !== JSON.stringify(current.rarityMeta)) problems.push("レアリティ設定（重み・必要ランク）が変わった");
  if (JSON.stringify(base.gachaOddsByRank) !== JSON.stringify(current.gachaOddsByRank)) problems.push("ガチャ確率が変わった");
  const baseAssets = new Set(base.assets.map((a) => a.path));
  for (const a of baseAssets) if (!current.assets.some((c) => c.path === a)) problems.push(`アセットが消えた: ${a}`);
  const changedFiles = current.protectedFiles
    .filter((f) => base.protectedFiles.find((b) => b.path === f.path)?.sha256 !== f.sha256)
    .map((f) => f.path);
  const missingRoutes = base.routes.filter((r) => !current.routes.includes(r));

  if (missingRoutes.length) problems.push(`ルートが消えた: ${missingRoutes.join(", ")}`);
  console.log(changedFiles.length ? `注意: 保護対象ファイルが変更されています → ${changedFiles.join(", ")}` : "保護対象ファイル: 変更なし");
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
  console.log(`OK: 景品 ${current.items.length} 件の ID・属性・確率・アセット・ルートは基準と一致`);
}
