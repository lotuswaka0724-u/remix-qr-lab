import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { AvatarView, type Equipped } from "@/components/AvatarView";
import {
  AvatarCreate,
  GameMenu,
  GameScreen,
  useGame,
  type GameScreenId,
} from "@/components/GamePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameEngine } from "@/lib/demo-game";
import { playError } from "@/lib/feedback";
import { createAvatar, drawItemGacha, equipItem, getGame } from "@/lib/game.functions";
import { STATUS_META } from "@/lib/homework-store";
import {
  getStudentView,
  studentLogin,
  studentLogout,
  type StudentView,
} from "@/lib/student.functions";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "わたしのページ | 宿題チェッカー" },
      {
        name: "description",
        content:
          "ログイン番号を入れると、自分の今日の宿題・ポイント・アバター・ガチャが見られるページです。",
      },
      { property: "og:title", content: "わたしのページ | 宿題チェッカー" },
      {
        property: "og:description",
        content: "ログイン番号でひらく、自分だけの宿題とポイントとアバターのページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPage,
});

type Screen = "home" | "homework" | "points" | GameScreenId;

function MyPage() {
  const login = useServerFn(studentLogin);
  const fetchView = useServerFn(getStudentView);
  const logout = useServerFn(studentLogout);
  const fetchGame = useServerFn(getGame);
  const createFn = useServerFn(createAvatar);
  const equipFn = useServerFn(equipItem);
  const drawFn = useServerFn(drawItemGacha);

  const [view, setView] = useState<StudentView | null>(null);
  const [ready, setReady] = useState(false);
  const [num, setNum] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");

  const engine: GameEngine = useMemo(
    () => ({
      load: () => fetchGame({}),
      create: (equipped) => createFn({ data: { equipped } }),
      equip: (itemId, off) => equipFn({ data: { itemId, off } }),
      draw: () => drawFn({}),
    }),
    [fetchGame, createFn, equipFn, drawFn],
  );
  const game = useGame(engine);

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
      <main className="mx-auto max-w-sm px-4 py-12">
        <form onSubmit={onLogin} className="glass-panel space-y-5 p-6 text-center">
          <h1 className="font-display text-2xl font-bold">ログイン番号を いれてください</h1>
          <Input
            value={num}
            onChange={(e) => setNum(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            autoComplete="off"
            maxLength={8}
            placeholder="83112"
            className="h-16 text-center font-display text-3xl tracking-[0.3em]"
            aria-label="ログイン番号"
          />
          {error && <p className="text-base font-bold text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="h-14 w-full rounded-full text-lg">
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
  const gv = game.view;
  const created = !!gv?.data.created;

  const homeworkCard = (
    <section className="glass-panel p-4">
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
                className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-3 text-base"
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
        <p className="mt-3 rounded-2xl bg-primary/10 px-4 py-2 text-center font-display font-bold text-primary">
          今日の宿題は ぜんぶ出せました！
        </p>
      )}
    </section>
  );

  const pointsCard = (
    <section className="glass-panel p-5 text-center">
      <h2 className="font-display text-base font-bold">🪙 ポイント</h2>
      <p className="mt-2 font-display text-5xl font-bold text-primary tabular-nums">
        {view.available}
        <span className="ml-1 text-base">pt</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        つうさん {view.earned}pt ／ つかった {view.spent}pt
      </p>
      {gv && (
        <p className="mt-2 text-xs font-bold text-primary">カードランク：{gv.rank}</p>
      )}
      <Button className="mt-4 rounded-full px-8" onClick={() => setScreen("gacha")}>
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

  const navItems: { id: Screen; label: string; icon: string }[] = [
    { id: "home", label: "ホーム", icon: "🏠" },
    { id: "homework", label: "宿題", icon: "📚" },
    { id: "points", label: "ポイント", icon: "🪙" },
    { id: "gacha", label: "ガチャ", icon: "🎁" },
    { id: "avatar", label: "アバター", icon: "🧑‍🎤" },
    { id: "pet", label: "ペット", icon: "🐾" },
    { id: "room", label: "マイルーム", icon: "🛏️" },
    { id: "box", label: "アイテムBOX", icon: "🎒" },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-3 py-5 pb-28">
      <header className="kid-panel flex flex-wrap items-center gap-3 p-3">
        <span className="grid h-12 w-12 place-content-center overflow-hidden rounded-full bg-secondary">
          {created && gv ? (
            <AvatarView equipped={gv.data.equipped as Equipped} size={48} crop={{ x: 46, y: 40, w: 108, h: 108 }} />
          ) : (
            <span className="text-2xl">🙂</span>
          )}
        </span>
        <div className="mr-auto">
          <p className="font-display text-lg font-bold">{view.name} さん</p>
          <p className="text-xs text-muted-foreground">
            {view.className} ／ {view.date}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] px-4 py-2 font-display text-sm font-bold text-primary-foreground tabular-nums">
          🪙 ポイント {view.available.toLocaleString()} pt
        </span>
        {gv && (
          <span className="rounded-full bg-warning-soft px-4 py-2 font-display text-sm font-bold text-warning-foreground">
            👑 ランク {gv.rank}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await logout({});
            setView(null);
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
            <div className="flex flex-wrap items-end gap-4">
              <button
                type="button"
                onClick={() => setScreen("avatar")}
                aria-label="アバターをかえる"
                className="transition-transform hover:-translate-y-1"
              >
                {created && gv ? (
                  <AvatarView equipped={gv.data.equipped as Equipped} size={190} />
                ) : (
                  <span className="grid h-[190px] w-[130px] place-content-center text-6xl">🧑‍🎤</span>
                )}
              </button>

              <div className="min-w-[220px] flex-1 space-y-3">
                <div className="relative rounded-3xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                  <p className="font-display text-lg font-bold">こんにちは！</p>
                  <p className="text-sm text-muted-foreground">
                    {created ? "今日も がんばろう！" : "さいしょに じぶんのアバターを作ろう！"}
                  </p>
                </div>

                <div className="rounded-3xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                  <p className="flex items-center text-sm font-bold">
                    今日の宿題
                    <span className="ml-auto font-display text-lg text-primary tabular-nums">
                      {done} / {view.items.length}
                    </span>
                  </p>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all"
                      style={{ width: `${view.items.length ? (done / view.items.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen("avatar")}
                  className="flex w-full items-center gap-3 rounded-3xl bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="text-3xl">🧑‍🎤</span>
                  <span>
                    <span className="block font-display text-base font-bold">アバターをかえる</span>
                    <span className="block text-xs text-muted-foreground">自分だけのキャラを作ろう！</span>
                  </span>
                  <span className="ml-auto text-xl">→</span>
                </button>
              </div>
            </div>
          </section>

          <GameMenu onSelect={(id) => setScreen(id)} />

          <div className="grid gap-3 lg:grid-cols-2">
            {homeworkCard}
            {pointsCard}
          </div>
        </>
      )}

      {screen === "homework" && homeworkCard}
      {screen === "points" && pointsCard}

      {screen !== "home" && screen !== "homework" && screen !== "points" && (
        game.loading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">よみこみ中…</p>
        ) : !created ? (
          <AvatarCreate game={game} />
        ) : (
          <GameScreen game={game} screen={screen} onBack={() => setScreen("home")} />
        )
      )}
    </main>
  );
}
