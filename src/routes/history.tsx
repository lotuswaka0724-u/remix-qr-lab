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

  const hwLog = useMemo(() => {
    const names = new Map(state.assignments.map((a) => [a.id, a.name]));
    const byId = new Map(state.students.map((s) => [s.id, s]));
    return [...(state.hwEvents ?? [])]
      .filter((e) => classFilter === "all" || byId.get(e.studentId)?.className === classFilter)
      .sort((a, b) => b.at - a.at)
      .slice(0, 300)
      .map((e) => {
        const d = new Date(e.at);
        return {
          id: e.id,
          when: `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
          studentName: byId.get(e.studentId)?.name ?? "（削除済み）",
          className: byId.get(e.studentId)?.className ?? "",
          assignmentName: names.get(e.assignmentId) ?? "（削除済み）",
          label: HW_STATE_META[e.state].label,
          icon: HW_STATE_META[e.state].icon,
          delta: e.delta,
          total: e.total,
        };
      });
  }, [state.hwEvents, state.assignments, state.students, classFilter]);

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

      <section className="paper-card p-4">
        <h2 className="mb-1 font-display text-base font-bold">よみとりの記録</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          しゅくだいカードを読み取った記録です。あたらしい順にならびます。
        </p>
        {hwLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ記録がありません。</p>
        ) : (
          <ul className="space-y-1.5">
            {hwLog.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-xl bg-muted/60 px-3 py-2 text-sm"
              >
                <span className="tabular-nums text-muted-foreground">{e.when}</span>
                <span className="font-bold">{e.studentName}</span>
                <span className="text-muted-foreground">{e.className}</span>
                <span>{e.assignmentName}</span>
                <span className="font-bold">
                  {e.icon} {e.label}
                </span>
                <span className="ml-auto font-bold tabular-nums">
                  {e.delta >= 0 ? `＋${e.delta}` : e.delta}ポイント
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  ぜんぶで {e.total}ポイント
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
