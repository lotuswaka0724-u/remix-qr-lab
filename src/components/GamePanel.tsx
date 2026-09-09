import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { AvatarView, PetView, RoomView, type Equipped } from "@/components/AvatarView";
import { Button } from "@/components/ui/button";
import { playError, playSuccess } from "@/lib/feedback";
import {
  CATEGORY_LABEL,
  ITEMS,
  ITEM_BY_ID,
  RARITY_META,
  STYLE_LABEL,
  itemsOf,
  type Category,
  type Item,
} from "@/lib/game-catalog";
import { createAvatar, drawItemGacha, equipItem, getGame, type GameView } from "@/lib/game.functions";

type Tab = "avatar" | "gacha" | "pet" | "room" | "box";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "avatar", label: "アバター", icon: "👤" },
  { id: "gacha", label: "ガチャ", icon: "🎰" },
  { id: "pet", label: "ペット", icon: "🐾" },
  { id: "room", label: "マイルーム", icon: "🏠" },
  { id: "box", label: "アイテムBOX", icon: "🎒" },
];

const RANK_FRAME: Record<string, string> = {
  NORMAL: "from-sky-100 to-blue-50 ring-sky-200",
  GOLD: "from-amber-100 to-yellow-50 ring-amber-300",
  BLACK: "from-slate-800 to-slate-700 ring-slate-500 text-slate-50",
};

const CREATE_STEPS: Category[] = [
  "face",
  "hair",
  "hairColor",
  "skin",
  "tops",
  "bottoms",
  "shoes",
  "glasses",
  "mask",
  "hat",
];

export function GamePanel({ rankHint }: { rankHint?: string }) {
  const fetchGame = useServerFn(getGame);
  const create = useServerFn(createAvatar);
  const equip = useServerFn(equipItem);
  const draw = useServerFn(drawItemGacha);

  const [view, setView] = useState<GameView | null>(null);
  const [tab, setTab] = useState<Tab>("avatar");
  const [msg, setMsg] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<
    { name: string; rarity: keyof typeof RARITY_META; description: string; duplicate: boolean } | null
  >(null);

  // 初回アバター作成の入力
  const [draft, setDraft] = useState<Record<string, string>>({
    face: "face_genki",
    hair: "hair_short",
    hairColor: "hc_black",
    skin: "skin_s1",
    tops: "tops_tee_blue",
    bottoms: "bottoms_pants",
    shoes: "shoes_basic",
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    void fetchGame({}).then((v) => setView(v));
  }, [fetchGame]);

  const apply = (v: (GameView & { error?: string }) | null) => {
    if (!v) return;
    setView(v);
    if (v.error === "limit") {
      setMsg("今日はここまで！また明日カスタマイズしよう！");
      playError();
    } else if (v.error === "points") {
      setMsg("ポイントがたりません。しゅくだいをがんばろう！");
      playError();
    } else if (v.error === "off") {
      setMsg("いまはガチャをおやすみ中です。");
    } else {
      setMsg("");
    }
  };

  if (!view) {
    return <p className="p-6 text-center text-sm text-muted-foreground">よみこみ中…</p>;
  }

  const rank = rankHint ?? view.rank;
  const equipped = view.data.equipped as Equipped;

  /* ---------- 初回アバター作成 ---------- */
  if (!view.data.created) {
    const cat = CREATE_STEPS[step]!;
    const options = itemsOf(cat).filter((i) => i.isInitial);
    const optional = ["glasses", "mask", "hat"].includes(cat);
    return (
      <section className="glass-panel space-y-4 p-5">
        <h2 className="text-center font-display text-xl font-bold">じぶんのアバターを作ろう！</h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="rounded-3xl bg-[linear-gradient(180deg,var(--secondary),transparent)] p-2">
            <AvatarView equipped={draft as Equipped} size={170} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-2 font-display text-base font-bold">
              {step + 1}／{CREATE_STEPS.length}　{CATEGORY_LABEL[cat]}をえらぼう
            </p>
            <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto">
              {optional && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => { const n = { ...d }; delete n[cat]; return n; })}
                  className={`rounded-2xl px-3 py-2 text-sm ${!draft[cat] ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  つけない
                </button>
              )}
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, [cat]: o.id }))}
                  className={`rounded-2xl px-3 py-2 text-sm font-bold transition-all ${
                    draft[cat] === o.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                  }`}
                >
                  {o.art["color"] && (
                    <span
                      className="mr-1 inline-block h-3 w-3 rounded-full align-middle ring-1 ring-black/10"
                      style={{ background: o.art["color"] }}
                    />
                  )}
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            もどる
          </Button>
          {step < CREATE_STEPS.length - 1 ? (
            <Button className="flex-1 rounded-full" onClick={() => setStep((s) => s + 1)}>
              つぎへ
            </Button>
          ) : (
            <Button
              className="flex-1 rounded-full"
              onClick={async () => {
                const v = await create({ data: { equipped: draft } });
                if (v) {
                  setView(v);
                  playSuccess(1);
                }
              }}
            >
              このアバターにする！
            </Button>
          )}
        </div>
      </section>
    );
  }

  const owned = (cat: Category) => view.data.owned.map((id) => ITEM_BY_ID[id]).filter((i): i is Item => !!i && i.category === cat);

  const onEquip = async (item: Item, off = false) => {
    apply(await equip({ data: { itemId: item.id, off } }));
  };

  const spin = async () => {
    if (spinning) return;
    setSpinning(true);
    setPrize(null);
    const res = await draw({});
    window.setTimeout(() => {
      setSpinning(false);
      apply(res);
      if (res && "prize" in res && res.prize) {
        setPrize(res.prize as never);
        playSuccess(1);
      }
    }, 1200);
  };

  return (
    <div className="space-y-3">
      <div className={`glass-panel flex flex-wrap items-center gap-2 bg-gradient-to-r p-3 ring-1 ${RANK_FRAME[rank]}`}>
        <span className="font-display text-sm font-bold">カードランク：{rank}</span>
        <span className="ml-auto rounded-full bg-background/70 px-3 py-1 font-display text-sm font-bold tabular-nums">
          🪙 {view.points}pt
        </span>
        <span className="rounded-full bg-background/70 px-3 py-1 text-xs">
          きょうのきせかえ のこり {view.customizeLeft}回
        </span>
      </div>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              tab === t.id ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]" : "bg-muted hover:bg-secondary"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {msg && (
        <p className="rounded-2xl bg-primary/10 px-4 py-2 text-center font-bold text-primary">{msg}</p>
      )}

      {tab === "avatar" && (
        <section className="glass-panel grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto rounded-3xl bg-[linear-gradient(180deg,var(--secondary),transparent)] p-2">
            <AvatarView equipped={equipped} size={190} />
          </div>
          <div className="space-y-3">
            {(["face", "hair", "hairColor", "skin", "tops", "bottoms", "shoes", "hat", "glasses", "mask", "accessory", "hold"] as Category[]).map(
              (cat) => {
                const list = owned(cat);
                if (!list.length) return null;
                return (
                  <div key={cat}>
                    <p className="mb-1 text-xs font-bold text-muted-foreground">{CATEGORY_LABEL[cat]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => void onEquip(o, equipped[cat] === o.id)}
                          className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                            equipped[cat] === o.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                          }`}
                        >
                          {o.name}
                          {equipped[cat] === o.id && " ✓"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </section>
      )}

      {tab === "gacha" && (
        <section className="glass-panel p-5 text-center">
          <h2 className="font-display text-lg font-bold">アイテムガチャ</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            1かい {view.settings.itemGachaCost}pt ／ もっているポイント {view.points}pt
          </p>
          <div
            className={`mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-5xl text-primary-foreground shadow-[var(--shadow-lift)] ${
              spinning ? "animate-spin" : ""
            }`}
          >
            {spinning ? "🎁" : "🎰"}
          </div>
          <Button
            className="mt-5 rounded-full px-8"
            disabled={spinning || !view.settings.gachaOn || view.points < view.settings.itemGachaCost}
            onClick={spin}
          >
            ガチャを引く（{view.settings.itemGachaCost}pt）
          </Button>
          {prize && !spinning && (
            <div
              className={`mx-auto mt-5 max-w-xs rounded-3xl p-4 ring-4 ${RARITY_META[prize.rarity].ring} bg-card`}
            >
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${RARITY_META[prize.rarity].tone}`}>
                {RARITY_META[prize.rarity].label}
              </span>
              <p className="mt-2 font-display text-xl font-bold">{prize.name}</p>
              <p className="text-xs text-muted-foreground">{prize.description}</p>
              <p className="mt-2 text-sm font-bold text-primary">
                {prize.duplicate ? "もっているアイテムでした！" : "アイテムBOXにはいったよ！"}
              </p>
            </div>
          )}
        </section>
      )}

      {tab === "pet" && (
        <section className="glass-panel grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto grid place-content-center rounded-3xl bg-secondary/60 p-4">
            {view.data.pet ? (
              <PetView petId={view.data.pet} items={view.data.petItems} size={140} />
            ) : (
              <p className="p-6 text-sm text-muted-foreground">ガチャでペットをむかえよう！</p>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">ペット</p>
              <div className="flex flex-wrap gap-1.5">
                {owned("pet").map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void onEquip(p, view.data.pet === p.id)}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                      view.data.pet === p.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
                {!owned("pet").length && <p className="text-xs text-muted-foreground">まだいません</p>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">ペットのアイテム</p>
              <div className="flex flex-wrap gap-1.5">
                {owned("petItem").map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => void onEquip(p, view.data.petItems.includes(p.id))}
                    className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                      view.data.petItems.includes(p.id) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
                {!owned("petItem").length && <p className="text-xs text-muted-foreground">まだありません</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "room" && (
        <section className="glass-panel space-y-3 p-4">
          <RoomView
            wallpaper={view.data.room.wallpaper}
            floor={view.data.room.floor}
            furniture={view.data.room.furniture}
            equipped={equipped}
            petId={view.data.pet}
            petItems={view.data.petItems}
          />
          {(["wallpaper", "floor", "furniture"] as Category[]).map((cat) => (
            <div key={cat}>
              <p className="mb-1 text-xs font-bold text-muted-foreground">{CATEGORY_LABEL[cat]}</p>
              <div className="flex flex-wrap gap-1.5">
                {owned(cat).map((o) => {
                  const on =
                    cat === "furniture"
                      ? view.data.room.furniture.includes(o.id)
                      : view.data.room[cat as "wallpaper" | "floor"] === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => void onEquip(o, on && cat !== "furniture" ? false : on)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        on ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                      }`}
                    >
                      {o.name}
                      {on && " ✓"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "box" && <ItemBox view={view} />}
    </div>
  );
}

function ItemBox({ view }: { view: GameView }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const list = useMemo(() => ITEMS.filter((i) => cat === "all" || i.category === cat), [cat]);
  const ownedCount = ITEMS.filter((i) => view.data.owned.includes(i.id)).length;

  return (
    <section className="glass-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-base font-bold">アイテムBOX</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary tabular-nums">
          {ownedCount} / {ITEMS.length} コンプリート
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
          style={{ width: `${(ownedCount / ITEMS.length) * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...new Set(ITEMS.map((i) => i.category))] as (Category | "all")[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              cat === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
            }`}
          >
            {c === "all" ? "ぜんぶ" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((i) => {
          const has = view.data.owned.includes(i.id);
          const on =
            view.data.equipped[i.category] === i.id ||
            view.data.pet === i.id ||
            view.data.petItems.includes(i.id) ||
            view.data.room.furniture.includes(i.id) ||
            view.data.room.wallpaper === i.id ||
            view.data.room.floor === i.id;
          return (
            <li
              key={i.id}
              className={`rounded-2xl p-3 text-xs ring-1 ${has ? `bg-card ${RARITY_META[i.rarity].ring}` : "bg-muted/50 text-muted-foreground ring-transparent"}`}
            >
              <div className="flex items-center gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_META[i.rarity].tone}`}>
                  {i.rarity}
                </span>
                {on && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">そうび中</span>}
              </div>
              <p className="mt-1 font-bold">{has ? i.name : "？？？"}</p>
              <p className="text-[10px]">
                {CATEGORY_LABEL[i.category]}・{STYLE_LABEL[i.style]}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
