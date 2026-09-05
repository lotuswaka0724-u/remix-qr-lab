import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import SuccessFx from "@/components/SuccessFx";
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

type Hit = { id: number; student: string; assignment: string };

function ScanPage() {
  const state = useAppState();
  const [scanning, setScanning] = useState(false);
  const [locked, setLocked] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [focusHw, setFocusHw] = useState("all");
  const [showTools, setShowTools] = useState(false);
  const [hit, setHit] = useState<Hit | null>(null);
  const [flashRow, setFlashRow] = useState<string | null>(null);
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

  const pendingCount = students.filter((s) =>
    todayAssignments.some((a) => !day[s.id]?.[a.id]),
  ).length;


  const celebrate = (student: string, assignment: string, studentId: string) => {
    setHit({ id: Date.now(), student, assignment });
    setFlashRow(studentId);
    window.setTimeout(() => setHit(null), 1300);
    window.setTimeout(() => setFlashRow(null), 1500);
  };

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
    celebrate(student.name, target.name, student.id);
  };

  const dash = 2 * Math.PI * 34;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-3 pt-2 lg:h-[calc(100svh-62px)] lg:overflow-hidden">
      <h1 className="sr-only">宿題チェッカー スキャン画面</h1>
      <SuccessFx hit={hit} />

      <div className="grid h-full gap-3 lg:grid-cols-[300px_minmax(0,1fr)_270px]">
        {/* ---- 左：スキャナー ---- */}
        <div className="flex min-h-0 flex-col gap-3">
          <section className="glass-panel flex min-h-0 flex-col overflow-hidden p-3">
            <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="truncate font-display text-sm font-bold">カメラ読み取り</h2>
              <Button
                size="sm"
                className="rounded-full"
                variant={scanning ? "secondary" : "default"}
                onClick={() => setScanning((v) => !v)}
              >
                {scanning ? "停止" : "開始"}
              </Button>
            </div>

            <Suspense fallback={<div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />}>
              <QrScanner active={scanning} onDetected={handleDetected} />
            </Suspense>

            <button
              type="button"
              onClick={() => setShowTools((v) => !v)}
              className="mt-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground"
            >
              {showTools ? "音・読み上げ設定を閉じる" : "音・読み上げ設定"}
            </button>

            {showTools && (
              <div className="mt-2 space-y-2 rounded-2xl bg-muted/60 p-3 text-sm">
                <label className="flex items-center justify-between font-medium">
                  読み上げ
                  <Switch
                    checked={state.settings.speak}
                    onCheckedChange={(v) => updateSettings({ speak: v })}
                  />
                </label>
                <label className="flex items-center justify-between font-medium">
                  バイブ
                  <Switch
                    checked={state.settings.vibe}
                    onCheckedChange={(v) => updateSettings({ vibe: v })}
                  />
                </label>
                <label className="flex items-center gap-2 font-medium">
                  <span className="shrink-0">成功音</span>
                  <select
                    className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
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
            )}
          </section>

          {/* 今日の提出状況 */}
          <section className="glass-panel shrink-0 p-3">
            <div className="flex items-center gap-3">
              <div className="relative grid h-[86px] w-[86px] shrink-0 place-items-center">
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="34" className="fill-none stroke-muted" strokeWidth="9" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    className="fill-none stroke-success transition-[stroke-dashoffset] duration-500"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={dash}
                    strokeDashoffset={dash * (1 - pct / 100)}
                  />
                </svg>
                <span className="absolute font-display text-lg font-bold">{pct}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">今日の提出状況</p>
                <p className="font-display text-2xl font-bold leading-tight">
                  {done}
                  <span className="text-sm text-muted-foreground"> / {total} 件</span>
                </p>
                <p className="text-xs font-bold text-destructive">未提出 {total - done} 件</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full text-xs text-destructive"
              onClick={() => {
                if (confirm("今日の記録をすべてリセットしますか？")) clearToday();
              }}
            >
              今日の記録をリセット
            </Button>
          </section>
        </div>

        {/* ---- 中央：提出一覧 ---- */}
        <section className="glass-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-2">
            <h2 className="mr-auto font-display text-sm font-bold">提出一覧</h2>
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
            <select
              className="rounded-full border border-input bg-background px-3 py-1.5 text-xs"
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
            <Button
              size="sm"
              className="rounded-full"
              variant={locked ? "outline" : "default"}
              onClick={() => setLocked((v) => !v)}
            >
              {locked ? "編集ロック中" : "編集できます"}
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-primary text-left text-xs text-primary-foreground">
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
                  <tr
                    key={s.id}
                    className={`border-t border-border/60 odd:bg-muted/30 ${
                      flashRow === s.id ? "fx-row-hit" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{s.number}</td>
                    <td className="px-3 py-1.5 font-bold">{s.name}</td>
                    {todayAssignments.map((a) => {
                      const ok = !!day[s.id]?.[a.id];
                      return (
                        <td key={a.id} className="px-3 py-1.5 text-center">
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => toggleRecord(s.id, a.id)}
                            className={`h-8 w-8 rounded-xl text-base font-bold transition-all ${
                              ok
                                ? "bg-success text-success-foreground shadow-[var(--shadow-lift)]"
                                : "bg-muted text-muted-foreground hover:bg-secondary"
                            } ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                            aria-label={`${s.name} ${a.name} ${ok ? "提出済み" : "未提出"}`}
                          >
                            {ok ? "✓" : "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={2 + todayAssignments.length}
                      className="px-3 py-10 text-center text-muted-foreground"
                    >
                      名簿がまだありません。管理画面から追加してください。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---- 右：未提出者 ---- */}
        <section className="glass-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
            <h2 className="font-display text-sm font-bold">未提出者</h2>
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
              {pending.length} 人
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
            {pending.map(({ student, missing }) => (
              <div key={student.id} className="rounded-2xl bg-muted/60 p-2">
                <p className="text-sm font-bold">
                  <span className="mr-1 tabular-nums text-muted-foreground">{student.number}</span>
                  {student.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {missing.map((a) => (
                    <span
                      key={a.id}
                      className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive"
                    >
                      {a.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {pending.length === 0 && total > 0 && (
              <p className="rounded-2xl bg-success-soft p-4 text-center text-sm font-bold text-success">
                全員そろいました！
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
