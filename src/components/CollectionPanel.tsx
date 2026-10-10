import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import CollectionFx from "@/components/CollectionFx";
import CollectionBackdrop from "@/components/CollectionBackdrop";
import CollectionIcon from "@/components/CollectionIcon";
import GachaFilm from "@/components/GachaFilm";
import { GACHA_MEDIA, prepareGachaAudio } from "@/lib/gacha-media";
import { createGachaSession } from "@/lib/gacha-session";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
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
  type CollCategory,
  type CollItem,
} from "@/lib/collection-catalog";
import {
  drawCollGacha,
  equipCollItem,
  getCollection,
  markCollSeen,
  type CollView,
} from "@/lib/collection.functions";
import {
  playCollectionSound,
  playError,
  previewCollectionSound,
} from "@/lib/feedback";
import { useCustomPrizes } from "@/lib/use-custom-prizes";
import { COLL_SETS, setMembers } from "@/lib/daily-play";

type Screen = "gacha" | "collection";
export function useCollection() {
  const load = useServerFn(getCollection);
  const draw = useServerFn(drawCollGacha);
  const equip = useServerFn(equipCollItem);
  const [view, setViewRaw] = useState<CollView | null>(null);
  const [loading, setLoading] = useState(true);
  const [gachaSession] = useState(createGachaSession);
  const gachaState = useSyncExternalStore(gachaSession.subscribe, gachaSession.getSnapshot, gachaSession.getServerSnapshot);
  // 先生が登録した景品もアイテム一覧に合流させる
  const custom = useCustomPrizes();
  // 新しい保存結果を、あとから届いた古い読み込み結果で上書きしないための番号
  const version = useRef(0);
  const setView = useCallback((v: CollView | null) => {
    version.current += 1;
    setViewRaw(v);
  }, []);

  /** サーバーの最新状態を読み直す（保存後の同期・失敗時の復旧用） */
  const refresh = useCallback(async () => {
    const started = version.current;
    try {
      const v = await load({});
      if (version.current === started) setView(v);
    } catch {
      /* 読み直しに失敗しても、いまの表示はそのまま */
    }
  }, [load, setView]);

  useEffect(() => {
    let off = false;
    const started = version.current;
    void load({})
      .then((v) => {
        if (!off && version.current === started) setView(v);
      })
      .catch(() => {})
      .finally(() => {
        if (!off) setLoading(false);
      });
    return () => {
      off = true;
    };
  }, [load, setView]);

  return { view, setView, refresh, loading: loading || !custom.ready, draw, equip, load, gachaSession, gachaState };
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

export default function CollectionPanel({
  api,
  screen,
  onShowBox,
  active = true,
}: {
  api: CollectionApi;
  screen: Screen;
  onShowBox?: () => void;
  active?: boolean;
}) {
  const { view, setView, refresh, loading, draw, equip, load, gachaSession, gachaState } = api;
  const [busy, setBusy] = useState(false);
  const { prize, phase } = gachaState;
  const drawBusy = phase !== "idle";
  const [msg, setMsg] = useState("");
  const [cat, setCat] = useState<CollCategory>("icon");
  const [sortBy, setSortBy] = useState<"rarity" | "owned">("rarity");
  const [fxPlay, setFxPlay] = useState<{
    fx: string;
    id: number;
    image?: string | null;
    /** 演出の豪華さ。ガチャ結果では「景品のレアリティ」だけを使う（児童ランクは使わない） */
    rank?: "NORMAL" | "GOLD" | "BLACK";
  } | null>(null);

  const markSeenFn = useServerFn(markCollSeen);
  useEffect(() => {
    if (phase === "video" && (!active || screen !== "gacha")) gachaSession.finish(gachaState.run);
  }, [active, screen, phase, gachaSession, gachaState.run]);

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

  const onDraw = () => {
    if (busy || drawBusy || !view.gachaOn || view.points < view.cost || view.play.gachaLeft <= 0) return;
    prepareGachaAudio();
    setMsg("");
    void gachaSession.draw(() => draw({}), setView);
  };

  const closeResult = (showInBox = false) => {
    if (showInBox && prize) setCat(prize.category);
    gachaSession.close();
    if (showInBox) onShowBox?.();
  };

  const onEquip = async (item: CollItem) => {
    if (!owned.includes(item.id) || busy) return;
    setBusy(true);
    setMsg("");
    let res: Awaited<ReturnType<typeof equip>>;
    try {
      res = await equip({ data: { itemId: item.id } });
    } catch {
      // 保存に失敗：成功したように見せず、サーバーの状態に合わせ直す
      setMsg("へんこうできませんでした。もういちど ためしてね");
      playError();
      await refresh();
      return;
    } finally {
      setBusy(false);
    }
    if (!res) return;
    setView(res);
    if (res && "error" in res && res.error === "daily") {
      setMsg("きょうの へんこうは おしまい。また あした！");
      return;
    }
    if (item.category === "sound")
      playCollectionSound(soundTune(item.id), view.rank, item.asset ?? soundAsset(item.id));
    if (item.category === "effect")
      setFxPlay({
        fx: effectFx(item.id) ?? "spark",
        id: Date.now(),
        image: item.image ?? null,
        rank: "NORMAL",
      });
  };

  const gacha = (
    <section className="student-gacha gacha-panel space-y-4 p-4 text-center sm:p-5">
      <div className="gacha-heading">
        <span className="gacha-heading-mark" aria-hidden>✦</span>
        <h2 className="font-display text-lg font-bold">コレクションガチャ</h2>
        <span className="gacha-heading-mark" aria-hidden>✦</span>
      </div>
      <p className="gacha-points font-display text-4xl font-bold tabular-nums">
        {view.points}
        <span className="ml-1 text-base">pt</span>
      </p>
      <p className="gacha-cost text-xs text-muted-foreground">
        <span className="gacha-cost-value">1かい {view.cost}pt</span> ／ あつめた {progress.have} / {progress.all} こ
      </p>
      <div className={`gacha-stage gacha-stage-${phase}`} aria-live="polite">
        <img className="gacha-console-art" src={GACHA_MEDIA.poster} alt="宇宙に浮かぶクリスタルのガチャマシン" width={1280} height={720} />
        <div className="gacha-console-caption"><span>CRYSTAL CHAMBER</span><span>{phase === "drawing" ? "抽選結果を確認しています…" : "なにが出るかな？"}</span></div>
        {phase === "drawing" && <div className="gacha-saving" role="status"><span className="gacha-loading-ring" aria-hidden />保存結果を確認中…</div>}
      </div>
      <Button
        type="button"
        className="gacha-btn"
        disabled={busy || drawBusy || !view.gachaOn || view.points < view.cost || view.play.gachaLeft <= 0}
        onClick={onDraw}
      >
        <Sparkles /> {phase === "drawing" ? "保存結果を確認中…" : drawBusy ? "結果を確認してね" : `ガチャをひく（${view.cost}pt）`} <ArrowRight />
      </Button>
      <p className="text-sm font-bold">
        {view.play.gachaLeft > 0 ? `きょうのガチャ ${view.play.gachaLimit - view.play.gachaLeft} / ${view.play.gachaLimit}` : "きょうのガチャは おしまい。また あしたね 🌙"}
      </p>
      {gachaState.message && <p className={phase === "uncertain" ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role="status">{gachaState.message}</p>}
      {phase === "uncertain" && <div className="flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => { void gachaSession.recover(() => load({}), setView); }}>保存結果を確認する</Button><Button variant="secondary" onClick={onShowBox}>アイテムBOXへ <ArrowRight /></Button></div>}
      {msg && <p className="text-base font-bold text-destructive">{msg}</p>}
      <div className="gacha-records grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-card/20 p-2">✅ コンプリート<br /><b className="text-base">{view.stats.completeTotal}</b> 回</div>
        <div className="rounded-lg bg-card/20 p-2">🔥 れんぞく<br /><b className="text-base">{view.stats.streak}</b> 回</div>
        <div className="rounded-lg bg-card/20 p-2">🎁 つぎのボーナス<br /><b className="text-base">{(Math.floor(view.stats.completeTotal / 5) + 1) * 5}</b> 回目</div>
      </div>

      {phase === "video" && <GachaFilm key={gachaState.run} run={gachaState.run} active={active && screen === "gacha"} onDone={gachaSession.finish} />}
      {prize && phase === "result" && (
        <div
          className={`gacha-result-overlay gacha-acquisition gacha-result-${prize.rarity.toLowerCase()}`}
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
          <span className="cyber-ripple cyber-ripple-result" aria-hidden />
          <div className="cyber-aura" aria-hidden>
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                style={{
                  left: `${(i * 37 + 8) % 92}%`,
                  top: `${(i * 53 + 12) % 88}%`,
                  animationDelay: `${(i % 5) * 240}ms`,
                }}
              >
                ✦
              </span>
            ))}
          </div>
          <div className="gacha-result-card cyber-card">
            <span className="gacha-result-kicker">REMIX QR LAB / COLLECTION</span>
            <p className="gacha-result-get">GET!</p>
            <div className="gacha-result-art">
              {(() => {
                const item = COLL_ITEMS.find((i) => i.id === prize.id);
                return item ? <ItemArt item={item} size={216} /> : null;
              })()}
            </div>
            <div className="gacha-result-copy">
              <span
                className={`gacha-rarity inline-block rounded-full px-4 py-1 font-display text-sm font-bold ${COLL_RARITY_META[prize.rarity].tone}`}
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
                  <RotateCcw /> もう一度ガチャ
                </Button>
                <Button className="rounded-full" onClick={() => closeResult(true)}>
                  アイテムBOXへ <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const list = (
    <section className="collection-box kid-panel space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-lg font-bold">📖 コレクション {progress.have}/{progress.all} GET!</h2>
        {view.play.newIds.length > 0 && (
          <Button
            type="button"
            size="sm"
            className="h-auto rounded-full px-3 py-1 text-xs font-bold"
            onClick={async () => {
              try {
                const next = await markSeenFn({ data: { ids: view.play.newIds } });
                if (next) setView(next);
              } catch {
                void refresh();
              }
            }}
          >
            🆕 NEW {view.play.newIds.length} → みた！
          </Button>
        )}
      </div>

      <div className="box-records grid grid-cols-2 gap-2 text-xs sm:grid-cols-4" aria-label="じぶんの記録">
        <div className="rounded-xl bg-muted/60 p-2">✅ コンプリート（ぜんぶで）<br /><b className="text-base">{view.stats.completeTotal}</b> 回</div>
        <div className="rounded-xl bg-muted/60 p-2">🔥 れんぞくコンプリート<br /><b className="text-base">{view.stats.streak}</b> 回</div>
        <div className="rounded-xl bg-muted/60 p-2">🎰 ガチャをひいた<br /><b className="text-base">{view.stats.draws}</b> 回</div>
        <div className="rounded-xl bg-muted/60 p-2">📅 きょう<br /><b className="text-base">{view.stats.completeToday ? "コンプリート！" : "まだ"}</b></div>
      </div>

      {view.play.recent.length > 0 && (
        <div className="box-recent flex items-center gap-2 overflow-x-auto rounded-xl bg-muted/40 p-2">
          <span className="shrink-0 text-xs font-bold">🕒 さいきんGET</span>
          {view.play.recent.slice(0, 5).map((r) => {
            const it = COLL_ITEMS.find((i) => i.id === r.id);
            return it ? (
              <span key={`${r.id}-${r.at}`} className="flex shrink-0 items-center gap-1 text-[11px] font-bold">
                <ItemArt item={it} size={28} />
                {it.name}
              </span>
            ) : null;
          })}
        </div>
      )}

      <details className="box-sets rounded-xl bg-muted/40 p-2 text-xs">
        <summary className="cursor-pointer font-bold">🧩 セットコレクション</summary>
        <ul className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {COLL_SETS.map((set) => {
            const mem = setMembers(set, COLL_ITEMS);
            if (!mem.length) return null;
            const have = mem.filter((m) => owned.includes(m.id)).length;
            return (
              <li key={set.id} className="rounded-lg bg-card p-2">
                {set.icon} {set.label} {have}/{mem.length}
                {have === mem.length && <b className="ml-1 text-primary">コンプリート！</b>}
              </li>
            );
          })}
        </ul>
      </details>

      <div className="box-categories flex flex-wrap gap-1.5" role="group" aria-label="カテゴリ">
        {COLL_CATEGORIES.map((c) => {
          const items = collItemsOf(c);
          const have = items.filter((i) => owned.includes(i.id)).length;
          return (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={cat === c ? "default" : "secondary"}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className="box-choice h-auto rounded-full px-3 py-1.5 text-xs font-bold"
            >
              {COLL_CATEGORY_ICON[c]} {COLL_CATEGORY_LABEL[c]} {have}/{items.length}
            </Button>
          );
        })}
      </div>

      <div className="box-sorting flex flex-wrap items-center gap-1.5" role="group" aria-label="ならびかえ">
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
            aria-pressed={sortBy === key}
            onClick={() => setSortBy(key)}
            className="box-choice h-auto rounded-full px-3 py-1.5 text-xs font-bold"
          >
            {label}
          </Button>
        ))}
      </div>

      <ul className="box-items grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
                aria-pressed={inUse}
                data-owned={has}
                onClick={() => void onEquip(item)}
                className={`box-item h-auto min-h-40 w-full flex-col items-center gap-1.5 rounded-2xl p-3 text-center ring-2 transition-all ${
                  inUse
                    ? "bg-primary/10 ring-primary"
                    : has
                      ? "bg-card ring-transparent hover:-translate-y-0.5 hover:ring-primary/40"
                      : "bg-muted/60 opacity-60 ring-transparent"
                }`}
              >
                <span className="box-art">
                {has ? (
                  <ItemArt item={item} />
                ) : (
                  <span className="pointer-events-none opacity-70 [filter:brightness(0)_opacity(0.55)]" aria-label="まだ持っていない">
                    <ItemArt item={item} />
                  </span>
                )}
                </span>
                <span className="box-item-name text-xs font-bold">{has ? item.name : "？？？"}</span>
                {has && view.play.newIds.includes(item.id) && (
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">🆕 NEW!</span>
                )}
                <span
                  className={`box-rarity rounded-full px-2 py-0.5 text-[10px] font-bold ${COLL_RARITY_META[item.rarity].tone}`}
                >
                  {item.rarity}
                </span>
                {inUse && (
                  <span className="box-equipped text-[10px] font-bold text-primary">✓ つかっています</span>
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
                  className="box-preview mt-1 w-full rounded-xl text-xs font-bold"
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

      <div className="box-equipment-summary rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
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
        rank={fxPlay?.rank ?? "NORMAL"}
        playId={fxPlay?.id ?? null}
        image={fxPlay?.image ?? null}
      />
      {screen === "gacha" ? gacha : list}
    </>
  );
}

export { backgroundCss };
