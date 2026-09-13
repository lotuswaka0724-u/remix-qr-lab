import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  availablePoints,
  earnedPoints,
  ranking,
  spentPoints,
  useAppState,
} from "@/lib/homework-store";

export const Route = createFileRoute("/points")({
  head: () => ({
    meta: [
      { title: "ポイント一覧 | 宿題チェッカー" },
      {
        name: "description",
        content: "宿題の提出でたまった児童ごとのポイントとランキングを確認できるページです。",
      },
      { property: "og:title", content: "ポイント一覧 | 宿題チェッカー" },
      {
        property: "og:description",
        content: "児童ひとりひとりの獲得ポイントと使用ポイントを確認できる一覧ページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PointsPage,
});

function PointsPage() {
  const state = useAppState();
  const [classFilter, setClassFilter] = useState("all");
  const [studentId, setStudentId] = useState<string | null>(null);

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const rank = useMemo(() => ranking(state, classFilter), [state, classFilter]);
  const student = state.students.find((s) => s.id === studentId) ?? null;
  const available = student ? availablePoints(state, student.id) : 0;

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <h1 className="font-display text-2xl font-bold">ポイント一覧</h1>

      <section className="glass-panel p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display text-base font-bold">だれのポイント？</h2>
          <select
            className="rounded-full border border-input bg-background px-3 py-1.5 text-xs"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">全クラス</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rank.map((r, i) => (
            <button
              key={r.student.id}
              type="button"
              onClick={() => {
                setStudentId(r.student.id);
              }}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-all ${
                studentId === r.student.id
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                  : "bg-muted/60 hover:bg-secondary"
              }`}
            >
              <span className="w-5 shrink-0 text-center tabular-nums opacity-70">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-bold">{r.student.name}</span>
              <span className="shrink-0 tabular-nums">{availablePoints(state, r.student.id)}pt</span>
            </button>
          ))}
        </div>
      </section>

      {student && (
        <section className="glass-panel p-5 text-center">
          <p className="font-display text-lg font-bold">{student.name} さん</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ためた {earnedPoints(state, student.id)}pt ／ つかった {spentPoints(state, student.id)}pt
          </p>
          <p className="mt-2 font-display text-5xl font-bold text-primary tabular-nums">
            {available}
            <span className="ml-1 text-base">pt</span>
          </p>

          <p className="mx-auto mt-5 max-w-md rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
            ガチャとアイテムBOXは、児童本人のマイページから利用できます。
          </p>
        </section>
      )}
    </main>
  );
}
