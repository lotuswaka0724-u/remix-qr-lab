import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import CollectionFx from "@/components/CollectionFx";
import CollectionBackdrop from "@/components/CollectionBackdrop";
import CollectionIcon from "@/components/CollectionIcon";
import gachaStage from "@/assets/collection/gacha-stage.jpg";
import { Button } from "@/components/ui/button";
import {
  backgroundCss,
  COLL_CATEGORIES,
  COLL_CATEGORY_ICON,
  COLL_CATEGORY_LABEL,
  COLL_ITEMS,
  COLL_RARITY_META,
  COLL_RARITY_ORDER,
  collItemsOf,
  effectFx,
  fxImage,
  soundAsset,
  soundTune,
  tuneAsset,
  type CollCategory,
  type CollItem,
} from "@/lib/collection-catalog";
import {
  drawCollGacha,
  equipCollItem,
  getCollection,
  type CollPrize,
  type CollView,
} from "@/lib/collection.functions";
import {
  playCollectionSound,
  playError,
  playGachaEject,
  playGachaOpen,
  playGachaPress,
  playGachaSpin,
  previewCollectionSound,
} from "@/lib/feedback";
import { useCustomPrizes } from "@/lib/use-custom-prizes";

type Screen = "gacha" | "collection";
type GachaPhase =
  | "idle"
  | "press"
  | "spinning"
  | "suspense"
  | "eject"
  | "opening"
  | "result";

const waitFor = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function prizeTune(rarity: CollPrize["rarity"]) {
  if (rarity === "BLACK") return "black";
  if (rarity === "GOLD") return "gold";
  if (rarity === "SSR") return "levelup";
  if (rarity === "N") return "pico";
  return "fanfare";
}

function prizeFx(rarity: CollPrize["rarity"]) {
  if (rarity === "BLACK") return "black";
  if (rarity === "GOLD") return "gold";
  if (rarity === "SSR" || rarity === "SR") return "starfall";
  return rarity === "R" ? "confetti" : "glitter";
}

export function useCollection() {
  const load = useServerFn(getCollection);
  const draw = useServerFn(drawCollGacha);
  const equip = useServerFn(equipCollItem);
  const [view, setView] = useState<CollView | null>(null);
  const [loading, setLoading] = useState(true);
  // 先生が登録した景品もアイテム一覧に合流させる
  const custom = useCustomPrizes();

  useEffect(() => {
    let off = false;
    void load({})
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
  }, [load]);

  return { view, setView, loading: loading || !custom.ready, draw, equip };
}

export type CollectionApi = ReturnType<typeof useCollection>;

function ItemArt({ item, size = 56 }: { item: CollItem; size?: number }) {
  // 一覧ではサムネイルがあればそれを、なければ本体の画像を出す
  const preview = item.thumb ?? item.image ?? null;
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [preview]);

  if (item.category === "background")
    return (
      <span className="relative block overflow-hidden rounded-xl bg-muted" style={{ width: size, height: size }}>
        <CollectionBackdrop backgroundId={item.id} preview />
      </span>
    );
  if (item.category === "frame")
    return <CollectionIcon iconId="ic_cat" frameId={item.id} size={size} preview />;
  if (item.category === "icon") return <CollectionIcon iconId={item.id} size={size} />;
  return (
    <span
      className="grid place-content-center rounded-xl bg-muted"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {preview && !broken ? (
        <img
          src={preview}
          alt=""
          className="h-full w-full rounded-xl object-contain"
          onError={() => setBroken(true)}
        />
      ) : item.category === "sound" ? (
        "🔔"
      ) : (
        "✨"
      )}
    </span>
  );
}

/** 表示だけの並びかえ（データは書きかえない）。同じ順位のときは今までの並びのまま */
function sortItems(items: CollItem[], by: "rarity" | "owned", owned: string[]): CollItem[] {
  const key = (item: CollItem) =>
    by === "rarity"
      ? COLL_RARITY_ORDER.indexOf(item.rarity)
      : owned.indexOf(item.id) < 0
        ? Number.MAX_SAFE_INTEGER
        : owned.indexOf(item.id);
  return items
    .map((item, i) => ({ item, i, k: key(item) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map((e) => e.item);
}

export default function CollectionPanel({ api, screen }: { api: CollectionApi; screen: Screen }) {
  const { view, setView, loading, draw, equip } = api;
  const [busy, setBusy] = useState(false);
  const [prize, setPrize] = useState<CollPrize | null>(null);
  const [msg, setMsg] = useState("");
  const [cat, setCat] = useState<CollCategory>("icon");
  const [sortBy, setSortBy] = useState<"rarity" | "owned">("rarity");
  const [fxPlay, setFxPlay] = useState<{ fx: string; id: number; image?: string | null } | null>(
    null,
  );
  const [phase, setPhase] = useState<GachaPhase>("idle");
  const [spinHard, setSpinHard] = useState(false);

  const owned = useMemo(() => view?.coll.owned ?? [], [view?.coll.owned]);
  const equipped = view?.coll.equipped ?? {};

  const progress = useMemo(
    () => ({
      have: owned.filter((id) => COLL_ITEMS.some((i) => i.id === id)).length,
      all: COLL_ITEMS.length,
    }),
    [owned],
  );

  if (loading) return <p className="p-6 text-center text-sm text-muted-foreground">よみこみ中…</p>;
  if (!view) return null;

  const onDraw = async () => {
    // 連打防止：演出中・結果表示中は、いちども抽選しない
    if (busy) return;
    setBusy(true);
    setMsg("");
    setPrize(null);

    // ① ボタンを押した（0〜0.2秒）
    setPhase("press");
    playGachaPress();
    const started = Date.now();
    // 抽選は1回だけ。結果は演出に渡すだけで、あとから変わらない。
    const drawing = draw({}).catch(() => "failed" as const);
    await waitFor(200);

    // ② 抽選中（装置がうごく。動きはだんだん強くなる）
    setSpinHard(false);
    setPhase("spinning");
    playGachaSpin(1200);
    const ramp = window.setTimeout(() => setSpinHard(true), 700);
    const res = await drawing;
    const spinWait = Math.max(0, 1600 - (Date.now() - started));
    if (spinWait) await waitFor(spinWait);
    window.clearTimeout(ramp);
    setSpinHard(false);

    if (res === "failed") {
      setBusy(false);
      setPhase("idle");
      setMsg("ガチャを まわせませんでした");
      playError();
      return;
    }
    if (!res) {
      setBusy(false);
      setPhase("idle");
      return;
    }
    setView(res);
    if ("error" in res && res.error) {
      setBusy(false);
      setPhase("idle");
      playError();
      setMsg(res.error === "points" ? "ポイントが たりません" : "いまはガチャができません");
      return;
    }
    if ("prize" in res && res.prize) {
      const p = res.prize;
      // ③ 結果直前の停止・ため
      setPhase("suspense");
      await waitFor(p.rarity === "BLACK" ? 520 : p.rarity === "GOLD" ? 440 : 320);

      // ④ カプセル排出（排出口 → 中央）
      setPhase("eject");
      playGachaEject();
      await waitFor(760);

      // ⑤ カプセルがひらく
      setPhase("opening");
      playGachaOpen();
      const rank = p.rarity === "BLACK" ? "BLACK" : p.rarity === "GOLD" ? "GOLD" : "NORMAL";
      await waitFor(420);

      // ⑥ 景品出現・光の演出・獲得音を同じタイムラインで開始する。
      const tune = prizeTune(p.rarity);
      const fx = prizeFx(p.rarity);
      setPrize(p);
      setPhase("result");
      setFxPlay({ fx, id: Date.now(), image: fxImage(fx) });
      playCollectionSound(tune, rank, tuneAsset(tune));
    }
  };

  const closeResult = (showInBox = false) => {
    if (showInBox && prize) setCat(prize.category);
    setPrize(null);
    setPhase("idle");
    setBusy(false);
  };

  const onEquip = async (item: CollItem) => {
    if (!owned.includes(item.id) || busy) return;
    setBusy(true);
    const res = await equip({ data: { itemId: item.id } });
    setBusy(false);
    if (res) setView(res);
    if (item.category === "sound")
      playCollectionSound(soundTune(item.id), view.rank, item.asset ?? soundAsset(item.id));
    if (item.category === "effect")
      setFxPlay({
        fx: effectFx(item.id) ?? "spark",
        id: Date.now(),
        image: item.image ?? null,
      });
  };

  // 装置のうごき：押す → ゆっくり → だんだん強く → 一瞬とまる
  const machineClass =
    phase === "press"
      ? "gacha-machine-press"
      : phase === "spinning"
        ? spinHard
          ? "gacha-machine-spin-hard"
          : "gacha-machine-spin"
        : phase === "suspense"
          ? "gacha-machine-suspense"
          : "";

  const gacha = (
    <section className="gacha-panel space-y-4 p-4 text-center sm:p-5">
      <div className="gacha-heading">
        <span className="gacha-heading-mark" aria-hidden>✦</span>
        <h2 className="font-display text-lg font-bold">コレクションガチャ</h2>
        <span className="gacha-heading-mark" aria-hidden>✦</span>
      </div>
      <p className="gacha-points font-display text-4xl font-bold tabular-nums">
        {view.points}
        <span className="ml-1 text-base">pt</span>
      </p>
      <p className="text-xs text-muted-foreground">
        1かい {view.cost}pt ／ あつめた {progress.have} / {progress.all} こ
      </p>
      <div className={`gacha-stage gacha-stage-${phase}`} aria-live="polite">
        <img className="gacha-stage-scene" src={gachaStage} alt="" width={1536} height={1024} />
        <span className="gacha-stage-grid" aria-hidden />
        <span className="gacha-stage-sparkles" aria-hidden />
        <div
          className={`gacha-machine ${machineClass}`}
          style={phase === "eject" || phase === "opening" ? { opacity: 0.92 } : undefined}
        >
          <img src="/prizes/gacha/machine.png" alt="ガチャマシン" width={1024} height={1024} />
          <span className="gacha-machine-glow" aria-hidden />
          <span className="gacha-inner-capsule" aria-hidden />
        </div>
        {phase === "eject" && (
          <div className="gacha-capsule-out" aria-label="カプセルが出ました">
            <img src="/prizes/gacha/capsule.png" alt="" width={1024} height={1024} />
          </div>
        )}
        {phase === "opening" && (
          <>
            <div className="gacha-stage-burst" aria-hidden>
              <img src="/prizes/gacha/burst.png" alt="" width={1024} height={1024} />
            </div>
            <span className="gacha-capsule-shell gacha-shell-top" aria-hidden />
            <span className="gacha-capsule-shell gacha-shell-bottom" aria-hidden />
          </>
        )}
        <p className="gacha-stage-label">
          {phase === "idle" && "なにが出るかな？"}
          {phase === "press" && "スイッチ ON！"}
          {phase === "spinning" && "カプセルを えらんでいます…"}
          {phase === "suspense" && "…！"}
          {phase === "eject" && "カプセルが 出てきた！"}
          {phase === "opening" && "オープン！"}
        </p>
      </div>
      <Button
        type="button"
        className={`gacha-btn ${phase === "press" ? "gacha-btn-pressed" : ""}`}
        disabled={busy || !view.gachaOn || view.points < view.cost}
        onClick={onDraw}
      >
        {busy ? "まわしています…" : `🎰 ガチャをひく（${view.cost}pt）`}
      </Button>
      {msg && <p className="text-base font-bold text-destructive">{msg}</p>}

      {prize && phase === "result" && (
        <div
          className={`gacha-result-overlay gacha-result-${prize.rarity.toLowerCase()}`}
          role="dialog"
          aria-modal="true"
          aria-label={`${prize.name}をゲット`}
        >
          <div className="gacha-result-backdrop" />
          <div className="gacha-result-flash" aria-hidden />
          <div className="gacha-result-particles" aria-hidden>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i}>✦</span>
            ))}
          </div>
          <div className="gacha-result-card">
            <p className="gacha-result-get">GET!</p>
            <div className="gacha-result-art">
              {(() => {
                const item = COLL_ITEMS.find((i) => i.id === prize.id);
                return item ? <ItemArt item={item} size={152} /> : null;
              })()}
            </div>
            <div className="gacha-result-copy">
              <span
                className={`inline-block rounded-full px-4 py-1 font-display text-sm font-bold ${COLL_RARITY_META[prize.rarity].tone}`}
              >
                {prize.rarity}
              </span>
              <p className="mt-2 font-display text-3xl font-bold">{prize.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {COLL_CATEGORY_LABEL[prize.category]}／{prize.description}
              </p>
              {prize.duplicate ? (
                <p className="mt-2 text-sm font-bold">
                  すでに もっているアイテム（かぶり {prize.dupeCount} かい）
                </p>
              ) : (
                <p className="mt-2 text-base font-bold text-primary">あたらしくゲット！</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" className="rounded-full" onClick={() => closeResult()}>
                  とじる
                </Button>
                <Button className="rounded-full" onClick={() => closeResult(true)}>
                  アイテムBOXで見る
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const list = (
    <section className="kid-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-lg font-bold">🗂️ アイテムBOX</h2>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {progress.have} / {progress.all} こ
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {COLL_CATEGORIES.map((c) => {
          const items = collItemsOf(c);
          const have = items.filter((i) => owned.includes(i.id)).length;
          return (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={cat === c ? "default" : "secondary"}
              onClick={() => setCat(c)}
              className="h-auto rounded-full px-3 py-1.5 text-xs font-bold"
            >
              {COLL_CATEGORY_ICON[c]} {COLL_CATEGORY_LABEL[c]} {have}/{items.length}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold text-muted-foreground">ならびかえ</span>
        {(
          [
            ["rarity", "レアリティ順"],
            ["owned", "入手順"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={sortBy === key ? "default" : "secondary"}
            onClick={() => setSortBy(key)}
            className="h-auto rounded-full px-3 py-1.5 text-xs font-bold"
          >
            {label}
          </Button>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {sortItems(collItemsOf(cat), sortBy, owned).map((item) => {
          const has = owned.includes(item.id);
          const inUse = equipped[cat] === item.id;
          const dupe = view.coll.dupes[item.id] ?? 0;
          return (
            <li key={item.id}>
              <Button
                type="button"
                variant="ghost"
                disabled={!has}
                onClick={() => void onEquip(item)}
                className={`h-auto min-h-40 w-full flex-col items-center gap-1.5 rounded-2xl p-3 text-center ring-2 transition-all ${
                  inUse
                    ? "bg-primary/10 ring-primary"
                    : has
                      ? "bg-card ring-transparent hover:-translate-y-0.5 hover:ring-primary/40"
                      : "bg-muted/60 opacity-60 ring-transparent"
                }`}
              >
                {has ? (
                  <ItemArt item={item} />
                ) : (
                  <span className="grid h-14 w-14 place-content-center rounded-xl bg-muted text-2xl">
                    ？
                  </span>
                )}
                <span className="text-xs font-bold">{has ? item.name : "みかくにん"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${COLL_RARITY_META[item.rarity].tone}`}
                >
                  {item.rarity}
                </span>
                {inUse && (
                  <span className="text-[10px] font-bold text-primary">つかっています</span>
                )}
                {has && dupe > 0 && (
                  <span className="text-[10px] text-muted-foreground">かぶり ×{dupe}</span>
                )}
              </Button>
              {cat === "sound" && has && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full rounded-xl text-xs font-bold"
                  onClick={(e) => {
                    e.stopPropagation();
                    previewCollectionSound(
                      soundTune(item.id),
                      view.rank,
                      item.asset ?? soundAsset(item.id),
                    );
                  }}
                >
                  ▶ 試聴
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
        いま つかっているもの：
        {COLL_CATEGORIES.map((c) => {
          const id = equipped[c];
          const item = COLL_ITEMS.find((i) => i.id === id);
          return (
            <span key={c} className="ml-2 font-bold text-foreground">
              {COLL_CATEGORY_ICON[c]}
              {item?.name ?? "なし"}
            </span>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        うごくエフェクト素材：Powered by KLIPY
      </p>
    </section>
  );

  return (
    <>
      <CollectionFx
        fx={fxPlay?.fx ?? null}
        rank={view.rank === "GOLD" || view.rank === "BLACK" ? view.rank : "NORMAL"}
        playId={fxPlay?.id ?? null}
        image={fxPlay?.image ?? null}
      />
      {screen === "gacha" ? gacha : list}
    </>
  );
}

export { backgroundCss };
