import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import SuccessFx, { type Hit } from "@/components/SuccessFx";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  playError,
  playRankSuccess,
  playRankUp,
  playSuccess,
  SOUND_PRESETS,
  speak,
  vibrate,
} from "@/lib/feedback";
import {
  clearToday,
  cycleRecord,
  earnedPoints,
  isSubmitted,
  parseQr,
  rankOf,
  rankOfPoints,
  ranking,
  setRecord,
  STATUS_META,
  STATUS_ORDER,
  toStatus,
  todayKey,
  updateSettings,
  useAppState,
  type Status,
} from "@/lib/homework-store";
import { RANK_STYLE } from "@/lib/rank-style";

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
  const rank = useMemo(() => ranking(state, classFilter), [state, classFilter]);

  const total = students.length * todayAssignments.length;
  const done = students.reduce(
    (acc, s) => acc + todayAssignments.filter((a) => isSubmitted(day[s.id]?.[a.id])).length,
    0,
  );
  const pct = total ? Math.round((done / total) * 100) : 0;

  const pendingCount = students.filter((s) =>
    todayAssignments.some((a) => !isSubmitted(day[s.id]?.[a.id])),
  ).length;


  const celebrate = (hitData: Omit<Hit, "id">, studentId: string) => {
    setHit({ ...hitData, id: Date.now() });
    setFlashRow(studentId);
    window.setTimeout(() => setHit(null), hitData.rankUp ? 2600 : 1300);
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
    setRecord(student.id, target.id, state.settings.scanStatus);
    playSuccess(state.settings.sound);
    if (state.settings.vibe) vibrate(60);
    if (state.settings.speak) speak(`${student.name}さん、${target.name}`);
    celebrate(student.name, target.name, student.id);
  };

  const doneStudents = students.filter(
    (s) => todayAssignments.length > 0 && todayAssignments.every((a) => isSubmitted(day[s.id]?.[a.id])),
  ).length;

  return (
    <main className="mx-auto w-full max-w-[1600px] px-3 pb-3 pt-2 lg:h-[calc(100svh-62px)] lg:overflow-hidden">
      <h1 className="sr-only">宿題チェッカー スキャン画面</h1>
      <SuccessFx hit={hit} />

      {/* ---- 今日の提出状況（横長バー） ---- */}
      <section className="glass-panel mb-3 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="font-display text-sm font-bold">今日の提出状況</p>
          <p className="font-display text-xl font-bold leading-none">
            {done}
            <span className="text-xs font-bold text-muted-foreground"> / {total} 件</span>
          </p>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            全部そろった人 {doneStudents} / {students.length} 人
          </span>
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            未提出 {total - done} 件・{pendingCount} 人
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-xs text-destructive"
            onClick={() => {
              if (confirm("今日の記録をすべてリセットしますか？")) clearToday();
            }}
          >
            今日の記録をリセット
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))] transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right font-display text-lg font-bold text-primary">
            {pct}%
          </span>
        </div>
      </section>

      <div className="grid gap-3 lg:h-[calc(100%-84px)] lg:grid-cols-[300px_minmax(0,1fr)]">

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

            <label className="mt-2 block rounded-2xl bg-primary/5 p-2 text-xs font-bold">
              読み取ったときの記録
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-medium"
                value={state.settings.scanStatus}
                onChange={(e) => updateSettings({ scanStatus: e.target.value as Status })}
              >
                {STATUS_ORDER.filter((s) => s !== "none").map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}（{state.pointRules[s]}pt）
                  </option>
                ))}
              </select>
            </label>


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

          {/* ---- ポイントランキング ---- */}
          <section className="glass-panel flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">ポイントランキング</h2>
              <a
                href="/points"
                className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
              >
                ガチャ
              </a>
            </div>
            <ol className="min-h-0 flex-1 space-y-1 overflow-auto">
              {rank.map((r, i) => (
                <li
                  key={r.student.id}
                  className={`flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm ${
                    i < 3 ? "bg-primary/10 font-bold text-primary" : "bg-muted/50"
                  }`}
                >
                  <span className="w-5 shrink-0 text-center tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{r.student.name}</span>
                  <span className="shrink-0 tabular-nums">{r.points}pt</span>
                </li>
              ))}
              {rank.length === 0 && (
                <li className="py-4 text-center text-xs text-muted-foreground">名簿がありません</li>
              )}
            </ol>
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
                {students.map((s) => {
                  const allDone =
                    todayAssignments.length > 0 && todayAssignments.every((a) => isSubmitted(day[s.id]?.[a.id]));
                  return (
                  <tr
                    key={s.id}
                    className={`border-t border-border/60 odd:bg-muted/30 ${
                      allDone ? "bg-primary/5 odd:bg-primary/10" : ""
                    } ${flashRow === s.id ? "fx-row-hit" : ""}`}
                  >
                    <td className="px-3 py-1.5 tabular-nums text-muted-foreground">{s.number}</td>
                    <td
                      className={`px-3 py-1.5 font-bold ${
                        allDone ? "text-primary" : ""
                      }`}
                    >
                      {s.name}
                      {allDone && <span className="ml-1 text-xs font-bold text-primary">✓完了</span>}
                    </td>

                    {todayAssignments.map((a) => {
                      const st = toStatus(day[s.id]?.[a.id]);
                      const meta = STATUS_META[st];
                      return (
                        <td key={a.id} className="px-3 py-1.5 text-center">
                          <button
                            type="button"
                            disabled={locked}
                            onClick={() => cycleRecord(s.id, a.id)}
                            title={meta.label}
                            className={`h-8 w-8 rounded-xl text-base font-bold transition-all ${meta.tone} ${
                              st === "none" ? "hover:bg-secondary" : "shadow-[var(--shadow-lift)]"
                            } ${locked ? "cursor-not-allowed opacity-70" : ""}`}
                            aria-label={`${s.name} ${a.name} ${meta.label}`}
                          >
                            {meta.short}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}

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

      </div>
    </main>
  );
}
