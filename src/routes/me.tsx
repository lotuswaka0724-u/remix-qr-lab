import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";

import CollectionIcon from "@/components/CollectionIcon";
import CompleteCelebration from "@/components/CompleteCelebration";
import StudentProgress from "@/components/StudentProgress";
import CrystalPullRefresh from "@/components/CrystalPullRefresh";
import { PushOptIn, RedoBanner, usePushSubscription, type RedoBannerItem } from "@/components/RedoNotify";
import NamePlate, { namePlateFrameStyle } from "@/components/NamePlate";
import CollectionPanel, { useCollection } from "@/components/CollectionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import studentWorld from "@/assets/collection/student-crystal-world.asset.json";
import studentCss from "@/student-page.css?url";
import { playCrystalChime, playError, playRedoAlert } from "@/lib/feedback";
import { stopGachaAudio } from "@/lib/gacha-media";
import { STATUS_META, tieRank, type Status } from "@/lib/homework-store";
import { redoMessage } from "@/lib/redo-notify";
import {
  getClassRanking,
  getStudentView,
  studentLogin,
  studentLogout,
  type StudentView,
} from "@/lib/student.functions";

type RankingEntry = { id: string; name: string; points: number; isMe: boolean };

export const Route = createFileRoute("/me")({
  head: () => ({
    links: [{ rel: "stylesheet", href: studentCss }],
    meta: [
      { title: "わたしのページ | 宿題チェッカー" },
      {
        name: "description",
        content:
          "ログイン番号を入れると、自分の今日の宿題・ポイント・ガチャ・アイテムBOXが見られるページです。",
      },
      { property: "og:title", content: "わたしのページ | 宿題チェッカー" },
      {
        property: "og:description",
        content: "ログイン番号でひらく、自分だけの宿題とポイントとアイテムBOXのページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPage,
});

type Screen = "home" | "homework" | "points" | "gacha" | "collection";

const isOk = (s: Status) => s === "fixed" || s === "submitted" || s === "school";

function MyPage() {
  const login = useServerFn(studentLogin);
  const fetchView = useServerFn(getStudentView);
  const fetchRanking = useServerFn(getClassRanking);
  const logout = useServerFn(studentLogout);

  const [view, setView] = useState<StudentView | null>(null);
  const [ready, setReady] = useState(false);
  const [num, setNum] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [myRank, setMyRank] = useState<{ rank: number | null; total: number } | null>(null);
  const applyRanking = (r: { top: RankingEntry[]; myRank: number | null; total: number } | null) => {
    setRanking(r ? r.top : null);
    setMyRank(r ? { rank: r.myRank, total: r.total } : null);
  };

  const coll = useCollection();
  useEffect(() => () => stopGachaAudio(), []);

  // 宿題が ○ になった瞬間の演出と、今日はじめてコンプリートしたときの演出（表示だけ）
  const [celebrate, setCelebrate] = useState(false);
  const [justChecked, setJustChecked] = useState<Set<string>>(() => new Set());
  const prevOk = useRef<Map<string, boolean> | null>(null);
  const itemsKey = view ? `${view.date}|${view.items.map((i) => `${i.id}:${i.status}`).join(",")}` : "";
  useEffect(() => {
    if (!view) {
      prevOk.current = null;
      return;
    }
    const now = new Map(view.items.map((i) => [i.id, isOk(i.status)] as const));
    const before = prevOk.current;
    prevOk.current = now;
    if (!before) return;
    const flipped = [...now].filter(([id, ok]) => ok && before.get(id) === false).map(([id]) => id);
    if (!flipped.length) return;
    setJustChecked(new Set(flipped));
    if (![...now.values()].every(Boolean)) playCrystalChime();
    const t = window.setTimeout(() => setJustChecked(new Set()), 1600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const completeToday = coll.view?.stats.completeToday ?? false;
  const celebrateBlocked = screen === "gacha" || coll.gachaState.phase !== "idle";

  // なおし通知：この端末でまだ見ていない「直し」をバナーで知らせる（表示だけ）
  const push = usePushSubscription();
  const [redoBanner, setRedoBanner] = useState<RedoBannerItem[]>([]);
  const [redoPing, setRedoPing] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    if (!view || celebrateBlocked) return;
    const fresh: RedoBannerItem[] = [];
    for (const i of view.items) {
      if (i.status !== "redo") continue;
      const k = `remix-redo-seen:${view.date}:${view.name}:${i.id}`;
      try {
        if (window.localStorage.getItem(k)) continue;
        window.localStorage.setItem(k, "1");
      } catch {
        /* 保存できない端末でもバナーは出す */
      }
      fresh.push({ id: i.id, message: redoMessage(i.name) });
    }
    if (!fresh.length) return;
    setRedoBanner((cur) => [...cur.filter((c) => !fresh.some((f) => f.id === c.id)), ...fresh]);
    playRedoAlert();
    try {
      navigator.vibrate?.([14, 60, 14]);
    } catch {
      /* 振動できない端末 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, celebrateBlocked]);
  const closeRedoBanner = useCallback(() => setRedoBanner([]), []);
  const openRedo = useCallback(() => {
    setRedoPing(new Set(redoBanner.map((c) => c.id)));
    setRedoBanner([]);
    setScreen("homework");
  }, [redoBanner]);
  useEffect(() => {
    if (!redoPing.size) return;
    const t = window.setTimeout(() => setRedoPing(new Set()), 2600);
    return () => window.clearTimeout(t);
  }, [redoPing]);

  // 通知が来たとき・画面にもどったとき・1分ごとに、宿題の状態だけ読みなおす
  const hasView = !!view;
  useEffect(() => {
    if (!hasView) return;
    const reload = () => {
      if (document.visibilityState !== "visible") return;
      void fetchView({})
        .then((v) => v && setView(v))
        .catch(() => {});
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "redo-push") reload();
      if (e.data?.type === "redo-open") {
        reload();
        setScreen("homework");
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    document.addEventListener("visibilitychange", reload);
    const t = window.setInterval(reload, 60_000);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMsg);
      document.removeEventListener("visibilitychange", reload);
      window.clearInterval(t);
    };
  }, [hasView, fetchView]);

  // 通知をタップして開いたときは宿題タブへ
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "homework") setScreen("homework");
  }, []);
  const celebrateKey = view ? `remix-complete-fx:${view.date}:${view.name}` : "";
  useEffect(() => {
    if (!celebrateKey || !completeToday || celebrateBlocked) return;
    try {
      if (window.localStorage.getItem(celebrateKey)) return;
      window.localStorage.setItem(celebrateKey, "1");
    } catch {
      /* 保存できない端末でも演出は出す */
    }
    setCelebrate(true);
  }, [celebrateKey, completeToday, celebrateBlocked]);

  // ガチャでポイントを使ったら、ヘッダーのポイント表示もサーバーの最新値に合わせる
  const collPoints = coll.view?.points;
  const lastPoints = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (collPoints === undefined) return;
    const prev = lastPoints.current;
    lastPoints.current = collPoints;
    if (prev === undefined || prev === collPoints) return;
    let off = false;
    void fetchView({})
      .then((v) => {
        if (!off && v) setView(v);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [collPoints, fetchView]);

  useEffect(() => {
    let off = false;
    void fetchView({})
      .then((v) => {
        if (!off) {
          setView(v);
          setReady(true);
        }
      })
      .catch(() => setReady(true));
    return () => {
      off = true;
    };
  }, [fetchView]);

  // ポイント画面をひらいたとき、クラスのランキングを読み取り専用で取る
  useEffect(() => {
    if (!view || screen !== "points") return;
    let off = false;
    void fetchRanking({})
      .then((r) => {
        if (!off) applyRanking(r);
      })
      .catch(() => {
        if (!off) setRanking(null);
      });
    return () => {
      off = true;
    };
  }, [view, screen, fetchRanking]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await login({ data: { loginNumber: num } });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.reason === "locked"
          ? "しばらくたってから もういちど ためしてね"
          : "ログインできませんでした",
      );
      playError();
      return;
    }
    setNum("");
    setView(await fetchView({}));
    window.location.reload();
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center text-sm text-muted-foreground">
        よみこみ中…
      </main>
    );
  }

  if (!view) {
    return (
      <main className="student-page mx-auto max-w-sm px-4 py-12" style={{ "--student-world-image": `url("${studentWorld.url}")` } as React.CSSProperties}>
        <form onSubmit={onLogin} className="glass-panel space-y-5 p-6 text-center">
          <h1 className="font-display text-2xl font-bold">ログイン番号を いれてください</h1>
          <Input
            value={num}
            onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            placeholder="パスワードを入力"
            className="h-16 text-center font-display text-3xl tracking-[0.3em]"
            aria-label="ログイン番号"
          />
          {error && <p className="text-base font-bold text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="student-command h-14 w-full rounded-full text-lg">
            ログイン
          </Button>
        </form>
      </main>
    );
  }

  const done = view.items.filter(
    (i) => i.status === "fixed" || i.status === "submitted" || i.status === "school",
  ).length;
  const allDone = view.items.length > 0 && done === view.items.length;
  const equipped = coll.view?.coll.equipped ?? {};
  const ownedCount = coll.view?.coll.owned.length ?? 0;
  const totalCount = coll.view?.totalItems ?? 0;

  const homeworkCard = (
    <section className="kid-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="mr-auto font-display text-base font-bold">📚 今日の宿題</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            allDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {done} / {view.items.length} 出した
        </span>
      </div>
      <div className="mb-3 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all"
          style={{ width: `${view.items.length ? (done / view.items.length) * 100 : 0}%` }}
        />
      </div>
      {view.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">今日の宿題はまだ決まっていません。</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {view.items.map((a) => {
            const meta = STATUS_META[a.status];
            const ok = a.status === "fixed" || a.status === "submitted" || a.status === "school";
            return (
              <li
                key={a.id}
                className={`flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-3 text-base ${
                  justChecked.has(a.id) ? "hw-just-checked" : ""
                } ${redoPing.has(a.id) ? "hw-redo-ping" : ""
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-content-center rounded-lg font-display text-xl font-bold ${meta.tone}`}
                >
                  {ok ? "○" : "×"}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{a.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{meta.label}</span>
              </li>
            );
          })}
        </ul>
      )}
      {allDone && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-2 text-center">
          <p className="font-display font-bold text-primary">今日の宿題は ぜんぶ出せました！</p>
          {completeToday && (
            <button
              type="button"
              onClick={() => setCelebrate(true)}
              className="complete-replay rounded-full px-3 py-1 text-xs font-bold transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              ✨ もういちど見る
            </button>
          )}
        </div>
      )}
    </section>
  );

  const pointsCard = (
    <section className="kid-panel p-5 text-center">
      <h2 className="font-display text-base font-bold">🪙 ポイント</h2>
      <p className="student-points mt-2 font-display text-5xl font-bold text-primary tabular-nums">
        {view.available}
        <span className="ml-1 text-base">pt</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        つうさん {view.earned}pt ／ つかった {view.spent}pt
      </p>
      {coll.view && (
        <p className="mt-2 text-xs font-bold text-primary">カードランク：{coll.view.rank}</p>
      )}
      <Button className="student-command mt-4 rounded-full px-8" onClick={() => setScreen("gacha")}>
        🎰 ガチャへ
      </Button>
      {view.log.length > 0 && (
        <ul className="mx-auto mt-5 max-w-md space-y-1 text-left text-xs">
          {view.log.slice(0, 10).map((g) => (
            <li key={g.id} className="flex justify-between rounded-lg bg-muted/60 px-3 py-1.5">
              <span className="font-bold">{g.prize}</span>
              <span className="text-muted-foreground">
                {new Date(g.at).toLocaleString("ja-JP")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const rankingCard = (
    <section className="kid-panel ranking-panel p-4">
      <h2 className="mb-3 font-display text-base font-bold">🏆 クラスの ランキング TOP15</h2>
      {myRank?.rank != null && (
        <div className="ranking-myrank mb-3 flex items-center justify-between rounded-2xl px-4 py-3">
          <span className="text-sm font-bold">あなたの 今の じゅんい</span>
          <span className="font-display text-3xl font-bold tabular-nums text-primary">
            {myRank.rank}
            <span className="ml-0.5 text-sm">位</span>
          </span>
        </div>
      )}
      {ranking === null ? (
        <p className="text-sm text-muted-foreground">よみこみ中…</p>
      ) : ranking.length === 0 ? (
        <p className="text-sm text-muted-foreground">まだランキングが ありません。</p>
      ) : (
        <ol className="space-y-1.5">
          {ranking.map((r, i) => (
            <li
              key={r.id}
              className={`ranking-row flex items-center gap-3 rounded-2xl px-3 py-2 ${
                tieRank(ranking, i) <= 3 ? `ranking-top ranking-top-${tieRank(ranking, i)}` : ""
              } ${r.isMe ? "ranking-me" : ""}`}
            >
              <span className="ranking-pos shrink-0 font-display text-lg font-bold tabular-nums">
                {tieRank(ranking, i)}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold">
                {r.name}
                {r.isMe && <span className="ranking-me-badge ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold">あなた</span>}
              </span>
              <span className="ranking-points shrink-0 font-display text-base font-bold tabular-nums">
                {r.points.toLocaleString()}
                <span className="ml-0.5 text-[10px] font-normal">pt</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );

  const progress = (variant: "full" | "rank" | "streak") =>
    coll.view ? (
      <StudentProgress
        variant={variant}
        streak={coll.view.stats.streak}
        total={coll.view.stats.completeTotal}
        completeToday={coll.view.stats.completeToday}
        earned={coll.view.earned}
        rankRules={coll.view.rankRules}
        left={view.items.length - done}
      />
    ) : null;

  const navItems: { id: Screen; label: string; icon: string }[] = [
    { id: "home", label: "ホーム", icon: "🏠" },
    { id: "homework", label: "宿題", icon: "📚" },
    { id: "points", label: "ポイント", icon: "🪙" },
    { id: "gacha", label: "ガチャ", icon: "🎁" },
    { id: "collection", label: "アイテムBOX", icon: "🗂️" },
  ];

  const pullDisabled = screen === "gacha" || coll.gachaState.phase !== "idle";
  const onPullRefresh = async () => {
    await Promise.all([
      fetchView({})
        .then((v) => {
          if (v) setView(v);
        })
        .catch(() => {}),
      coll.refresh(),
      screen === "points"
        ? fetchRanking({})
            .then((r) => applyRanking(r))
            .catch(() => {})
        : Promise.resolve(),
    ]);
  };

  return (
    <div className="student-page collection-page min-h-svh" style={{ "--student-world-image": `url("${studentWorld.url}")` } as React.CSSProperties}>
      <main className="relative z-10 mx-auto max-w-5xl px-3 py-5 pb-28">
        <CrystalPullRefresh disabled={pullDisabled} onRefresh={onPullRefresh} className="space-y-4">
        <header
          className={`kid-panel flex flex-wrap items-center gap-3 p-3 ${namePlateFrameStyle(equipped.background) ? "plate-framed" : ""}`}
          style={namePlateFrameStyle(equipped.background)}
        >
          <CollectionIcon iconId={equipped.icon} frameId={equipped.frame} size={48} />
          <div className="mr-auto min-w-0">
            <p className="font-display text-lg font-bold">
              <NamePlate plateId={equipped.background}>{view.name} さん</NamePlate>
            </p>
            <p className="text-xs text-muted-foreground">
              {view.className} ／ {view.date}
            </p>
          </div>
          <span className="student-point-pill inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] px-4 py-2 font-display text-sm font-bold text-primary-foreground tabular-nums">
            🪙 ポイント {view.available.toLocaleString()} pt
          </span>
          {/* ガチャ画面では児童自身のランクは表示しない（景品に集中させるため） */}
          {coll.view && screen !== "gacha" && (
            <span className="rounded-full bg-warning-soft px-4 py-2 font-display text-sm font-bold text-warning-foreground">
              👑 ランク {coll.view.rank}
            </span>
          )}

          <Button
            className="student-command"
            variant="ghost"
            size="sm"
            onClick={async () => {
              await push.detach();
              await logout({});
              setRedoBanner([]);
              setView(null);
              setCelebrate(false);
              setScreen("home");
            }}
          >
            とじる
          </Button>
        </header>

        {screen === "home" && (
          <>
            <section className="kid-stage relative overflow-hidden p-4">
              <span className="kid-sparkle" aria-hidden>
                ✨
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setScreen("collection")}
                  aria-label="アイテムBOXをひらく"
                  className="transition-transform hover:-translate-y-1"
                >
                  <CollectionIcon iconId={equipped.icon} frameId={equipped.frame} size={110} />
                </button>

                <div className="min-w-[220px] flex-1 space-y-3">
                  <div className="student-inset rounded-3xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                    <p className="font-display text-lg font-bold">こんにちは！</p>
                    <p className="text-sm text-muted-foreground">
                      宿題を出して ポイントをためて ガチャを まわそう！
                    </p>
                  </div>

                  <div className="student-inset rounded-3xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                    <p className="flex items-center text-sm font-bold">
                      今日の宿題
                      <span className="ml-auto font-display text-lg text-primary tabular-nums">
                        {done} / {view.items.length}
                      </span>
                    </p>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all"
                        style={{
                          width: `${view.items.length ? (done / view.items.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScreen("collection")}
                    className="student-inset flex w-full items-center gap-3 rounded-3xl bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-3xl">🗂️</span>
                    <span>
                      <span className="block font-display text-base font-bold">アイテムBOX</span>
                      <span className="block text-xs text-muted-foreground">
                        あつめた {ownedCount} / {totalCount} こ
                      </span>
                    </span>
                    <span className="ml-auto text-xl">→</span>
                  </button>
                </div>
              </div>
            </section>

            {progress("full")}
            <PushOptIn api={push} />

            <div className="grid gap-3 lg:grid-cols-2">
              {homeworkCard}
              {pointsCard}
            </div>
          </>
        )}

        {screen === "homework" && (
          <>
            <PushOptIn api={push} />
            {progress("streak")}
            {homeworkCard}
          </>
        )}
        {screen === "points" && (
          <>
            {pointsCard}
            {progress("rank")}
            {rankingCard}
          </>
        )}
        <div hidden={screen !== "gacha" && screen !== "collection"}>
          <CollectionPanel api={coll} screen={screen === "collection" ? "collection" : "gacha"} active={screen === "gacha" || screen === "collection"} onShowBox={() => setScreen("collection")} />
        </div>
        </CrystalPullRefresh>

        <RedoBanner items={redoBanner} onOpen={openRedo} onClose={closeRedoBanner} />

        <CompleteCelebration
          open={celebrate}
          onClose={() => setCelebrate(false)}
          name={view.name}
          streak={coll.view?.stats.streak ?? 0}
          total={coll.view?.stats.completeTotal ?? 0}
        />



        <nav className="student-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
          <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 py-2">
            {navItems.map((n) => (
              <li key={n.id} className="flex-1">
                <button
                  type="button"
                  aria-current={screen === n.id ? "page" : undefined}
                  onClick={() => setScreen(n.id)}
                  className={`student-tab flex w-full min-w-[64px] flex-col items-center rounded-2xl px-2 py-1.5 text-[11px] font-bold transition-all ${
                    screen === n.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span className="text-xl">{n.icon}</span>
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
