import { createServerFn } from "@tanstack/react-start";

import {
  COLL_CATEGORIES,
  COLL_INITIAL_IDS,
  COLL_ITEMS,
  COLL_ITEM_BY_ID,
  COLL_RARITY_META,
  registerCustomItems,
  type CollCategory,
  type CollRarity,
} from "@/lib/collection-catalog";
import {
  availablePoints,
  earnedPoints,
  mergeState,
  rankOf,
  type AppState,
  type Rank,
} from "@/lib/homework-store";

/** 児童ごとのコレクション（ガチャで集めるアイテム）の保存データ */
export type CollData = {
  owned: string[];
  /** 重複して出たかず（同じアイテムがまた出たとき +1。かけらとして数える） */
  dupes: Record<string, number>;
  equipped: Partial<Record<CollCategory, string>>;
};

export type CollPrize = {
  id: string;
  name: string;
  category: CollCategory;
  rarity: CollRarity;
  description: string;
  duplicate: boolean;
  dupeCount: number;
};

export type CollView = {
  coll: CollData;
  points: number;
  rank: Rank;
  cost: number;
  gachaOn: boolean;
  totalItems: number;
};

const defaults = (): CollData => ({
  owned: [...COLL_INITIAL_IDS],
  dupes: {},
  equipped: {
    background: "bg_simple",
    icon: "ic_cat",
    frame: "fr_simple",
    sound: "sd_pico",
    effect: "ef_spark",
  },
});

function normalizeColl(raw: Partial<CollData> | null | undefined): CollData {
  const base = defaults();
  const owned = Array.from(
    new Set([...base.owned, ...(raw?.owned ?? [])].filter((id) => COLL_ITEM_BY_ID[id])),
  );
  const equipped: Partial<Record<CollCategory, string>> = {};
  for (const cat of COLL_CATEGORIES) {
    const want = raw?.equipped?.[cat];
    if (want && COLL_ITEM_BY_ID[want]?.category === cat && owned.includes(want)) {
      equipped[cat] = want;
    } else if (base.equipped[cat]) {
      equipped[cat] = base.equipped[cat]!;
    }
  }
  return { owned, dupes: raw?.dupes ?? {}, equipped };
}

/** 先生が登録した景品と素材差し替えをマスターに合流させる（毎回よびだしても安全） */
async function syncCustom() {
  try {
    const { readCustomPrizes } = await import("@/lib/prizes.functions");
    registerCustomItems(await readCustomPrizes());
  } catch {
    /* 景品テーブルが読めなくても既存アイテムはそのまま使う */
  }
  try {
    const { readPrizeOverrides } = await import("@/lib/prizes.functions");
    const { applyAssetOverrides } = await import("@/lib/collection-catalog");
    applyAssetOverrides(await readPrizeOverrides());
  } catch {
    /* 差し替えが読めなくても内蔵の見た目でそのまま動く */
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readRaw(studentId: string): Promise<Record<string, unknown>> {
  const db = await admin();
  const { data } = await db
    .from("student_game")
    .select("data")
    .eq("student_id", studentId)
    .maybeSingle();
  return (data?.data ?? {}) as Record<string, unknown>;
}

async function writeColl(studentId: string, coll: CollData) {
  const db = await admin();
  const raw = await readRaw(studentId);
  await db.from("student_game").upsert({
    student_id: studentId,
    data: { ...raw, coll } as never,
    updated_at: new Date().toISOString(),
  });
}

async function session() {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  if (gate.data.role !== "student" || !gate.data.studentId) return null;
  return gate.data.studentId;
}

function pointsOf(state: Partial<AppState>, studentId: string) {
  const merged = mergeState(state);
  const earned = earnedPoints(merged, studentId);
  return {
    earned,
    available: availablePoints(merged, studentId),
    rank: rankOf(merged, studentId),
  };
}

async function buildView(studentId: string, coll?: CollData): Promise<CollView> {
  const { readClassState } = await import("@/lib/gate.server");
  const state = await readClassState();
  const p = pointsOf(state, studentId);
  const data = coll ?? normalizeColl((await readRaw(studentId))["coll"] as Partial<CollData>);
  return {
    coll: data,
    points: p.available,
    rank: p.rank,
    cost: state.gachaCost ?? 10,
    gachaOn: true,
    totalItems: COLL_ITEMS.length,
  };
}

export const getCollection = createServerFn({ method: "GET" }).handler(async () => {
  await syncCustom();
  const studentId = await session();
  if (!studentId) return null;
  return buildView(studentId);
});

/** 使う／はずす（背景・アイコン・フレーム・音・エフェクト） */
export const equipCollItem = createServerFn({ method: "POST" })
  .inputValidator((data: { itemId: string }) => ({ itemId: String(data.itemId ?? "") }))
  .handler(async ({ data }) => {
    await syncCustom();
    const studentId = await session();
    if (!studentId) return null;
    const item = COLL_ITEM_BY_ID[data.itemId];
    if (!item) return buildView(studentId);
    const coll = normalizeColl((await readRaw(studentId))["coll"] as Partial<CollData>);
    if (!coll.owned.includes(item.id))
      return { ...(await buildView(studentId, coll)), error: "notowned" as const };
    const next: CollData = { ...coll, equipped: { ...coll.equipped, [item.category]: item.id } };
    await writeColl(studentId, next);
    return buildView(studentId, next);
  });

/** コレクションガチャ。ポイントは「ガチャ履歴」に記録して消費する（既存の計算方法のまま） */
export const drawCollGacha = createServerFn({ method: "POST" }).handler(async () => {
  await syncCustom();
  const studentId = await session();
  if (!studentId) return null;
  const { readClassState, writeClassState } = await import("@/lib/gate.server");
  const state = await readClassState();
  const p = pointsOf(state, studentId);
  const cost = state.gachaCost ?? 10;
  const coll = normalizeColl((await readRaw(studentId))["coll"] as Partial<CollData>);

  if (p.available < cost)
    return { ...(await buildView(studentId, coll)), error: "points" as const };

  const rankOrder = { NORMAL: 0, GOLD: 1, BLACK: 2 } as const;
  const pool = COLL_ITEMS.filter(
    (i) =>
      !i.initial &&
      i.obtainable !== false &&
      rankOrder[COLL_RARITY_META[i.rarity].minRank] <= rankOrder[p.rank],
  );
  if (!pool.length) return { ...(await buildView(studentId, coll)), error: "off" as const };

  const total = pool.reduce((a, i) => a + COLL_RARITY_META[i.rarity].weight, 0);
  let r = Math.random() * total;
  let picked = pool[pool.length - 1]!;
  for (const i of pool) {
    r -= COLL_RARITY_META[i.rarity].weight;
    if (r <= 0) {
      picked = i;
      break;
    }
  }

  const duplicate = coll.owned.includes(picked.id);
  const dupeCount = (coll.dupes[picked.id] ?? 0) + (duplicate ? 1 : 0);
  const next: CollData = {
    ...coll,
    owned: duplicate ? coll.owned : [...coll.owned, picked.id],
    dupes: duplicate ? { ...coll.dupes, [picked.id]: dupeCount } : coll.dupes,
  };
  await writeColl(studentId, next);

  await writeClassState({
    ...state,
    gachaLog: [
      {
        id: `cl_${Math.random().toString(36).slice(2, 9)}`,
        studentId,
        prize: picked.name,
        cost,
        at: Date.now(),
      },
      ...(state.gachaLog ?? []),
    ].slice(0, 500),
  });

  const prize: CollPrize = {
    id: picked.id,
    name: picked.name,
    category: picked.category,
    rarity: picked.rarity,
    description: picked.description,
    duplicate,
    dupeCount,
  };
  return { ...(await buildView(studentId, next)), prize };
});

export type ClassBadge = {
  studentId: string;
  icon?: string | undefined;
  frame?: string | undefined;
  sound?: string | undefined;
  effect?: string | undefined;
};

/** 先生の読み取り画面用：児童ごとの「アイコン・フレーム・音・エフェクト」だけを返す */
export const getClassBadges = createServerFn({ method: "GET" }).handler(async () => {
  await syncCustom();
  const db = await admin();
  const { data } = await db.from("student_game").select("student_id, data");
  const out: ClassBadge[] = [];
  for (const row of data ?? []) {
    const coll = (row.data as Record<string, unknown> | null)?.["coll"] as
      Partial<CollData> | undefined;
    const eq = coll?.equipped;
    if (!eq) continue;
    out.push({
      studentId: row.student_id,
      icon: eq.icon,
      frame: eq.frame,
      sound: eq.sound,
      effect: eq.effect,
    });
  }
  return out;
});
