/**
 * 先生用のデモ／動作確認モード。
 * すべてブラウザの中だけで動き、児童のデータ（ポイント・アイテム・アバター）には
 * いっさい書き込まない。サーバー関数も呼ばない。
 */
import { ITEMS, ITEM_BY_ID, MAX_FURNITURE, RARITY_META } from "@/lib/game-catalog";
import { DEFAULT_GAME_SETTINGS, type GameSettings } from "@/lib/game-settings";
import type { GameData, GameView } from "@/lib/game.functions";

export type Prize = {
  id: string;
  name: string;
  rarity: "N" | "R" | "SR" | "SSR";
  category: string;
  description: string;
  duplicate: boolean;
};

export type GameResult = (GameView & { error?: string; prize?: Prize }) | null;

/** 画面から呼ぶ操作のかたまり（児童＝サーバー版／先生＝デモ版） */
export type GameEngine = {
  load: () => Promise<GameView | null>;
  create: (equipped: Record<string, string>) => Promise<GameView | null>;
  equip: (itemId: string, off: boolean) => Promise<GameResult>;
  draw: () => Promise<GameResult>;
  /** 先生モード：すべてのアイテムを試着でき、1日の回数せいげんもない */
  teacher?: boolean;
};

const demoData = (): GameData => ({
  created: false,
  equipped: {},
  owned: ITEMS.map((i) => i.id),
  petItems: [],
  room: { wallpaper: "wall_plain", floor: "floor_wood", furniture: ["fn_desk", "fn_chair"] },
  customize: { day: "demo", count: 0 },
});

export function createDemoEngine(settings?: Partial<GameSettings>): GameEngine & { reset: () => void } {
  const conf: GameSettings = { ...DEFAULT_GAME_SETTINGS, ...(settings ?? {}) };
  let data = demoData();
  let points = 500;

  const view = (extra?: Partial<GameView>): GameView => ({
    data,
    points,
    rank: "BLACK",
    settings: conf,
    customizeLeft: 999,
    ...(extra ?? {}),
  });

  return {
    teacher: true,
    reset: () => {
      data = demoData();
      points = 500;
    },
    load: async () => view(),
    create: async (equipped) => {
      const next: GameData["equipped"] = {};
      for (const [cat, id] of Object.entries(equipped)) {
        const item = ITEM_BY_ID[id];
        if (item && item.category === cat) next[item.category] = item.id;
      }
      data = { ...data, created: true, equipped: next };
      return view();
    },
    equip: async (itemId, off) => {
      const item = ITEM_BY_ID[itemId];
      if (!item) return view();
      const next: GameData = {
        ...data,
        equipped: { ...data.equipped },
        petItems: [...data.petItems],
        room: { ...data.room, furniture: [...data.room.furniture] },
      };
      if (item.category === "petItem") {
        const same = next.petItems.find((id) => ITEM_BY_ID[id]?.art["slot"] === item.art["slot"]);
        next.petItems = next.petItems.filter((id) => id !== same);
        if (!off) next.petItems.push(item.id);
      } else if (item.category === "pet") {
        next.pet = off ? undefined : item.id;
      } else if (item.category === "furniture") {
        const has = next.room.furniture.includes(item.id);
        next.room.furniture = has
          ? next.room.furniture.filter((id) => id !== item.id)
          : [...next.room.furniture, item.id].slice(-MAX_FURNITURE);
      } else if (item.category === "wallpaper" || item.category === "floor") {
        next.room = { ...next.room, [item.category]: item.id };
      } else if (off) {
        delete next.equipped[item.category];
      } else {
        next.equipped[item.category] = item.id;
      }
      data = next;
      return view();
    },
    draw: async () => {
      if (points < conf.itemGachaCost) return { ...view(), error: "points" };
      const pool = ITEMS.filter((i) => i.isGacha && i.available);
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
      points -= conf.itemGachaCost;
      return {
        ...view(),
        prize: {
          id: picked.id,
          name: picked.name,
          rarity: picked.rarity,
          category: picked.category,
          description: picked.description,
          duplicate: false,
        },
      };
    },
  };
}
