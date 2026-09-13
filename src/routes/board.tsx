import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { isSubmitted, todayKey, useAppState } from "@/lib/homework-store";

export const Route = createFileRoute("/board")({
  head: () => ({
    meta: [
      { title: "未提出ボード | 宿題チェッカー" },
      {
        name: "description",
        content:
          "未提出の児童と宿題を大きな文字で一覧表示。教室のモニターや黒板前での確認に最適です。",
      },
      { property: "og:title", content: "未提出ボード | 宿題チェッカー" },
      {
        property: "og:description",
        content: "未提出の児童と宿題を大きな文字で一覧表示。教室での声かけにそのまま使えます。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BoardPage,
});

function BoardPage() {
  const state = useAppState();
  const [classFilter, setClassFilter] = useState("all");
  const [big, setBig] = useState(false);
  const day = state.records[todayKey()] ?? {};

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const todayAssignments = state.assignments.filter((a) => a.inToday);

  const rows = state.students
    .filter((s) => classFilter === "all" || s.className === classFilter)
    .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number)
    .map((s) => ({
      student: s,
      missing: todayAssignments.filter((a) => !isSubmitted(day[s.id]?.[a.id])),
    }))
    .filter((r) => r.missing.length > 0);

  return (
    <main className={`mx-auto max-w-5xl px-4 py-6 ${big ? "text-xl" : ""}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-2xl font-bold">未提出・忘れ リスト</h1>
        <select
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
        <Button variant={big ? "default" : "outline"} size="sm" onClick={() => setBig((v) => !v)}>
          {big ? "通常表示" : "全画面（大きく表示）"}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="paper-card grid place-content-center gap-2 p-16 text-center">
          <p className="font-display text-3xl font-bold text-success">全員そろいました！</p>
          <p className="text-muted-foreground">今日の宿題に未提出はありません。</p>
        </div>
      ) : (
        <ol className={`grid gap-3 ${big ? "" : "sm:grid-cols-2"}`}>
          {rows.map((r, i) => (
            <li key={r.student.id} className="paper-card flex items-start gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-content-center rounded-xl bg-accent-soft font-display font-bold text-accent-foreground">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className={`font-display font-bold ${big ? "text-3xl" : "text-lg"}`}>
                  {r.student.name}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {r.student.className} / {r.student.number}番
                  </span>
                </p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {r.missing.map((m) => (
                    <li
                      key={m.id}
                      className={`rounded-full bg-destructive/10 px-2.5 py-1 font-bold text-destructive ${big ? "text-lg" : "text-xs"}`}
                    >
                      {m.name}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
