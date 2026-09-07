import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/lib/csv";
import { isSubmitted, useAppState } from "@/lib/homework-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "履歴 | 宿題チェッカー" },
      {
        name: "description",
        content: "日ごとの提出率と児童別の提出回数をふりかえり。過去の記録をCSVで書き出せます。",
      },
      { property: "og:title", content: "履歴 | 宿題チェッカー" },
      {
        property: "og:description",
        content: "日ごとの提出率と児童別の提出回数をふりかえれる履歴ページです。",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const state = useAppState();
  const [classFilter, setClassFilter] = useState("all");

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );

  const students = state.students.filter(
    (s) => classFilter === "all" || s.className === classFilter,
  );

  const days = useMemo(() => {
    const names = new Map(state.assignments.map((a) => [a.id, a.name]));
    return Object.keys(state.records)
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const day = state.records[date] ?? {};
        let done = 0;
        const perStudent = students.map((s) => {
          const items = Object.entries(day[s.id] ?? {})
            .filter(([, v]) => isSubmitted(v))
            .map(([id]) => names.get(id) ?? "（削除済み）");
          done += items.length;
          return { student: s, items };
        });
        const total = students.length * state.assignments.length;
        return { date, done, total, perStudent };
      })
      .filter((d) => d.done > 0);
  }, [state.records, state.assignments, students]);

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-2xl font-bold">提出の履歴</h1>
        <select
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          aria-label="クラスを選ぶ"
        >
          <option value="all">全クラス</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv("提出履歴.csv", [
              ["日付", "氏名", "提出した宿題"],
              ...days.flatMap((d) =>
                d.perStudent
                  .filter((p) => p.items.length > 0)
                  .map((p) => [d.date, p.student.name, p.items.join(" / ")]),
              ),
            ])
          }
        >
          CSVで書き出す
        </Button>
      </div>

      {days.length === 0 ? (
        <div className="paper-card grid place-content-center gap-2 p-16 text-center">
          <p className="font-display text-xl font-bold">まだ記録がありません</p>
          <p className="text-sm text-muted-foreground">
            スキャン画面で読み取ると、ここに日ごとの記録が残ります。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {days.map((d) => {
            const rate = d.total ? Math.round((d.done / d.total) * 100) : 0;
            return (
              <li key={d.date} className="paper-card p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-display text-lg font-bold">{d.date}</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    提出 {d.done} / {d.total}（{rate}%）
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                </div>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {d.perStudent.map((p) => (
                    <li key={p.student.id} className="flex gap-2 text-sm">
                      <span className="w-28 shrink-0 font-bold">{p.student.name}</span>
                      <span className="text-muted-foreground">
                        {p.items.length ? p.items.join(" / ") : "提出なし"}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
