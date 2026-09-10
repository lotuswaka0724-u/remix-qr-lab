import { useCallback, useEffect, useMemo, useState } from "react";

import { AvatarView, PetView, RoomView, type Equipped } from "@/components/AvatarView";
import { Button } from "@/components/ui/button";
import type { GameEngine, GameResult, Prize } from "@/lib/demo-game";
import { playError, playSuccess } from "@/lib/feedback";
import {
  AVATAR_SLOTS,
  CATEGORY_LABEL,
  ITEMS,
  ITEM_BY_ID,
  RARITY_META,
  STYLE_LABEL,
  itemsOf,
  type Category,
  type Item,
} from "@/lib/game-catalog";
import type { GameView } from "@/lib/game.functions";

export type GameScreenId = "avatar" | "gacha" | "pet" | "room" | "box";

export const GAME_MENU: { id: GameScreenId; label: string; icon: string; hint: string }[] = [
  { id: "avatar", label: "アバターをかえる", icon: "👤", hint: "かみがた・ふく・ぼうし" },
  { id: "gacha", label: "ガチャ", icon: "🎰", hint: "ポイントでアイテムGET" },
  { id: "pet", label: "ペット", icon: "🐾", hint: "えらんで きせかえ" },
  { id: "room", label: "マイルーム", icon: "🏠", hint: "かべ・ゆか・かぐ" },
  { id: "box", label: "アイテムBOX", icon: "🎒", hint: "もっているアイテム" },
];

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

const OPTIONAL_CATS: Category[] = ["hat", "glasses", "mask", "accessory", "hold"];

/* ============================ 状態のかたまり ============================ */

export function useGame(engine: GameEngine) {
  const [view, setView] = useState<GameView | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<Prize | null>(null);

  useEffect(() => {
    let off = false;
    setLoading(true);
    void engine
      .load()
      .then((v) => {
        if (!off) {
          setView(v);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      off = true;
    };
  }, [engine]);

  const apply = useCallback((v: GameResult) => {
    if (!v) return;
    setView(v);
    if (v.error === "limit") {
      setMsg("今日はここまで！また明日カスタマイズしよう！");
      playError();
    } else if (v.error === "points") {
      setMsg("ポイントがたりないよ。しゅくだいをがんばろう！");
      playError();
    } else if (v.error === "off") {
      setMsg("いまはガチャをおやすみ中です。");
    } else if (v.error === "notowned") {
      setMsg("このアイテムはまだもっていません。");
    } else {
      setMsg("");
    }
  }, []);

  const doCreate = useCallback(
    async (equipped: Record<string, string>) => {
      const v = await engine.create(equipped);
      if (v) {
        setView(v);
        playSuccess(1);
      }
    },
    [engine],
  );

  const doEquip = useCallback(
    async (item: Item, off: boolean) => {
      apply(await engine.equip(item.id, off));
    },
    [engine, apply],
  );

  const doDraw = useCallback(async () => {
    if (spinning) return;
    setSpinning(true);
    setPrize(null);
    const res = await engine.draw();
    window.setTimeout(() => {
      setSpinning(false);
      apply(res);
      if (res && res.prize) {
        setPrize(res.prize);
        playSuccess(1);
      }
    }, 1100);
  }, [engine, spinning, apply]);

  return { view, loading, msg, setMsg, spinning, prize, setPrize, doCreate, doEquip, doDraw, teacher: !!engine.teacher };
}

export type Game = ReturnType<typeof useGame>;

/* ============================ 部品 ============================ */

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
        active ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]" : "bg-muted hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}

function ItemCard({
  item,
  on,
  onClick,
  locked,
}: {
  item: Item;
  on: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={`relative flex flex-col items-center gap-1 rounded-2xl p-2 ring-2 transition-all disabled:opacity-40 ${
        on
          ? "bg-primary/10 ring-primary"
          : `bg-card ${RARITY_META[item.rarity].ring} hover:-translate-y-0.5`
      }`}
    >
      <span
        className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${RARITY_META[item.rarity].tone}`}
      >
        {item.rarity}
      </span>
      {on && (
        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-content-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          ✓
        </span>
      )}
      <ItemThumb itemId={item.id} size={72} />
      <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{item.name}</span>
    </button>
  );
}

/** 「つけない」カード（ぼうし・メガネなど はずせるカテゴリで使う） */
function NoneCard({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl p-2 ring-2 transition-all ${
        on ? "bg-primary/10 ring-primary" : "bg-card ring-border hover:-translate-y-0.5"
      }`}
    >
      <span className="grid h-[72px] w-[72px] place-content-center rounded-xl bg-muted text-3xl">🚫</span>
      <span className="text-[11px] font-bold">つけない</span>
    </button>
  );
}

function ScreenShell({
  title,
  icon,
  onBack,
  children,
  right,
}: {
  title: string;
  icon: string;
  onBack: () => void;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={onBack} className="rounded-full">
          ← もどる
        </Button>
        <h2 className="font-display text-lg font-bold">
          {icon} {title}
        </h2>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
      {children}
    </section>
  );
}

/* ============================ 初回アバター作成 ============================ */

export function AvatarCreate({ game }: { game: Game }) {
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
  const cat = CREATE_STEPS[step]!;
  const options = itemsOf(cat).filter((i) => i.isInitial || game.teacher);
  const optional = OPTIONAL_CATS.includes(cat);

  return (
    <section className="glass-panel space-y-4 p-5">
      <h2 className="text-center font-display text-xl font-bold">じぶんのアバターを作ろう！</h2>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="rounded-3xl bg-[linear-gradient(180deg,var(--secondary),transparent)] p-2">
          <AvatarView equipped={draft as Equipped} size={180} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 font-display text-base font-bold">
            {step + 1}／{CREATE_STEPS.length}　{CATEGORY_LABEL[cat]}をえらぼう
          </p>
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {optional && (
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => {
                    const n = { ...d };
                    delete n[cat];
                    return n;
                  })
                }
                className={`rounded-2xl px-3 py-2 text-sm font-bold ${
                  !draft[cat] ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                つけない
              </button>
            )}
            {options.map((o) => (
              <ItemCard key={o.id} item={o} on={draft[cat] === o.id} onClick={() => setDraft((d) => ({ ...d, [cat]: o.id }))} />
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
          <Button className="flex-1 rounded-full" onClick={() => void game.doCreate(draft)}>
            このアバターにする！
          </Button>
        )}
      </div>
    </section>
  );
}

/* ============================ 各画面 ============================ */

export function GameScreen({
  game,
  screen,
  onBack,
}: {
  game: Game;
  screen: GameScreenId;
  onBack: () => void;
}) {
  const view = game.view;
  if (!view) return <p className="p-6 text-center text-sm text-muted-foreground">よみこみ中…</p>;
  if (!view.data.created) return <AvatarCreate game={game} />;

  const equipped = view.data.equipped as Equipped;
  const has = (id: string) => game.teacher || view.data.owned.includes(id);
  const listOf = (cat: Category) =>
    (game.teacher ? itemsOf(cat) : view.data.owned.map((id) => ITEM_BY_ID[id]).filter((i): i is Item => !!i && i.category === cat));

  const pointsChip = (
    <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-sm font-bold text-primary tabular-nums">
      🪙 {view.points}pt
    </span>
  );
  const leftChip = (
    <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
      {game.teacher ? "先生モード：せいげんなし" : `きょうのきせかえ のこり ${view.customizeLeft}回`}
    </span>
  );

  const message = game.msg ? (
    <p className="rounded-2xl bg-primary/10 px-4 py-2 text-center font-bold text-primary">{game.msg}</p>
  ) : null;

  if (screen === "avatar") {
    return (
      <ScreenShell title="アバターをかえる" icon="👤" onBack={onBack} right={leftChip}>
        {message}
        <AvatarEditor game={game} equipped={equipped} listOf={listOf} onDone={onBack} />
      </ScreenShell>
    );
  }

  if (screen === "gacha") {
    return (
      <ScreenShell title="アイテムガチャ" icon="🎰" onBack={onBack} right={pointsChip}>
        {message}
        <GachaScreen game={game} view={view} />
      </ScreenShell>
    );
  }

  if (screen === "pet") {
    const pets = listOf("pet");
    const petItems = listOf("petItem");
    return (
      <ScreenShell title="ペット" icon="🐾" onBack={onBack} right={leftChip}>
        {message}
        <div className="glass-panel grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
          <div className="mx-auto grid place-content-center rounded-3xl bg-secondary/60 p-4">
            {view.data.pet ? (
              <PetView petId={view.data.pet} items={view.data.petItems} size={150} />
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">ガチャでペットをむかえよう！</p>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-bold text-muted-foreground">ペットをえらぶ</p>
              {pets.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {pets.map((p) => (
                    <ItemCard key={p.id} item={p} on={view.data.pet === p.id} onClick={() => void game.doEquip(p, view.data.pet === p.id)} locked={!has(p.id)} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">まだペットがいません。ガチャをまわそう！</p>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-muted-foreground">ペットのきせかえ</p>
              {petItems.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {petItems.map((p) => (
                    <ItemCard
                      key={p.id}
                      item={p}
                      on={view.data.petItems.includes(p.id)}
                      onClick={() => void game.doEquip(p, view.data.petItems.includes(p.id))}
                      locked={!has(p.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">まだアイテムがありません。</p>
              )}
            </div>
          </div>
        </div>
      </ScreenShell>
    );
  }

  if (screen === "room") {
    return (
      <ScreenShell title="マイルーム" icon="🏠" onBack={onBack} right={leftChip}>
        {message}
        <div className="glass-panel space-y-3 p-4">
          <RoomView
            wallpaper={view.data.room.wallpaper}
            floor={view.data.room.floor}
            furniture={view.data.room.furniture}
            equipped={equipped}
            petId={view.data.pet}
            petItems={view.data.petItems}
          />
          {(["wallpaper", "floor", "furniture"] as Category[]).map((cat) => {
            const list = listOf(cat);
            if (!list.length) return null;
            return (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-bold text-muted-foreground">
                  {CATEGORY_LABEL[cat]}
                  {cat === "furniture" && "（タップでおく／とりのぞく）"}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {list.map((o) => {
                    const on =
                      cat === "furniture"
                        ? view.data.room.furniture.includes(o.id)
                        : view.data.room[cat as "wallpaper" | "floor"] === o.id;
                    return <ItemCard key={o.id} item={o} on={on} onClick={() => void game.doEquip(o, on)} locked={!has(o.id)} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="アイテムBOX" icon="🎒" onBack={onBack} right={pointsChip}>
      {message}
      <ItemBox game={game} view={view} />
    </ScreenShell>
  );
}

/* ---------------- アバターカスタマイズ ---------------- */

function AvatarEditor({
  game,
  equipped,
  listOf,
  onDone,
}: {
  game: Game;
  equipped: Equipped;
  listOf: (cat: Category) => Item[];
  onDone: () => void;
}) {
  const [cat, setCat] = useState<Category>("hair");
  const list = listOf(cat);

  return (
    <div className="glass-panel grid gap-4 p-4 lg:grid-cols-[auto_1fr]">
      <div className="mx-auto text-center">
        <div className="rounded-3xl bg-[linear-gradient(180deg,var(--secondary),transparent)] p-2">
          <AvatarView equipped={equipped} size={210} />
        </div>
        <Button className="mt-3 w-full rounded-full" onClick={onDone}>
          これにする！
        </Button>
        <p className="mt-1 text-[11px] text-muted-foreground">えらぶと すぐ ほぞんされます</p>
      </div>
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_SLOTS.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {CATEGORY_LABEL[c]}
            </Chip>
          ))}
        </div>
        {OPTIONAL_CATS.includes(cat) && equipped[cat] && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              const item = ITEM_BY_ID[equipped[cat]!];
              if (item) void game.doEquip(item, true);
            }}
          >
            はずす
          </Button>
        )}
        {list.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((o) => (
              <ItemCard key={o.id} item={o} on={equipped[cat] === o.id} onClick={() => void game.doEquip(o, equipped[cat] === o.id && OPTIONAL_CATS.includes(cat))} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">このカテゴリのアイテムは まだもっていません。ガチャでGETしよう！</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- ガチャ ---------------- */

function GachaScreen({ game, view }: { game: Game; view: GameView }) {
  const cost = view.settings.itemGachaCost;
  const notEnough = view.points < cost;
  return (
    <div className="glass-panel p-5 text-center">
      <p className="font-display text-2xl font-bold text-primary tabular-nums">🪙 {view.points}pt</p>
      <p className="mt-1 text-xs text-muted-foreground">1かい {cost}pt</p>

      <div
        className={`mx-auto mt-5 grid h-36 w-36 place-content-center rounded-[2rem] bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-6xl text-primary-foreground shadow-[var(--shadow-lift)] ${
          game.spinning ? "animate-bounce" : ""
        }`}
      >
        {game.spinning ? "🎁" : "🎰"}
      </div>

      <Button
        className="mt-5 h-14 rounded-full px-10 text-lg"
        disabled={game.spinning || !view.settings.gachaOn || notEnough}
        onClick={() => void game.doDraw()}
      >
        ガチャを回す！（{cost}pt）
      </Button>
      {!view.settings.gachaOn && <p className="mt-2 text-xs text-muted-foreground">いまはガチャをおやすみ中です。</p>}
      {notEnough && view.settings.gachaOn && (
        <p className="mt-2 text-sm font-bold text-muted-foreground">
          ポイントが足りないよ（あと {cost - view.points}pt）
        </p>
      )}

      {game.prize && !game.spinning && (
        <div className={`mx-auto mt-5 max-w-sm rounded-3xl bg-card p-5 ring-4 ${RARITY_META[game.prize.rarity].ring}`}>
          <p className="font-display text-lg font-bold">🎉 アイテムGET！</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${RARITY_META[game.prize.rarity].tone}`}>
            {game.prize.rarity}
          </span>
          <p className="mt-2 font-display text-2xl font-bold">{game.prize.name}</p>
          <p className="text-xs text-muted-foreground">{game.prize.description}</p>
          <p className="mt-2 text-sm font-bold text-primary">
            {game.prize.duplicate ? "もっているアイテムでした！" : "アイテムBOXに入ったよ！"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- アイテムBOX ---------------- */

function ItemBox({ game, view }: { game: Game; view: GameView }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [onlyOwned, setOnlyOwned] = useState(!game.teacher);
  const cats = useMemo(() => Array.from(new Set(ITEMS.map((i) => i.category))), []);
  const list = useMemo(
    () =>
      ITEMS.filter(
        (i) => (cat === "all" || i.category === cat) && (!onlyOwned || game.teacher || view.data.owned.includes(i.id)),
      ),
    [cat, onlyOwned, view.data.owned, game.teacher],
  );
  const ownedCount = ITEMS.filter((i) => view.data.owned.includes(i.id)).length;

  const isOn = (id: string) =>
    Object.values(view.data.equipped).includes(id) ||
    view.data.pet === id ||
    view.data.petItems.includes(id) ||
    view.data.room.furniture.includes(id) ||
    view.data.room.wallpaper === id ||
    view.data.room.floor === id;

  return (
    <div className="glass-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary tabular-nums">
          {ownedCount} / {ITEMS.length} コンプリート
        </span>
        <button
          type="button"
          onClick={() => setOnlyOwned((v) => !v)}
          className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-bold hover:bg-secondary"
        >
          {onlyOwned ? "すべて表示" : "もっているものだけ"}
        </button>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
          style={{ width: `${(ownedCount / ITEMS.length) * 100}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["all", ...cats] as (Category | "all")[]).map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c === "all" ? "ぜんぶ" : CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {list.map((i) => {
          const owned = game.teacher || view.data.owned.includes(i.id);
          const on = isOn(i.id);
          return (
            <li key={i.id}>
              <button
                type="button"
                disabled={!owned}
                onClick={() => void game.doEquip(i, on && OPTIONAL_CATS.includes(i.category))}
                className={`h-full w-full rounded-2xl p-3 text-left text-xs ring-2 transition-all disabled:opacity-50 ${
                  on ? "bg-primary/10 ring-primary" : owned ? `bg-card ${RARITY_META[i.rarity].ring}` : "bg-muted/50 text-muted-foreground ring-transparent"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_META[i.rarity].tone}`}>{i.rarity}</span>
                  {on && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">そうび中</span>
                  )}
                </div>
                <p className="mt-1 font-bold leading-tight">{owned ? i.name : "？？？"}</p>
                <p className="text-[10px]">
                  {CATEGORY_LABEL[i.category]}・{STYLE_LABEL[i.style]}
                </p>
                <p className="mt-1 text-[10px] font-bold text-primary">
                  {owned ? (game.teacher ? "タップで試着" : "タップでそうび") : "みしゅとく"}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ============================ 先生用：デモの入れもの ============================ */

export function GameHub({ engine, onReset }: { engine: GameEngine; onReset?: () => void }) {
  const game = useGame(engine);
  const [screen, setScreen] = useState<GameScreenId | "home">("home");
  const view = game.view;

  if (game.loading) return <p className="p-6 text-center text-sm text-muted-foreground">よみこみ中…</p>;
  if (!view) return <p className="p-6 text-center text-sm text-muted-foreground">データがありません。</p>;
  if (!view.data.created) return <AvatarCreate game={game} />;

  if (screen !== "home") return <GameScreen game={game} screen={screen} onBack={() => setScreen("home")} />;

  return (
    <div className="space-y-3">
      <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <AvatarView equipped={view.data.equipped as Equipped} size={90} />
        <div className="mr-auto">
          <p className="font-display text-base font-bold">デモ用アバター</p>
          <p className="text-xs text-muted-foreground">児童のデータには保存されません</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-display text-sm font-bold text-primary tabular-nums">
          🪙 {view.points}pt
        </span>
        {onReset && (
          <Button variant="outline" size="sm" className="rounded-full" onClick={onReset}>
            デモを初期状態に戻す
          </Button>
        )}
      </div>
      <GameMenu onSelect={(id) => setScreen(id)} />
    </div>
  );
}

export function GameMenu({ onSelect }: { onSelect: (id: GameScreenId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {GAME_MENU.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(m.id)}
          className="glass-panel flex flex-col items-center gap-1 p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
        >
          <span className="text-4xl">{m.icon}</span>
          <span className="font-display text-sm font-bold">{m.label}</span>
          <span className="text-[11px] text-muted-foreground">{m.hint}</span>
        </button>
      ))}
    </div>
  );
}
