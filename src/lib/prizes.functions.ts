import { createServerFn } from "@tanstack/react-start";

import type { CollCategory, CollRarity } from "@/lib/collection-catalog";

/** 先生が登録した景品（DBの1行ぶん） */
export type CustomPrize = {
  id: string;
  name: string;
  category: CollCategory;
  rarity: CollRarity;
  assetUrl: string;
  /** 一覧表示用のサムネイル（本体の素材とは別に登録できる。未設定なら本体を使う） */
  thumbUrl: string | null;
  description: string;
  obtainable: boolean;
  sort: number;
};

const CATEGORIES: CollCategory[] = ["background", "icon", "frame", "sound", "effect"];
const RARITIES: CollRarity[] = ["N", "R", "SR", "SSR", "GOLD", "BLACK"];

/** カテゴリごとに受けつける形式と大きさの上限 */
export const PRIZE_FILE_RULES: Record<
  CollCategory,
  { types: string[]; ext: string[]; maxBytes: number; hint: string }
> = {
  icon: {
    types: ["image/png"],
    ext: ["png"],
    maxBytes: 2 * 1024 * 1024,
    hint: "PNG（透過推奨・512×512px 目安）",
  },
  frame: {
    types: ["image/png"],
    ext: ["png"],
    maxBytes: 2 * 1024 * 1024,
    hint: "PNG（透過必須・512×512px 目安）",
  },
  background: {
    types: ["image/png", "image/jpeg"],
    ext: ["png", "jpg", "jpeg"],
    maxBytes: 3 * 1024 * 1024,
    hint: "PNG または JPG（画面の背景に使うサイズ）",
  },
  sound: {
    types: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave"],
    ext: ["mp3", "wav"],
    maxBytes: 4 * 1024 * 1024,
    hint: "MP3 または WAV",
  },
  effect: {
    types: ["image/png"],
    ext: ["png"],
    maxBytes: 2 * 1024 * 1024,
    hint: "PNG（透過）",
  },
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function isTeacher() {
  const { getGate } = await import("@/lib/gate.server");
  const gate = await getGate();
  return gate.data.role === "teacher";
}

type Row = {
  id: string;
  name: string;
  category: string;
  rarity: string;
  asset_url: string;
  thumb_url?: string | null;
  description: string | null;
  obtainable: boolean;
  sort: number;
};

function toPrize(r: Row): CustomPrize {
  const category = (CATEGORIES as string[]).includes(r.category)
    ? (r.category as CollCategory)
    : "icon";
  const rarity = (RARITIES as string[]).includes(r.rarity) ? (r.rarity as CollRarity) : "N";
  return {
    id: r.id,
    name: r.name,
    category,
    rarity,
    assetUrl: r.asset_url,
    thumbUrl: r.thumb_url ?? null,
    description: r.description ?? "",
    obtainable: r.obtainable,
    sort: r.sort,
  };
}

/** サーバー内で使う読み出し（ガチャ・アイテムBOXの計算用） */
export async function readCustomPrizes(): Promise<CustomPrize[]> {
  try {
    const db = await admin();
    const { data } = await db
      .from("custom_prizes")
      .select("id, name, category, rarity, asset_url, thumb_url, description, obtainable, sort")
      .order("sort", { ascending: true });
    return (data ?? []).map((r) => toPrize(r as Row));
  } catch {
    return [];
  }
}

/** 画面から読む用（児童・先生どちらも見る） */
export const listCustomPrizes = createServerFn({ method: "GET" }).handler(
  async () => await readCustomPrizes(),
);

export type AddPrizeInput = {
  name: string;
  category: CollCategory;
  rarity: CollRarity;
  description: string;
  obtainable: boolean;
  sort: number;
  fileName: string;
  contentType: string;
  dataBase64: string;
  /** 一覧用サムネイル（なくてもよい。PNG/JPG・1MBまで） */
  thumbFileName?: string;
  thumbContentType?: string;
  thumbBase64?: string;
};

const THUMB_TYPES = ["image/png", "image/jpeg"];
const THUMB_EXT = ["png", "jpg", "jpeg"];
const THUMB_MAX = 1024 * 1024;

export const addCustomPrize = createServerFn({ method: "POST" })
  .inputValidator((data: AddPrizeInput) => data)
  .handler(async ({ data }) => {
    if (!(await isTeacher())) return { error: "auth" as const };

    const category = (CATEGORIES as string[]).includes(data.category)
      ? data.category
      : (null as CollCategory | null);
    if (!category) return { error: "category" as const };
    const rule = PRIZE_FILE_RULES[category];
    const name = String(data.name ?? "").trim();
    if (!name) return { error: "name" as const };

    const ext = (data.fileName.split(".").pop() ?? "").toLowerCase();
    const typeOk = rule.types.includes((data.contentType ?? "").toLowerCase());
    if (!rule.ext.includes(ext) || !typeOk) return { error: "filetype" as const };

    let bytes: Uint8Array;
    try {
      const raw = atob(data.dataBase64);
      bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    } catch {
      return { error: "broken" as const };
    }
    if (!bytes.length) return { error: "broken" as const };
    if (bytes.length > rule.maxBytes) return { error: "toobig" as const };

    const id = `cx_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    const path = `${id}.${ext}`;
    const db = await admin();
    const up = await db.storage
      .from("prize-assets")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (up.error) return { error: "upload" as const };

    // サムネイルは「あれば使う」おまけ。失敗しても景品の登録は続ける。
    let thumbPath: string | null = null;
    if (data.thumbBase64 && data.thumbFileName) {
      const tExt = (data.thumbFileName.split(".").pop() ?? "").toLowerCase();
      const tType = (data.thumbContentType ?? "").toLowerCase();
      if (THUMB_EXT.includes(tExt) && THUMB_TYPES.includes(tType)) {
        try {
          const raw = atob(data.thumbBase64);
          const tBytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
          if (tBytes.length && tBytes.length <= THUMB_MAX) {
            const p = `${id}_thumb.${tExt}`;
            const upT = await db.storage
              .from("prize-assets")
              .upload(p, tBytes, { contentType: tType, upsert: false });
            if (!upT.error) thumbPath = p;
          }
        } catch {
          thumbPath = null;
        }
      }
    }

    const rarity = (RARITIES as string[]).includes(data.rarity) ? data.rarity : "N";
    const { error } = await db.from("custom_prizes").insert({
      id,
      name,
      category,
      rarity,
      asset_url: `/api/public/prize-asset/${path}`,
      thumb_url: thumbPath ? `/api/public/prize-asset/${thumbPath}` : null,
      description: String(data.description ?? "").slice(0, 200),
      obtainable: !!data.obtainable,
      sort: Number.isFinite(data.sort) ? Math.trunc(data.sort) : 100,
    });
    if (error) {
      await db.storage.from("prize-assets").remove([path]);
      return { error: "save" as const };
    }
    return { prizes: await readCustomPrizes() };
  });

export const updateCustomPrize = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; obtainable?: boolean; sort?: number }) => data)
  .handler(async ({ data }) => {
    if (!(await isTeacher())) return { error: "auth" as const };
    const db = await admin();
    const patch: { updated_at: string; obtainable?: boolean; sort?: number } = {
      updated_at: new Date().toISOString(),
    };
    if (typeof data.obtainable === "boolean") patch.obtainable = data.obtainable;
    if (typeof data.sort === "number" && Number.isFinite(data.sort))
      patch.sort = Math.trunc(data.sort);
    await db.from("custom_prizes").update(patch).eq("id", String(data.id));
    return { prizes: await readCustomPrizes() };
  });

export const removeCustomPrize = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data.id ?? "") }))
  .handler(async ({ data }) => {
    if (!(await isTeacher())) return { error: "auth" as const };
    const db = await admin();
    const { data: row } = await db
      .from("custom_prizes")
      .select("asset_url, thumb_url")
      .eq("id", data.id)
      .maybeSingle();
    await db.from("custom_prizes").delete().eq("id", data.id);
    const files = [row?.asset_url, row?.thumb_url]
      .map((u) => (u ? u.split("/").pop() : null))
      .filter((f): f is string => !!f);
    if (files.length) await db.storage.from("prize-assets").remove(files);
    return { prizes: await readCustomPrizes() };
  });
