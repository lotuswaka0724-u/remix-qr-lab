import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import CollectionIcon from "@/components/CollectionIcon";
import CollectionPanel, { useCollection } from "@/components/CollectionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { backgroundCss } from "@/lib/collection-catalog";
import { playError } from "@/lib/feedback";
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
          "ログイン番号を入れると、自分の今日の宿題・ポイント・ガチャ・コレクションが見られるページです。",
      },
      { property: "og:title", content: "わたしのページ | 宿題チェッカー" },
      {
        property: "og:description",
        content: "ログイン番号でひらく、自分だけの宿題とポイントとコレクションのページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPage,
});

type Screen = "home" | "homework" | "points" | "gacha" | "collection";

function MyPage() {
  const login = useServerFn(studentLogin);
  const fetchView = useServerFn(getStudentView);
  const logout = useServerFn(studentLogout);

  const [view, setView] = useState<StudentView | null>(null);
  const [ready, setReady] = useState(false);
  const [num, setNum] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");

  const coll = useCollection();

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
    <section className="kid-panel p-5 text-center">
      <h2 className="font-display text-base font-bold">🪙 ポイント</h2>
      <p className="mt-2 font-display text-5xl font-bold text-primary tabular-nums">
        {view.available}
        <span className="ml-1 text-base">pt</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        つうさん {view.earned}pt ／ つかった {view.spent}pt
      </p>
      {coll.view && <p className="mt-2 text-xs font-bold text-primary">カードランク：{coll.view.rank}</p>}
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
    { id: "collection", label: "コレクション", icon: "🗂️" },
  ];

  return (
    <div className="min-h-svh" style={{ background: backgroundCss(equipped.background) }}>
      <main className="mx-auto max-w-5xl space-y-4 px-3 py-5 pb-28">
        <header className="kid-panel flex flex-wrap items-center gap-3 p-3">
          <CollectionIcon iconId={equipped.icon} frameId={equipped.frame} size={48} />
          <div className="mr-auto">
            <p className="font-display text-lg font-bold">{view.name} さん</p>
            <p className="text-xs text-muted-foreground">
              {view.className} ／ {view.date}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] px-4 py-2 font-display text-sm font-bold text-primary-foreground tabular-nums">
            🪙 ポイント {view.available.toLocaleString()} pt
          </span>
          {coll.view && (
            <span className="rounded-full bg-warning-soft px-4 py-2 font-display text-sm font-bold text-warning-foreground">
              👑 ランク {coll.view.rank}
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
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => setScreen("collection")}
                  aria-label="コレクションをひらく"
                  className="transition-transform hover:-translate-y-1"
                >
                  <CollectionIcon iconId={equipped.icon} frameId={equipped.frame} size={110} />
                </button>

                <div className="min-w-[220px] flex-1 space-y-3">
                  <div className="rounded-3xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
                    <p className="font-display text-lg font-bold">こんにちは！</p>
                    <p className="text-sm text-muted-foreground">
                      宿題を出して ポイントをためて ガチャを まわそう！
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
                        style={{
                          width: `${view.items.length ? (done / view.items.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setScreen("collection")}
                    className="flex w-full items-center gap-3 rounded-3xl bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
                  >
                    <span className="text-3xl">🗂️</span>
                    <span>
                      <span className="block font-display text-base font-bold">コレクション</span>
                      <span className="block text-xs text-muted-foreground">
                        あつめた {ownedCount} / {totalCount} こ
                      </span>
                    </span>
                    <span className="ml-auto text-xl">→</span>
                  </button>
                </div>
              </div>
            </section>

            <div className="grid gap-3 lg:grid-cols-2">
              {homeworkCard}
              {pointsCard}
            </div>
          </>
        )}

        {screen === "homework" && homeworkCard}
        {screen === "points" && pointsCard}
        {(screen === "gacha" || screen === "collection") && (
          <CollectionPanel api={coll} screen={screen} />
        )}

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
          <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 py-2">
            {navItems.map((n) => (
              <li key={n.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => setScreen(n.id)}
                  className={`flex w-full min-w-[64px] flex-col items-center rounded-2xl px-2 py-1.5 text-[11px] font-bold transition-all ${
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
