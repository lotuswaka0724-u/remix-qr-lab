import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { playError, playSuccess, SOUND_PRESETS, speak, vibrate } from "@/lib/feedback";
import {
  clearToday,
  parseQr,
  toggleRecord,
  todayKey,
  updateSettings,
  useAppState,
} from "@/lib/homework-store";

const QrScanner = lazy(() => import("@/components/QrScanner"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "スキャン | 宿題チェッカー" },
      {
        name: "description",
        content: "QRコードをかざすだけで宿題の提出を記録。今日の提出状況をその場で確認できます。",
      },
      { property: "og:title", content: "スキャン | 宿題チェッカー" },
      {
        property: "og:description",
        content: "QRコードをかざすだけで宿題の提出を記録。今日の提出状況をその場で確認できます。",
      },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const state = useAppState();
  const [scanning, setScanning] = useState(false);
  const [locked, setLocked] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [focusHw, setFocusHw] = useState("all");
  const lastScan = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const todayAssignments = useMemo(
    () =>
      focusHw === "all"
        ? state.assignments.filter((a) => a.inToday)
        : state.assignments.filter((a) => a.id === focusHw),
    [state.assignments, focusHw],
  );
  const students = useMemo(
    () =>
      state.students
        .filter((s) => classFilter === "all" || s.className === classFilter)
        .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number),
    [state.students, classFilter],
  );
  const day = state.records[todayKey()] ?? {};

  const total = students.length * todayAssignments.length;
  const done = students.reduce(
    (acc, s) => acc + todayAssignments.filter((a) => day[s.id]?.[a.id]).length,
    0,
  );
  const pct = total ? Math.round((done / total) * 100) : 0;

  const handleDetected = (text: string) => {
    const now = Date.now();
    if (lastScan.current.text === text && now - lastScan.current.at < 2500) return;
    lastScan.current = { text, at: now };

    const { student, assignment } = parseQr(text, state);
    if (!student) {
      playError();
      if (state.settings.vibe) vibrate([80, 60, 80]);
      toast.error("該当する児童が見つかりません", { description: text });
      return;
    }
    const target = assignment ?? todayAssignments[0];
    if (!target) {
      playError();
      toast.error("宿題が特定できません", { description: "管理画面で宿題を登録してください" });
      return;
    }
    if (day[student.id]?.[target.id]) {
      toast.info(`${student.name} さんは提出済みです`, { description: target.name });
      return;
    }
    toggleRecord(student.id, target.id, true);
    playSuccess(state.settings.sound);
    if (state.settings.vibe) vibrate(60);
    if (state.settings.speak) speak(`${student.name}さん、${target.name}`);
    toast.success(`${student.name} → ${target.name}`, { description: "提出を記録しました" });
  };

  const missingRows = students
    .map((s) => ({ student: s, missing: todayAssignments.filter((a) => !day[s.id]?.[a.id]) }))
    .filter((r) => r.missing.length > 0);

  return (
    <main className="mx-auto w-full max-w-[1400px] px-3 py-3 lg:h-[calc(100svh-4rem)] lg:overflow-hidden">
      <h1 className="sr-only">宿題チェッカー スキャン画面</h1>

      <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,300px)]">
        {/* Scanner column */}
        <div className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">

          <section className="paper-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">QRスキャナー</h2>
              <Button
                size="sm"
                variant={scanning ? "secondary" : "default"}
                onClick={() => setScanning((v) => !v)}
              >
                {scanning ? "停止" : "スキャン開始"}
              </Button>
            </div>

            <Suspense
              fallback={<div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />}
            >
              <QrScanner active={scanning} onDetected={handleDetected} />
            </Suspense>

            <p className="mt-2 text-xs text-muted-foreground">
              QRの内容は「児童名, 宿題名」の形式に対応しています。
            </p>

            <div className="mt-4 space-y-3 border-t border-border pt-3">
              <label className="flex items-center justify-between text-sm font-medium">
                読み上げ
                <Switch
                  checked={state.settings.speak}
                  onCheckedChange={(v) => updateSettings({ speak: v })}
                />
              </label>
              <label className="flex items-center justify-between text-sm font-medium">
                バイブ
                <Switch
                  checked={state.settings.vibe}
                  onCheckedChange={(v) => updateSettings({ vibe: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm font-medium">
                成功音
                <select
                  className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                  value={state.settings.sound}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateSettings({ sound: v });
                    playSuccess(v);
                  }}
                >
                  {SOUND_PRESETS.map((label, i) => (
                    <option key={label} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="paper-card overflow-hidden">
            <div className="bg-primary px-4 py-3 text-primary-foreground">
              <p className="text-xs font-bold opacity-80">今日の提出状況</p>
              <p className="font-display text-3xl font-bold">
                {done}
                <span className="text-base opacity-80"> / {total} 件</span>
              </p>
            </div>
            <div className="p-4">
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-bold text-success">達成率 {pct}%</span>
                <span className="text-muted-foreground">未提出 {total - done} 件</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full text-destructive"
                onClick={() => {
                  if (confirm("今日の記録をすべてリセットしますか？")) clearToday();
                }}
              >
                今日の記録をリセット
              </Button>
            </div>
          </section>
        </div>

        {/* Table column */}
        <section className="paper-card flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
            <h2 className="mr-auto font-display text-base font-bold">提出一覧</h2>
            <select
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
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
            <select
              className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
              value={focusHw}
              onChange={(e) => setFocusHw(e.target.value)}
            >
              <option value="all">今日の宿題すべて</option>
              {state.assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant={locked ? "outline" : "default"} onClick={() => setLocked((v) => !v)}>
              {locked ? "編集ロック中" : "編集できます"}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-muted/70 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-bold">番号</th>
                  <th className="px-3 py-2 font-bold">氏名</th>
                  {todayAssignments.map((a) => (
                    <th key={a.id} className="px-3 py-2 text-center font-bold">
                      {a.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border/70">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{s.number}</td>
                    <td className="px-3 py-2 font-bold">{s.name}</td>
                    {todayAssignments.map((a) => {
                      const ok = !!day[s.id]?.[a.id];
                      return (
                        <td key={a.id} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => toggleRecord(s.id, a.id)}
                            className={`h-9 w-9 rounded-full text-base font-bold transition-colors ${
                              ok
                                ? "bg-success-soft text-success"
                                : "bg-muted text-muted-foreground hover:bg-secondary"
                            } ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                            aria-label={`${s.name} ${a.name} ${ok ? "提出済み" : "未提出"}`}
                          >
                            {ok ? "○" : "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={2 + todayAssignments.length} className="px-3 py-10 text-center text-muted-foreground">
                      名簿がまだありません。管理画面から追加してください。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
