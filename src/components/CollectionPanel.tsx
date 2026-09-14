import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import CollectionFx from "@/components/CollectionFx";
import CollectionIcon from "@/components/CollectionIcon";
import { Button } from "@/components/ui/button";
import {
  backgroundCss,
  COLL_CATEGORIES,
  COLL_CATEGORY_ICON,
  COLL_CATEGORY_LABEL,
  COLL_ITEMS,
  COLL_RARITY_META,
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
import { playCollectionSound, playError, previewCollectionSound } from "@/lib/feedback";
import { useCustomPrizes } from "@/lib/use-custom-prizes";

type Screen = "gacha" | "collection";
type GachaPhase = "idle" | "spinning" | "opening" | "result";

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
      <span
        className="block rounded-xl bg-muted"
        style={{
          width: size,
          height: size,
          background: item.thumb
            ? `url("${item.thumb}") center / cover no-repeat`
            : item.art["css"],
        }}
      />
    );
  if (item.category === "frame")
    return <CollectionIcon iconId="ic_cat" frameId={item.id} size={size} />;
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
    if (busy) return;
    setBusy(true);
    setMsg("");
    setPrize(null);
    setPhase("spinning");
    const started = Date.now();
    let res: Awaited<ReturnType<typeof draw>>;
    try {
      res = await draw({});
    } catch {
      setBusy(false);
      setPhase("idle");
      setMsg("ガチャを まわせませんでした");
      playError();
      return;
    }
    const wait = Math.max(0, 900 - (Date.now() - started));
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
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
      setPhase("opening");
      const rank = p.rarity === "BLACK" ? "BLACK" : p.rarity === "GOLD" ? "GOLD" : "NORMAL";
      window.setTimeout(() => {
        setPrize(p);
        setPhase("result");
        setBusy(false);
        const tune =
          p.rarity === "BLACK"
            ? "black"
            : p.rarity === "GOLD"
              ? "gold"
              : p.rarity === "SSR"
                ? "levelup"
                : p.rarity === "N"
                  ? "pico"
                  : "fanfare";
        playCollectionSound(tune, rank, tuneAsset(tune));
        const fx =
          p.rarity === "BLACK"
            ? "black"
            : p.rarity === "GOLD"
              ? "gold"
              : p.rarity === "SSR" || p.rarity === "SR"
                ? "starfall"
                : "glitter";
        setFxPlay({ fx, id: Date.now(), image: fxImage(fx) });
      }, 520);
    }
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

  const gacha = (
    <section className="kid-panel space-y-4 p-5 text-center">
      <h2 className="font-display text-lg font-bold">🎁 コレクションガチャ</h2>
      <p className="font-display text-4xl font-bold text-primary tabular-nums">
        {view.points}
        <span className="ml-1 text-base">pt</span>
      </p>
      <p className="text-xs text-muted-foreground">
        1かい {view.cost}pt ／ あつめた {progress.have} / {progress.all} こ
      </p>
      <p className="text-xs font-bold text-primary">
        いまのカードランク：{view.rank}
        {view.rank === "NORMAL" && "（ランクが上がると GOLD・BLACK も出ます）"}
      </p>
      <div
        className={`gacha-stage ${phase === "result" ? "gacha-stage-result" : ""}`}
        aria-live="polite"
      >
        <div className={`gacha-machine ${phase === "spinning" ? "gacha-machine-spin" : ""}`}>
          <span className="gacha-machine-window" aria-hidden>
            <span className="gacha-capsule">●</span>
          </span>
          <span className="gacha-machine-base">GACHA</span>
        </div>
        {phase === "opening" && (
          <div className="gacha-opening" aria-label="カプセルがひらきます">
            <span className="gacha-half gacha-half-top" />
            <span className="gacha-half gacha-half-bottom" />
            <span className="gacha-light">✦</span>
          </div>
        )}
        {phase === "idle" && <p className="gacha-stage-label">なにが出るかな？</p>}
        {phase === "spinning" && <p className="gacha-stage-label">カプセルを えらんでいます…</p>}
        {phase === "opening" && <p className="gacha-stage-label">オープン！</p>}
      </div>
      <Button
        className="h-16 w-full max-w-xs rounded-full text-xl"
        disabled={busy || !view.gachaOn || view.points < view.cost}
        onClick={onDraw}
      >
        {busy ? "カプセルを まわしています…" : `ガチャを まわす（${view.cost}pt）`}
      </Button>
      {msg && <p className="text-base font-bold text-destructive">{msg}</p>}

      {prize && (
        <div
          className={`gacha-prize-card mx-auto max-w-sm space-y-2 rounded-3xl p-5 ring-4 ${COLL_RARITY_META[prize.rarity].ring} ${
            prize.rarity === "BLACK" ? "bg-slate-900 text-amber-200" : "bg-card"
          }`}
        >
          <span
            className={`inline-block rounded-full px-3 py-1 font-display text-xs font-bold ${COLL_RARITY_META[prize.rarity].tone}`}
          >
            {prize.rarity}
          </span>
          <div className="flex justify-center">
            {(() => {
              const item = COLL_ITEMS.find((i) => i.id === prize.id);
              return item ? <ItemArt item={item} size={72} /> : null;
            })()}
          </div>
          <p className="font-display text-2xl font-bold">{prize.name}</p>
          <p className="text-xs opacity-80">
            {COLL_CATEGORY_LABEL[prize.category]}／{prize.description}
          </p>
          {prize.duplicate ? (
            <p className="text-sm font-bold">
              すでに もっているアイテム（かぶり {prize.dupeCount} かい）
            </p>
          ) : (
            <p className="text-sm font-bold text-primary">あたらしくゲット！</p>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              setCat(prize.category);
              setPrize(null);
            }}
          >
            アイテムBOXで見る
          </Button>
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

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {collItemsOf(cat).map((item) => {
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
