import { useCallback, useEffect, useMemo, useState } from "react";

import { AvatarView, ItemThumb, PetView, RoomView, baseOf, type BaseKind, type Equipped } from "@/components/AvatarView";
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
  type Rarity,
} from "@/lib/game-catalog";
import type { GameView } from "@/lib/game.functions";

export type GameScreenId = "avatar" | "gacha" | "pet" | "room" | "box";

export const GAME_MENU: { id: GameScreenId; label: string; icon: string; hint: string }[] = [
  { id: "avatar", label: "アバター", icon: "🧑‍🎤", hint: "かみがた・ふく・ぼうし" },
  { id: "gacha", label: "ガチャ", icon: "🎰", hint: "ポイントでアイテムGET" },
  { id: "pet", label: "ペット", icon: "🐾", hint: "えらんで きせかえ" },
  { id: "room", label: "マイルーム", icon: "🛏️", hint: "かべ・ゆか・かぐ" },
  { id: "box", label: "アイテムBOX", icon: "🎁", hint: "もっているアイテム" },
];

const CREATE_STEPS: Category[] = [
  "body",
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

const RARITY_ORDER: Rarity[] = ["N", "R", "SR", "SSR"];

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
    }, 1400);
  }, [engine, spinning, apply]);

  return {
    view,
    loading,
    msg,
    setMsg,
    spinning,
    prize,
    setPrize,
    doCreate,
    doEquip,
    doDraw,
    teacher: !!engine.teacher,
  };
}

export type Game = ReturnType<typeof useGame>;

/* ============================ 小さな部品 ============================ */

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
        active
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
          : "bg-card text-secondary-foreground ring-1 ring-border hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

function RarityPips() {
  return (
    <div className="flex gap-1.5">
      {RARITY_ORDER.map((r) => (
        <span
          key={r}
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${RARITY_META[r].tone}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function ItemCard({
  item,
  on,
  onClick,
  locked,
  size = 76,
  base = "boy",
}: {
  item: Item;
  on: boolean;
  onClick: () => void;
  locked?: boolean;
  size?: number;
  base?: BaseKind;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      className={`kid-tile relative flex flex-col items-center gap-1 p-2 ${
        on ? "kid-tile-on" : `bg-card ring-2 ${RARITY_META[item.rarity].ring}`
      } disabled:opacity-40`}
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
      <ItemThumb itemId={item.id} size={size} base={base} />
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
      className={`kid-tile flex flex-col items-center gap-1 p-2 ${
        on ? "kid-tile-on" : "bg-card ring-2 ring-border"
      }`}
    >
      <span className="grid h-[76px] w-[76px] place-content-center rounded-2xl bg-muted text-3xl">🚫</span>
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
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-card px-4 py-2 text-sm font-bold ring-1 ring-border transition-all hover:-translate-y-0.5"
        >
          ← もどる
        </button>
        <h2 className="rounded-full bg-card px-4 py-2 font-display text-lg font-bold ring-1 ring-border">
          {icon} {title}
        </h2>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </div>
      {children}
    </section>
  );
}

export function PointChip({ points }: { points: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] px-4 py-2 font-display text-sm font-bold text-primary-foreground shadow-[var(--shadow-lift)] tabular-nums">
      🪙 ポイント {points.toLocaleString()} pt
    </span>
  );
}

/* ============================ 初回アバター作成 ============================ */

export function AvatarCreate({ game }: { game: Game }) {
  const [draft, setDraft] = useState<Record<string, string>>({
    body: "body_boy",
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
    <section className="kid-panel space-y-4 p-5">
      <h2 className="text-center font-display text-2xl font-bold">✨ じぶんのアバターを作ろう！</h2>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="kid-stage p-3">
          <AvatarView equipped={draft as Equipped} size={200} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-2 font-display text-base font-bold">
            {step + 1}／{CREATE_STEPS.length}　{CATEGORY_LABEL[cat]}をえらぼう
          </p>
          <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {optional && (
              <NoneCard
                on={!draft[cat]}
                onClick={() =>
                  setDraft((d) => {
                    const n = { ...d };
                    delete n[cat];
                    return n;
                  })
                }
              />
            )}
            {options.map((o) => (
              <ItemCard
                key={o.id}
                item={o}
                base={baseOf(draft as Equipped)}
                on={draft[cat] === o.id}
                onClick={() => setDraft((d) => ({ ...d, [cat]: o.id }))}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          もどる
        </Button>
        {step < CREATE_STEPS.length - 1 ? (
          <Button className="h-14 flex-1 rounded-full text-lg" onClick={() => setStep((s) => s + 1)}>
            つぎへ →
          </Button>
        ) : (
          <Button className="h-14 flex-1 rounded-full text-lg" onClick={() => void game.doCreate(draft)}>
            これにする！
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
    game.teacher
      ? itemsOf(cat)
      : view.data.owned.map((id) => ITEM_BY_ID[id]).filter((i): i is Item => !!i && i.category === cat);

  const pointsChip = <PointChip points={view.points} />;
  const leftChip = (
    <span className="rounded-full bg-card px-3 py-2 text-xs font-bold ring-1 ring-border">
      {game.teacher ? "先生モード：せいげんなし" : `今日のカスタマイズ のこり ${view.customizeLeft}回`}
    </span>
  );

  const message = game.msg ? (
    <p className="rounded-2xl bg-primary/10 px-4 py-2 text-center font-bold text-primary">{game.msg}</p>
  ) : null;

  if (screen === "avatar") {
    return (
      <ScreenShell title="アバターをつくろう！" icon="🧑‍🎤" onBack={onBack} right={leftChip}>
        {message}
        <AvatarEditor game={game} equipped={equipped} listOf={listOf} onDone={onBack} />
      </ScreenShell>
    );
  }

  if (screen === "gacha") {
    return (
      <ScreenShell title="アイテムガチャ" icon="🎁" onBack={onBack} right={pointsChip}>
        {message}
        <GachaScreen game={game} view={view} />
      </ScreenShell>
    );
  }

  if (screen === "pet") {
    return (
      <ScreenShell title="ペット" icon="🐾" onBack={onBack} right={leftChip}>
        {message}
        <PetScreen game={game} view={view} listOf={listOf} has={has} />
      </ScreenShell>
    );
  }

  if (screen === "room") {
    return (
      <ScreenShell title="マイルーム" icon="🛏️" onBack={onBack} right={leftChip}>
        {message}
        <RoomScreen game={game} view={view} equipped={equipped} listOf={listOf} has={has} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="アイテムBOX" icon="🎁" onBack={onBack} right={pointsChip}>
      {message}
      <ItemBox game={game} view={view} />
    </ScreenShell>
  );
}

/* ---------------- アバターカスタマイズ ---------------- */

const EDITOR_TABS: { cat: Category; label: string; icon: string }[] = [
  { cat: "body", label: "せいべつ", icon: "🧍" },
  { cat: "face", label: "かお", icon: "😀" },
  { cat: "hair", label: "かみ", icon: "💇" },
  { cat: "hairColor", label: "かみいろ", icon: "🎨" },
  { cat: "skin", label: "はだ", icon: "🖐️" },
  { cat: "tops", label: "トップス", icon: "👕" },
  { cat: "bottoms", label: "ボトムス", icon: "👖" },
  { cat: "shoes", label: "くつ", icon: "👟" },
  { cat: "hat", label: "ぼうし", icon: "🧢" },
  { cat: "glasses", label: "メガネ", icon: "👓" },
  { cat: "mask", label: "マスク", icon: "😷" },
  { cat: "accessory", label: "アクセ", icon: "🎀" },
  { cat: "hold", label: "もちもの", icon: "🎒" },
];

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
  const [cat, setCat] = useState<Category>("body");
  const [draft, setDraft] = useState<Equipped>(equipped);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const sig = JSON.stringify(equipped);

  useEffect(() => {
    if (saving) return;
    setDraft(JSON.parse(sig) as Equipped);
  }, [sig, saving]);

  const list = listOf(cat);
  const dirty = useMemo(
    () => AVATAR_SLOTS.some((c) => (draft[c] ?? "") !== (equipped[c] ?? "")),
    [draft, equipped],
  );

  const pick = (item: Item) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [item.category]: item.id }));
  };
  const clear = () => {
    setSaved(false);
    setDraft((d) => {
      const n = { ...d };
      delete n[cat];
      return n;
    });
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const target = draft;
    for (const c of AVATAR_SLOTS) {
      const before = equipped[c] ?? "";
      const after = target[c] ?? "";
      if (before === after) continue;
      const item = ITEM_BY_ID[after || before];
      if (item) await game.doEquip(item, !after);
    }
    setSaving(false);
    setSaved(true);
    playSuccess(1);
  };

  return (
    <div className="kid-panel grid gap-3 p-3 sm:p-4 lg:grid-cols-[104px_minmax(240px,1fr)_minmax(280px,1.15fr)]">
      {/* カテゴリー（左のたて並び／スマホは横スクロール） */}
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:max-h-[30rem] lg:flex-col lg:overflow-y-auto lg:px-0">
        {EDITOR_TABS.map((t) => (
          <button
            key={t.cat}
            type="button"
            onClick={() => setCat(t.cat)}
            className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-[12px] font-bold transition-all lg:w-full ${
              cat === t.cat
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                : "bg-card ring-1 ring-border hover:-translate-y-0.5"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* 中央（大きなアバター） */}
      <div className="flex flex-col items-center">
        <div className="kid-stage relative w-full p-3">
          <span className="kid-sparkle" aria-hidden>
            ✨
          </span>
          <div className="flex justify-center">
            <AvatarView equipped={draft} size={300} />
          </div>
        </div>
        <div className="mt-3 flex w-full flex-col gap-2">
          <Button className="h-14 w-full rounded-full text-lg" disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? "ほぞん中…" : "これにする！"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              disabled={!dirty || saving}
              onClick={() => setDraft(JSON.parse(sig) as Equipped)}
            >
              もとにもどす
            </Button>
            <Button variant="ghost" className="flex-1 rounded-full" onClick={onDone}>
              ホームへ
            </Button>
          </div>
          {saved && !dirty && (
            <p className="rounded-2xl bg-primary/10 px-3 py-2 text-center font-display font-bold text-primary">
              ✨ アバターを ほぞんしたよ！
            </p>
          )}
          {dirty && (
            <p className="text-center text-[11px] text-muted-foreground">
              いまは しちゃく中です。「これにする！」で きまります。
            </p>
          )}
        </div>
      </div>

      {/* アイテム選び */}
      <div className="min-w-0">
        <p className="mb-2 font-display text-sm font-bold">{CATEGORY_LABEL[cat]}をえらぶ</p>
        {list.length ? (
          <div className="grid max-h-[28rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            {OPTIONAL_CATS.includes(cat) && <NoneCard on={!draft[cat]} onClick={clear} />}
            {list.map((o) => (
              <ItemCard
                key={o.id}
                item={o}
                base={baseOf(draft)}
                on={draft[cat] === o.id}
                onClick={() => pick(o)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
            このカテゴリのアイテムは まだもっていません。ガチャでGETしよう！
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- ガチャ ---------------- */

function GachaMachine({ spinning }: { spinning: boolean }) {
  const balls = [
    { x: 52, y: 60, c: "#7dd3fc" },
    { x: 78, y: 52, c: "#fca5a5" },
    { x: 104, y: 62, c: "#fcd34d" },
    { x: 62, y: 84, c: "#c4b5fd" },
    { x: 90, y: 80, c: "#86efac" },
    { x: 112, y: 90, c: "#f9a8d4" },
    { x: 74, y: 104, c: "#fdba74" },
    { x: 100, y: 108, c: "#93c5fd" },
  ];
  return (
    <svg
      viewBox="0 0 160 200"
      width="180"
      height="225"
      role="img"
      aria-label="ガチャマシン"
      className={spinning ? "fx-shake" : ""}
    >
      <ellipse cx="80" cy="190" rx="52" ry="8" fill="#0f172a" opacity="0.08" />
      <circle cx="80" cy="82" r="58" fill="#ffffff" opacity="0.9" />
      <circle cx="80" cy="82" r="58" fill="none" stroke="#bae6fd" strokeWidth="4" />
      {balls.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r="12" fill={b.c} />
      ))}
      <ellipse cx="60" cy="52" rx="16" ry="10" fill="#ffffff" opacity="0.6" />
      <rect x="22" y="132" width="116" height="56" rx="14" fill="#60a5fa" />
      <rect x="22" y="132" width="116" height="16" rx="8" fill="#3b82f6" />
      <circle cx="80" cy="158" r="14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" />
      <rect x="58" y="172" width="44" height="12" rx="5" fill="#1d4ed8" opacity="0.7" />
      <text x="80" y="20" textAnchor="middle" fontSize="18">
        ⭐
      </text>
    </svg>
  );
}

function GachaScreen({ game, view }: { game: Game; view: GameView }) {
  const cost = view.settings.itemGachaCost;
  const notEnough = view.points < cost;
  const prize = game.prize;

  return (
    <div className="kid-panel grid gap-4 p-4 sm:p-6 lg:grid-cols-[auto_1fr]">
      <div className="mx-auto grid place-items-center rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,color-mix(in_oklab,var(--accent)_28%,transparent),transparent_70%)] p-3">
        <GachaMachine spinning={game.spinning} />
      </div>

      <div className="space-y-4">
        <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_16%,transparent),color-mix(in_oklab,var(--accent)_18%,transparent))] p-4">
          <p className="font-display text-xl font-bold text-primary">かわいい・かっこいい コーデガチャ</p>
          <p className="mt-1 text-sm text-muted-foreground">
            ふく・ぼうし・アクセサリー・ペットが 手に入るよ！
          </p>
          <div className="mt-3">
            <RarityPips />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-3xl bg-card px-5 py-3 text-center ring-1 ring-border">
            <p className="text-xs font-bold text-muted-foreground">1かい</p>
            <p className="font-display text-2xl font-bold text-primary tabular-nums">{cost} pt</p>
          </div>
          <PointChip points={view.points} />
        </div>

        <Button
          className="h-16 w-full rounded-full text-xl"
          disabled={game.spinning || !view.settings.gachaOn || notEnough}
          onClick={() => void game.doDraw()}
        >
          {game.spinning ? "まわしています…" : "🎉 ガチャを回す！"}
        </Button>
        {!view.settings.gachaOn && (
          <p className="text-center text-sm text-muted-foreground">いまはガチャをおやすみ中です。</p>
        )}
        {notEnough && view.settings.gachaOn && (
          <p className="text-center text-sm font-bold text-muted-foreground">
            ポイントが足りないよ（あと {cost - view.points}pt）
          </p>
        )}
      </div>

      {prize && !game.spinning && (
        <div className="fixed inset-0 z-50 grid place-content-center bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="fx-popin relative w-[min(92vw,26rem)] overflow-hidden rounded-[2rem] bg-card p-6 text-center shadow-[var(--shadow-lift)]">
            <div className="fx-rays pointer-events-none absolute inset-0 opacity-40" aria-hidden />
            <span className="relative inline-block rounded-full bg-destructive px-4 py-1 font-display text-sm font-bold text-destructive-foreground">
              NEW
            </span>
            <div className="relative mx-auto mt-4 grid place-content-center">
              <ItemThumb itemId={prize.id} size={140} />
            </div>
            <span
              className={`relative mt-3 inline-block rounded-full px-4 py-1 text-sm font-bold ${RARITY_META[prize.rarity].tone}`}
            >
              {prize.rarity}
            </span>
            <p className="relative mt-2 font-display text-2xl font-bold">{prize.name}</p>
            <p className="relative mt-1 text-sm text-muted-foreground">{prize.description}</p>
            <p className="relative mt-2 text-sm font-bold text-primary">
              {prize.duplicate ? "もっているアイテムでした！" : "アイテムBOXに 入ったよ！"}
            </p>
            <Button
              className="relative mt-5 h-12 w-40 rounded-full text-lg"
              onClick={() => game.setPrize(null)}
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- ペット ---------------- */

function PetScreen({
  game,
  view,
  listOf,
  has,
}: {
  game: Game;
  view: GameView;
  listOf: (cat: Category) => Item[];
  has: (id: string) => boolean;
}) {
  const [tab, setTab] = useState<"pet" | "petItem">("pet");
  const list = listOf(tab);
  const pets = listOf("pet");

  return (
    <div className="kid-panel grid gap-4 p-4 lg:grid-cols-[auto_1fr]">
      <div className="space-y-3">
        <div className="kid-stage grid place-content-center p-4">
          {view.data.pet ? (
            <PetView petId={view.data.pet} items={view.data.petItems} size={180} />
          ) : (
            <p className="p-10 text-center text-sm text-muted-foreground">ガチャでペットを むかえよう！</p>
          )}
        </div>
        <div className="flex gap-2">
          {(
            [
              { id: "pet", label: "ペット", icon: "🐾" },
              { id: "petItem", label: "ペットのふく", icon: "🎀" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm font-bold transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0">
        <p className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
          {CATEGORY_LABEL[tab]}をえらぶ
          <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs">
            もっているペット {pets.length}
          </span>
        </p>
        {list.length ? (
          <div className="grid max-h-[26rem] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
            {list.map((p) => {
              const on = tab === "pet" ? view.data.pet === p.id : view.data.petItems.includes(p.id);
              return (
                <ItemCard key={p.id} item={p} on={on} onClick={() => void game.doEquip(p, on)} locked={!has(p.id)} />
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
            まだアイテムがありません。ガチャをまわそう！
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- マイルーム ---------------- */

function RoomScreen({
  game,
  view,
  equipped,
  listOf,
  has,
}: {
  game: Game;
  view: GameView;
  equipped: Equipped;
  listOf: (cat: Category) => Item[];
  has: (id: string) => boolean;
}) {
  const [tab, setTab] = useState<Category>("wallpaper");
  const list = listOf(tab);

  return (
    <div className="kid-panel space-y-3 p-4">
      <div className="overflow-hidden rounded-[1.75rem] ring-1 ring-border">
        <RoomView
          wallpaper={view.data.room.wallpaper}
          floor={view.data.room.floor}
          furniture={view.data.room.furniture}
          equipped={equipped}
          petId={view.data.pet}
          petItems={view.data.petItems}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {(["wallpaper", "floor", "furniture"] as Category[]).map((c) => (
          <Chip key={c} active={tab === c} onClick={() => setTab(c)}>
            {CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {tab === "furniture" ? "タップで おく／とりのぞく" : "タップで きりかえ"}
      </p>
      {list.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {list.map((o) => {
            const on =
              tab === "furniture"
                ? view.data.room.furniture.includes(o.id)
                : view.data.room[tab as "wallpaper" | "floor"] === o.id;
            return <ItemCard key={o.id} item={o} on={on} onClick={() => void game.doEquip(o, on)} locked={!has(o.id)} />;
          })}
        </div>
      ) : (
        <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
          まだアイテムがありません。ガチャをまわそう！
        </p>
      )}
    </div>
  );
}

/* ---------------- アイテムBOX ---------------- */

const BOX_ICON: Partial<Record<Category, string>> = {
  body: "🧍",
  face: "😀",
  hair: "💇",
  hairColor: "🎨",
  skin: "🖐️",
  tops: "👕",
  bottoms: "👖",
  shoes: "👟",
  hat: "🧢",
  glasses: "👓",
  mask: "😷",
  accessory: "🎀",
  hold: "🎒",
  pet: "🐾",
  petItem: "🦴",
  wallpaper: "🖼️",
  floor: "🟫",
  furniture: "🪑",
};

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
    <div className="kid-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary tabular-nums">
          {ownedCount} / {ITEMS.length} コンプリート
        </span>
        <button
          type="button"
          onClick={() => setOnlyOwned((v) => !v)}
          className="ml-auto rounded-full bg-card px-3 py-1 text-xs font-bold ring-1 ring-border"
        >
          {onlyOwned ? "すべて表示" : "もっているものだけ"}
        </button>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all"
          style={{ width: `${(ownedCount / ITEMS.length) * 100}%` }}
        />
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {(["all", ...cats] as (Category | "all")[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-1.5 text-[11px] font-bold transition-all ${
              cat === c ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border"
            }`}
          >
            <span className="text-lg">{c === "all" ? "🌈" : (BOX_ICON[c] ?? "📦")}</span>
            {c === "all" ? "すべて" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
        {list.map((i) => {
          const owned = game.teacher || view.data.owned.includes(i.id);
          const on = isOn(i.id);
          return (
            <li key={i.id}>
              <button
                type="button"
                disabled={!owned}
                onClick={() => void game.doEquip(i, on && OPTIONAL_CATS.includes(i.category))}
                className={`kid-tile relative flex h-full w-full flex-col items-center gap-1 p-2 ${
                  on
                    ? "kid-tile-on"
                    : owned
                      ? `bg-card ring-2 ${RARITY_META[i.rarity].ring}`
                      : "bg-muted/50 text-muted-foreground ring-2 ring-transparent"
                } disabled:opacity-70`}
              >
                <span
                  className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${RARITY_META[i.rarity].tone}`}
                >
                  {i.rarity}
                </span>
                {on && (
                  <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                    そうび中
                  </span>
                )}
                <span className={owned ? "" : "opacity-30 grayscale"}>
                  <ItemThumb itemId={i.id} size={76} />
                </span>
                <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">
                  {owned ? i.name : "？？？"}
                </span>
                <span className="text-[10px] text-muted-foreground">{STYLE_LABEL[i.style]}</span>
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
      <div className="kid-panel flex flex-wrap items-center gap-3 p-4">
        <AvatarView equipped={view.data.equipped as Equipped} size={100} />
        <div className="mr-auto">
          <p className="font-display text-base font-bold">デモ用アバター</p>
          <p className="text-xs text-muted-foreground">児童のデータには保存されません</p>
        </div>
        <PointChip points={view.points} />
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
          className="kid-panel flex flex-col items-center gap-1 p-4 text-center transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
        >
          <span className="grid h-14 w-14 place-content-center rounded-2xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_18%,transparent),color-mix(in_oklab,var(--accent)_22%,transparent))] text-3xl">
            {m.icon}
          </span>
          <span className="font-display text-sm font-bold">{m.label}</span>
          <span className="text-[11px] text-muted-foreground">{m.hint}</span>
        </button>
      ))}
    </div>
  );
}
