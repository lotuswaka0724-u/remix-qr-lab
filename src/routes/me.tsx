import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { playError, playSuccess } from "@/lib/feedback";
import { STATUS_META } from "@/lib/homework-store";
import {
  getStudentView,
  studentDrawGacha,
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
          "ログイン番号を入れると、自分の今日の宿題・ポイント・ガチャだけが見られるページです。",
      },
      { property: "og:title", content: "わたしのページ | 宿題チェッカー" },
      {
        property: "og:description",
        content: "ログイン番号でひらく、自分だけの宿題とポイントのページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPage,
});

function MyPage() {
  const login = useServerFn(studentLogin);
  const fetchView = useServerFn(getStudentView);
  const draw = useServerFn(studentDrawGacha);
  const logout = useServerFn(studentLogout);

  const [view, setView] = useState<StudentView | null>(null);
  const [ready, setReady] = useState(false);
  const [num, setNum] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<string | null>(null);

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
  };

  const spin = async () => {
    if (spinning || !view) return;
    if (view.available < view.gachaCost) {
      playError();
      return;
    }
    setSpinning(true);
    setPrize(null);
    const res = await draw({});
    window.setTimeout(() => {
      setSpinning(false);
      if (res && res.ok) {
        setView(res.view);
        setPrize(res.prize);
        playSuccess(1);
      } else {
        if (res) setView(res.view);
        playError();
      }
    }, 1200);
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

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <div className="mr-auto">
          <p className="font-display text-xl font-bold">{view.name} さんのページ</p>
          <p className="text-xs text-muted-foreground">
            {view.className} ／ {view.date}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-4 py-2 font-display text-lg font-bold text-primary tabular-nums">
          {view.available}pt
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            await logout({});
            setView(null);
          }}
        >
          とじる
        </Button>
      </header>

      <section className="glass-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="mr-auto font-display text-base font-bold">今日の宿題</h2>
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
              const ok =
                a.status === "fixed" || a.status === "submitted" || a.status === "school";
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

      <section className="glass-panel p-5 text-center">
        <h2 className="font-display text-base font-bold">ポイントとガチャ</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          つうさん {view.earned}pt ／ つかった {view.spent}pt
        </p>
        <p className="mt-2 font-display text-5xl font-bold text-primary tabular-nums">
          {view.available}
          <span className="ml-1 text-base">pt</span>
        </p>

        <div
          className={`mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-4xl text-primary-foreground shadow-[var(--shadow-lift)] ${
            spinning ? "animate-spin" : ""
          }`}
        >
          {spinning ? "🎁" : prize ? "🎉" : "🎯"}
        </div>

        <Button
          className="mt-5 rounded-full px-8"
          disabled={spinning || view.available < view.gachaCost}
          onClick={spin}
        >
          ガチャを引く（{view.gachaCost}pt）
        </Button>
        {view.available < view.gachaCost && (
          <p className="mt-2 text-xs text-muted-foreground">
            あと {view.gachaCost - view.available}pt でガチャが引けます
          </p>
        )}

        {prize && !spinning && (
          <p className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 font-display text-xl font-bold text-primary">
            {prize} が出ました！
          </p>
        )}

        {view.log.length > 0 && (
          <ul className="mx-auto mt-5 max-w-md space-y-1 text-left text-xs">
            {view.log.map((g) => (
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
    </main>
  );
}
