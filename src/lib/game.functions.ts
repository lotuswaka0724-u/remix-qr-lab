import { createServerFn } from "@tanstack/react-start";

import {
  ITEM_BY_ID,
  ITEMS,
  MAX_FURNITURE,
  RARITY_META,
  type Category,
  type Rarity,
} from "@/lib/game-catalog";
import { DEFAULT_GAME_SETTINGS, type GameSettings } from "@/lib/game-settings";

/** アバター・ペット・マイルームのデータ（既存の宿題・ポイントデータとは別に保存する） */
export type GameData = {
  created: boolean;
  equipped: Partial<Record<Category, string>>;
  owned: string[];
  pet?: string | undefined;
  petItems: string[];
  room: { wallpaper?: string | undefined; floor?: string | undefined; furniture: string[] };
  customize: { day: string; count: number };
};

export type GameView = {
  data: GameData;
  points: number;
  rank: "NORMAL" | "GOLD" | "BLACK";
  settings: GameSettings;
  customizeLeft: number;
};

const dayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const emptyGame = (): GameData => ({
  created: false,
  equipped: {},
  owned: ITEMS.filter((i) => i.isInitial).map((i) => i.id),
  petItems: [],
  room: { wallpaper: "wall_plain", floor: "floor_wood", furniture: ["fn_desk", "fn_chair"] },
  customize: { day: dayKey(), count: 0 },
});

const normalize = (raw: Partial<GameData> | null | undefined): GameData => {
  const base = emptyGame();
  const g: GameData = {
    ...base,
    ...(raw ?? {}),
    equipped: { ...(raw?.equipped ?? {}) },
    owned: Array.from(new Set([...base.owned, ...(raw?.owned ?? [])])),
    petItems: raw?.petItems ?? [],
    room: { ...base.room, ...(raw?.room ?? {}) },
    customize: raw?.customize ?? base.customize,
  };
  if (g.customize.day !== dayKey()) g.customize = { day: dayKey(), count: 0 };
  return g;
};

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function readGame(studentId: string): Promise<GameData> {
  const client = await db();
  const { data } = await client
    .from("student_game")
    .select("data")
    .eq("student_id", studentId)
    .maybeSingle();
  return normalize((data?.data ?? null) as Partial<GameData> | null);
}

async function writeGame(studentId: string, g: GameData) {
  const client = await db();
  await client.from("student_game").upsert({
    student_id: studentId,
    data: g as never,
    updated_at: new Date().toISOString(),
  });
}

async function session() {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  if (gate.data.role !== "student" || !gate.data.studentId) return null;
  return gate.data.studentId;
}

/** 既存のポイント計算はさわらず、そのまま読むだけ */
async function pointsOf(studentId: string) {
  const { readClassState } = await import("@/lib/gate.server");
  const state = await readClassState();
  const [{ mergeState, earnedPoints, availablePoints, rankOfPoints }] = await Promise.all([
    import("@/lib/homework-store"),
  ]);
  const merged = mergeState(state);
  return {
    state: merged,
    available: availablePoints(merged, studentId),
    earned: earnedPoints(merged, studentId),
    rank: rankOfPoints(merged.rankRules, earnedPoints(merged, studentId)),
  };
}

function settingsOf(state: { gameSettings?: Partial<GameSettings> }): GameSettings {
  return { ...DEFAULT_GAME_SETTINGS, ...(state.gameSettings ?? {}) };
}

async function view(studentId: string, g?: GameData): Promise<GameView> {
  const data = g ?? (await readGame(studentId));
  const p = await pointsOf(studentId);
  const settings = settingsOf(p.state as never);
  return {
    data,
    points: p.available,
    rank: p.rank,
    settings,
    customizeLeft: Math.max(0, settings.dailyCustomizeLimit - data.customize.count),
  };
}

export const getGame = createServerFn({ method: "GET" }).handler(async () => {
  const studentId = await session();
  if (!studentId) return null;
  return view(studentId);
});

/** 初回アバター作成 */
export const createAvatar = createServerFn({ method: "POST" })
  .inputValidator((data: { equipped: Record<string, string> }) => ({
    equipped: data.equipped ?? {},
  }))
  .handler(async ({ data }) => {
    const studentId = await session();
    if (!studentId) return null;
    const g = await readGame(studentId);
    const equipped: Partial<Record<Category, string>> = {};
    for (const [cat, id] of Object.entries(data.equipped)) {
      const item = ITEM_BY_ID[id];
      if (item && item.category === cat && item.isInitial) equipped[item.category] = item.id;
    }
    const next: GameData = { ...g, created: true, equipped };
    await writeGame(studentId, next);
    return view(studentId, next);
  });

/** きせかえ（1日の回数をかぞえる） */
export const equipItem = createServerFn({ method: "POST" })
  .inputValidator((data: { itemId: string; off?: boolean }) => ({
    itemId: String(data.itemId ?? ""),
    off: Boolean(data.off),
  }))
  .handler(async ({ data }) => {
    const studentId = await session();
    if (!studentId) return null;
    const item = ITEM_BY_ID[data.itemId];
    if (!item) return null;
    const g = await readGame(studentId);
    if (!g.owned.includes(item.id)) return { ...(await view(studentId, g)), error: "notowned" as const };

    const v0 = await view(studentId, g);
    if (v0.customizeLeft <= 0) return { ...v0, error: "limit" as const };

    const next: GameData = {
      ...g,
      equipped: { ...g.equipped },
      petItems: [...g.petItems],
      room: { ...g.room, furniture: [...g.room.furniture] },
      customize: { day: dayKey(), count: g.customize.count + 1 },
    };

    if (item.category === "petItem") {
      const same = next.petItems.find((id) => ITEM_BY_ID[id]?.art["slot"] === item.art["slot"]);
      next.petItems = next.petItems.filter((id) => id !== same);
      if (!data.off && same !== item.id) next.petItems.push(item.id);
      else if (!data.off && same === item.id) next.petItems.push(item.id);
      if (data.off) next.petItems = next.petItems.filter((id) => id !== item.id);
    } else if (item.category === "pet") {
      next.pet = data.off ? undefined : item.id;
    } else if (item.category === "furniture") {
      const has = next.room.furniture.includes(item.id);
      if (has || data.off) next.room.furniture = next.room.furniture.filter((id) => id !== item.id);
      else next.room.furniture = [...next.room.furniture, item.id].slice(-MAX_FURNITURE);
    } else if (item.category === "wallpaper" || item.category === "floor") {
      next.room = { ...next.room, [item.category]: item.id };
    } else if (data.off) {
      delete next.equipped[item.category];
    } else {
      next.equipped[item.category] = item.id;
    }

    await writeGame(studentId, next);
    return view(studentId, next);
  });

/** アイテムガチャ：既存のポイント（ガチャ履歴＝つかったポイント）で回す */
export const drawItemGacha = createServerFn({ method: "POST" }).handler(async () => {
  const studentId = await session();
  if (!studentId) return null;
  const { readClassState, writeClassState } = await import("@/lib/gate.server");
  const state = await readClassState();
  const p = await pointsOf(studentId);
  const settings = settingsOf(p.state as never);
  const g = await readGame(studentId);

  if (!settings.gachaOn) return { ...(await view(studentId, g)), error: "off" as const };
  if (p.available < settings.itemGachaCost)
    return { ...(await view(studentId, g)), error: "points" as const };

  const pool = ITEMS.filter(
    (i) =>
      i.isGacha &&
      i.available &&
      (!i.season || settings.seasons.includes(i.season)) &&
      (!i.event || settings.events.includes(i.event)),
  );
  if (!pool.length) return { ...(await view(studentId, g)), error: "off" as const };

  const total = pool.reduce((a, i) => a + RARITY_META[i.rarity].weight, 0);
  let r = Math.random() * total;
  let picked = pool[pool.length - 1]!;
  for (const i of pool) {
    r -= RARITY_META[i.rarity].weight;
    if (r <= 0) {
      picked = i;
      break;
    }
  }

  const duplicate = g.owned.includes(picked.id);
  const next: GameData = { ...g, owned: duplicate ? g.owned : [...g.owned, picked.id] };
  await writeGame(studentId, next);

  // ポイントの消費は、これまでどおり「ガチャ履歴」に記録する（計算方法は変えない）
  const log = {
    id: `ig_${Math.random().toString(36).slice(2, 9)}`,
    studentId,
    prize: picked.name,
    cost: settings.itemGachaCost,
    at: Date.now(),
  };
  await writeClassState({ ...state, gachaLog: [log, ...(state.gachaLog ?? [])].slice(0, 500) });

  return {
    ...(await view(studentId, next)),
    prize: {
      id: picked.id,
      name: picked.name,
      rarity: picked.rarity as Rarity,
      category: picked.category,
      description: picked.description,
      duplicate,
    },
  };
});
