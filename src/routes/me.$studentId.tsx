import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { playError, playSuccess } from "@/lib/feedback";
import {
  availablePoints,
  drawGacha,
  earnedPoints,
  spentPoints,
  STATUS_META,
  todayKey,
  toStatus,
  useAppState,
  type GachaResult,
} from "@/lib/homework-store";

export const Route = createFileRoute("/me/$studentId")({
  head: () => ({
    meta: [
      { title: "わたしのページ | 宿題チェッカー" },
      {
        name: "description",
        content: "今日の宿題の出し方、たまったポイント、ガチャを自分のタブレットで確認できるページです。",
      },
      { property: "og:title", content: "わたしのページ | 宿題チェッカー" },
      {
        property: "og:description",
        content: "今日の提出、ポイント、ガチャがひとつにまとまった児童ひとりひとりのページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPage,
});

function MyPage() {
  const { studentId } = Route.useParams();
  const state = useAppState();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<GachaResult | null>(null);

  const student = state.students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 text-center">
        <div className="glass-panel p-8">
          <p className="font-display text-xl font-bold">このページの持ち主が見つかりません</p>
          <p className="mt-2 text-sm text-muted-foreground">
            先生に、もう一度リンクかQRコードをもらってください。
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-bold text-primary underline">
            はじめの画面へ
          </Link>
        </div>
      </main>
    );
  }

  const today = todayKey();
  const day = state.records[today]?.[student.id] ?? {};
  const todays = state.assignments.filter((a) => a.inToday);
  const doneCount = todays.filter((a) => {
    const st = toStatus(day[a.id]);
    return st === "fixed" || st === "submitted" || st === "school";
  }).length;
  const allDone = todays.length > 0 && doneCount === todays.length;

  const available = availablePoints(state, student.id);
  const log = state.gachaLog.filter((g) => g.studentId === student.id);

  const spin = () => {
    if (spinning) return;
    if (available < state.gachaCost) {
      playError();
      return;
    }
    setSpinning(true);
    setResult(null);
    window.setTimeout(() => {
      const r = drawGacha(student.id);
      setSpinning(false);
      if (r) {
        setResult(r);
        playSuccess(state.settings.sound);
      } else {
        playError();
      }
    }, 1400);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <header className="glass-panel flex flex-wrap items-center gap-3 p-4">
        <span className="grid h-12 w-12 place-content-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--accent))] font-display text-lg font-bold text-primary-foreground">
          {student.number}
        </span>
        <div className="mr-auto">
          <p className="font-display text-xl font-bold">{student.name} さんのページ</p>
          <p className="text-xs text-muted-foreground">
            {student.className} ／ {today}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-4 py-2 font-display text-lg font-bold text-primary tabular-nums">
          {available}pt
        </span>
      </header>

      <section className="glass-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="mr-auto font-display text-base font-bold">今日の宿題</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              allDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {doneCount} / {todays.length} 出した
          </span>
        </div>

        <div className="mb-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-all"
            style={{ width: `${todays.length ? (doneCount / todays.length) * 100 : 0}%` }}
          />
        </div>

        {todays.length === 0 ? (
          <p className="text-sm text-muted-foreground">今日の宿題はまだ決まっていません。</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {todays.map((a) => {
              const meta = STATUS_META[toStatus(day[a.id])];
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-sm"
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-content-center rounded-lg font-bold ${meta.tone}`}
                  >
                    {meta.short}
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
          ためた {earnedPoints(state, student.id)}pt ／ つかった {spentPoints(state, student.id)}pt
        </p>
        <p className="mt-2 font-display text-5xl font-bold text-primary tabular-nums">
          {available}
          <span className="ml-1 text-base">pt</span>
        </p>

        <div
          className={`mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--primary),var(--accent))] text-4xl text-primary-foreground shadow-[var(--shadow-lift)] ${
            spinning ? "animate-spin" : ""
          }`}
        >
          {spinning ? "🎁" : result ? "🎉" : "🎯"}
        </div>

        <Button
          className="mt-5 rounded-full px-8"
          disabled={spinning || available < state.gachaCost}
          onClick={spin}
        >
          ガチャを引く（{state.gachaCost}pt）
        </Button>
        {available < state.gachaCost && (
          <p className="mt-2 text-xs text-muted-foreground">
            あと {state.gachaCost - available}pt でガチャが引けます
          </p>
        )}

        {result && !spinning && (
          <p className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 font-display text-xl font-bold text-primary">
            {result.prize} が出ました！
          </p>
        )}

        {log.length > 0 && (
          <ul className="mx-auto mt-5 max-w-md space-y-1 text-left text-xs">
            {log.slice(0, 10).map((g) => (
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
