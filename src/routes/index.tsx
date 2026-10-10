import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import CollectionFx from "@/components/CollectionFx";
import CollectionIcon from "@/components/CollectionIcon";
import SuccessFx, { type Hit } from "@/components/SuccessFx";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  effectFx,
  effectImage,
  fxImage,
  soundAsset,
  soundTune,
  tuneAsset,
} from "@/lib/collection-catalog";
import { getClassBadges, type ClassBadge } from "@/lib/collection.functions";
import { useCustomPrizes } from "@/lib/use-custom-prizes";
import {
  playCollectionSound,
  playError,
  playRankSuccess,
  playRankUp,
  playSuccess,
  SOUND_PRESETS,
  primeAudio,
  speak,
  vibrate,
} from "@/lib/feedback";
import {
  applyHwState,
  applyMaterialScan,
  clearToday,
  correctHwState,
  cycleRecord,
  HW_STATE_META,
  isSubmitted,
  parseHwStateQr,
  parseQr,
  rankOf,
  rankOfPoints,
  ranking,
  STATUS_META,
  toStatus,
  todayKey,
  updateSettings,
  useAppState,
  type Assignment,
  type HwState,
  type Student,
  spokenName,
} from "@/lib/homework-store";
import { verifyForgotToken } from "@/lib/hwqr.functions";
import { RANK_STYLE } from "@/lib/rank-style";
import teacherCss from "@/teacher-page.css?url";
import teacherWorld from "@/assets/collection/student-crystal-world.asset.json";

const QrScanner = lazy(() => import("@/components/QrScanner"));

/** 読み上げ用の言い方（宿題名のあとにつづける） */
const HW_PHRASE: Record<HwState, string> = {
  SUBMIT: "を提出しました",
  REDO: "は なおすところがありました",
  RESUBMIT: "を なおして出しました",
  FORGOT: "を わすれました",
  SCHOOL_DONE: "は 学校でやりました",
  NO_REPORT: "は まだ出ていません",
};

/** 一覧のチェックを押したときの操作モード（既存の処理を呼び分けるだけ） */
type MarkMode = "normal" | "redo" | "school";
const MARK_MODES: { id: MarkMode; label: string; hint: string }[] = [
  { id: "normal", label: "通常モード", hint: "チェックを押すと提出状態を切り替えます" },
  { id: "redo", label: "直しモード", hint: "チェックを押すと「直しあり」で記録します" },
  { id: "school", label: "学校モード", hint: "チェックを押すと「学校でやった」で記録します" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "stylesheet", href: teacherCss }],
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const state = useAppState();
  const verifyForgot = useServerFn(verifyForgotToken);
  const [scanning, setScanning] = useState(false);
  const [locked, setLocked] = useState(true);
  const [classFilter, setClassFilter] = useState("all");
  const [focusHw, setFocusHw] = useState("all");
  const [showTools, setShowTools] = useState(false);
  const [hit, setHit] = useState<Hit | null>(null);
  const [flashRow, setFlashRow] = useState<string | null>(null);
  const lastScan = useRef<{ text: string; at: number }>({ text: "", at: 0 });
  /** STEP1で読み取った児童（つぎに、しゅくだいのカードを読む） */
  const [pendingStudent, setPendingStudent] = useState<{
    student: Student;
    assignment?: Assignment | undefined;
  } | null>(null);
  /** 順番がおかしいときの確認 */
  const [pendingConfirm, setPendingConfirm] = useState<{
    student: Student | { id: string; name: string };
    target: { id: string; name: string };
    hw: HwState;
    message: string;
  } | null>(null);
  const [lastResult, setLastResult] = useState<{
    studentName: string;
    className: string;
    assignmentName: string;
    hw: HwState;
    delta: number;
    total: number;
  } | null>(null);
  const [manual, setManual] = useState("");
  const [markMode, setMarkMode] = useState<MarkMode>("normal");

  /** 児童がガチャで手に入れた アイコン・フレーム・音・エフェクト */
  const loadBadges = useServerFn(getClassBadges);
  const [badges, setBadges] = useState<Record<string, ClassBadge>>({});
  const [collFx, setCollFx] = useState<{ fx: string; id: number; image?: string | null } | null>(
    null,
  );
  // 先生が登録した景品（アイコン・効果音・エフェクト）も使えるようにする
  useCustomPrizes();

  useEffect(() => {
    let off = false;
    void loadBadges({})
      .then((rows) => {
        if (off) return;
        setBadges(Object.fromEntries((rows ?? []).map((b) => [b.studentId, b])));
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [loadBadges]);

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

  /** 記録できたときの共通処理（音・演出・表示） */
  const afterRecord = (
    student: { id: string; name: string },
    target: { id: string; name: string },
    res: { delta: number; total: number; state: HwState },
    before: ReturnType<typeof rankOf>,
  ) => {
    setPendingConfirm(null);
    setPendingStudent(null);
    const after = rankOfPoints(state.rankRules, res.total);
    const rankUp = after !== before ? after : null;
    const hw = res.state;

    setLastResult({
      studentName: student.name,
      className: state.students.find((s) => s.id === student.id)?.className ?? "",
      assignmentName: target.name,
      hw,
      delta: res.delta,
      total: res.total,
    });

    playRankSuccess(after, state.settings.sound);
    if (rankUp) window.setTimeout(() => playRankUp(rankUp), 320);
    if (state.settings.vibe)
      vibrate(rankUp ? [70, 60, 70, 60, 120] : after === "BLACK" ? [60, 40, 90] : 60);
    if (state.settings.speak) {
      // 宿題名（教材名）を入れて読み上げる。例:「山田さん、音読カードを提出しました。」
      const hwName = target.name?.trim();
      const phrase = hwName ? `${hwName}${HW_PHRASE[hw]}` : HW_STATE_META[hw].label;
      const said = spokenName(state.students.find((s) => s.id === student.id), student.name);
      speak(
        rankUp
          ? `${said}さん、${RANK_STYLE[rankUp].jp}カードになりました`
          : `${said}さん、${phrase}`,
      );
    }
    celebrate(
      {
        student: student.name,
        assignment: `${target.name}／${HW_STATE_META[hw].label}`,
        rank: after,
        points: res.total,
        gain: res.delta,
        rankUp,
      },
      student.id,
    );
  };

  const fail = (
    student: { id: string; name: string },
    target: { id: string; name: string },
    res: { reason: "duplicate" | "order"; message: string },
    hw?: HwState,
  ) => {
    playError();
    if (state.settings.vibe) vibrate([80, 60, 80]);
    if (res.reason === "order" && hw) {
      setPendingConfirm({ student, target, hw, message: res.message });
      toast.warning(res.message, { description: `${student.name}／${target.name}` });
    } else {
      toast.info(res.message, { description: `${student.name}／${target.name}` });
    }
  };

  const record = (
    student: { id: string; name: string },
    target: { id: string; name: string },
    hw: HwState,
    force = false,
  ) => {
    const before = rankOf(state, student.id);
    const res = applyHwState(student.id, target.id, hw, { force });
    if (!res.ok) return fail(student, target, res, hw);
    afterRecord(student, target, res, before);
  };

  /**
   * 先生が一覧から1タップで「直しあり」「学校でやった」にする。
   * すでに「わすれました」などが記録ずみのときは、古い記録を無効にして訂正する。
   */
  const teacherMark = (
    student: { id: string; name: string },
    target: { id: string; name: string },
    hw: HwState,
  ) => {
    const before = rankOf(state, student.id);
    const res = correctHwState(student.id, target.id, hw);
    if (!res.ok) {
      toast.info(res.message, { description: `${student.name}／${target.name}` });
      return;
    }
    afterRecord(student, target, res, before);
  };

  /** 教材QRだけで提出（2回目は直し完了になる） */
  const recordMaterial = (
    student: { id: string; name: string },
    target: { id: string; name: string },
  ) => {
    const before = rankOf(state, student.id);
    const res = applyMaterialScan(student.id, target.id);
    if (!res.ok) return fail(student, target, res);
    afterRecord(student, target, res, before);
  };

  const playBadgeFx = (studentId: string, withSound = true) => {
    const badge = badges[studentId];
    const myRank = rankOf(state, studentId);
    const tune = soundTune(badge?.sound);
    const asset = soundAsset(badge?.sound) ?? tuneAsset(tune);
    if (withSound && (tune || asset)) playCollectionSound(tune, myRank, asset);
    const fx = effectFx(badge?.effect) ?? (myRank === "NORMAL" ? null : myRank.toLowerCase());
    if (fx) setCollFx({ fx, id: Date.now(), image: effectImage(badge?.effect) ?? fxImage(fx) });
  };

  const handleDetected = (text: string) => {
    const now = Date.now();
    if (lastScan.current.text === text && now - lastScan.current.at < 2500) return;
    lastScan.current = { text, at: now };

    // ⓪ 署名つきの「わすれました」カード（1回の読み取りだけで完結する）
    if (text.trim().startsWith("HWT1:")) {
      void (async () => {
        const res = await verifyForgot({ data: { text } }).catch(() => null);
        if (!res?.ok) {
          playError();
          toast.error("このQRは使えません", { description: "先生に知らせてください" });
          return;
        }
        const student = state.students.find((s) => s.id === res.studentId);
        const target = state.assignments.find((a) => a.id === res.assignmentId);
        if (!student || !target) {
          playError();
          toast.error("児童または宿題が見つかりません");
          return;
        }
        setPendingStudent(null);
        // わすれましたは専用の音（成功音設定）だけを鳴らす。アイテムの音は重ねない
        playBadgeFx(student.id, false);
        record(student, target, "FORGOT");
      })();
      return;
    }

    // ① しゅくだいカードQR（児童がつかうのは「わすれました」だけ。宿題名つきに対応）
    const hwQr = parseHwStateQr(text);
    if (hwQr) {
      if (!pendingStudent) {
        playError();
        toast.warning("さきに教材のQRか、児童のQRを読み取ってください");
        return;
      }
      const named = hwQr.assignmentName
        ? state.assignments.find(
            (a) =>
              a.name.replace(/[\s\u3000]/g, "") === hwQr.assignmentName!.replace(/[\s\u3000]/g, ""),
          )
        : undefined;
      const target =
        named ??
        pendingStudent.assignment ??
        (focusHw === "all" ? todayAssignments[0] : todayAssignments.find((a) => a.id === focusHw));
      if (!target) {
        playError();
        toast.error("宿題が特定できません", { description: "管理画面で宿題を登録してください" });
        return;
      }
      record(pendingStudent.student, target, hwQr.state);
      return;
    }

    // ② 教材QR（児童名＋教材名）→ これだけで提出が完了する
    const { student, assignment } = parseQr(text, state);
    if (!student) {
      playError();
      if (state.settings.vibe) vibrate([80, 60, 80]);
      toast.error("該当する児童が見つかりません", { description: text });
      return;
    }
    if (assignment) {
      playBadgeFx(student.id);
      recordMaterial(student, assignment);
      return;
    }

    // ③ 児童QRだけのとき（「わすれました」カードを使うときなど）
    setPendingConfirm(null);
    setPendingStudent({ student, assignment });
    playBadgeFx(student.id);
    playSuccess(state.settings.sound);
    if (state.settings.speak) speak(`${spokenName(state.students.find((s) => s.id === student.id), student.name)}さん、カードをかざしてください`);
    toast.success(`${student.name} さん`, {
      description: "「わすれました」のカードを読み取ってください",
    });
  };

  const doneStudents = students.filter(
    (s) =>
      todayAssignments.length > 0 && todayAssignments.every((a) => isSubmitted(day[s.id]?.[a.id])),
  ).length;

  return (
    <main className="teacher-scan-page mx-auto w-full max-w-[1920px] px-3 pb-2 pt-2 lg:flex lg:h-[calc(100svh-62px)] lg:flex-col lg:overflow-hidden" style={{ "--teacher-world-image": `url("${teacherWorld.url}")` } as React.CSSProperties}>
      <h1 className="sr-only">宿題チェッカー スキャン画面</h1>
      <SuccessFx hit={hit} />
      <CollectionFx
        fx={collFx?.fx ?? null}
        rank={
          pendingStudent
            ? (rankOf(state, pendingStudent.student.id) as "NORMAL" | "GOLD" | "BLACK")
            : "NORMAL"
        }
        playId={collFx?.id ?? null}
        image={collFx?.image ?? null}
      />

      {/* ---- 今日の提出状況（横長バー） ---- */}
      <section className="glass-panel mb-2 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="font-display text-sm font-bold">今日の提出状況</p>
          <p className="teacher-metric font-display text-xl font-bold leading-none">
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
          <span className="teacher-metric w-14 shrink-0 text-right font-display text-lg font-bold text-primary">
            {pct}%
          </span>
        </div>
      </section>

      {/* ---- 今日のランキング（10位まで横一列） ---- */}
      <section className="teacher-ranking glass-panel mb-2 flex items-center gap-2 px-3 py-1.5">
        <a
          href="/points"
          className="shrink-0 font-display text-sm font-bold leading-tight"
          title="ポイント"
        >
          ランキング
        </a>
        <ol className="grid min-w-0 flex-1 grid-cols-5 gap-1.5 lg:grid-cols-10">
          {rank.slice(0, 10).map((r, i) => (
            <li
              key={r.student.id}
              className={`flex min-w-0 items-center gap-1 rounded-xl px-1.5 py-1 text-sm ${
                i < 3 ? "bg-primary/15 font-bold text-primary" : "bg-muted/50"
              }`}
            >
              <span className="teacher-rank-number shrink-0 font-display font-bold tabular-nums">{i + 1}</span>
              <CollectionIcon
                iconId={badges[r.student.id]?.icon}
                frameId={badges[r.student.id]?.frame}
                size={22}
              />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate font-bold">{r.student.name}</span>
                <span className="teacher-rank-points block truncate text-[11px] tabular-nums opacity-80">
                  {r.points}pt{" "}
                  <span
                    className={`rounded-full px-1 text-[9px] font-bold ${
                      RANK_STYLE[rankOfPoints(state.rankRules, r.points)].badge
                    }`}
                  >
                    {RANK_STYLE[rankOfPoints(state.rankRules, r.points)].label}
                  </span>
                </span>
              </span>
            </li>
          ))}
          {rank.length === 0 && (
            <li className="col-span-full text-center text-xs text-muted-foreground">名簿がありません</li>
          )}
        </ol>
      </section>

      <div className="grid gap-2 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(320px,30%)_minmax(0,1fr)]">
        {/* ---- 左：スキャナー ---- */}
        <div className="flex min-h-0 flex-col">
          <section className="teacher-scanner glass-panel flex min-h-0 flex-1 flex-col overflow-auto p-3">
            <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <h2 className="truncate font-display text-sm font-bold">カメラ読み取り</h2>
              <Button
                size="sm"
                className="rounded-full"
                variant={scanning ? "secondary" : "default"}
                onClick={() => {
                  primeAudio();
                  setScanning((v) => !v);
                }}
              >
                {scanning ? "停止" : "開始"}
              </Button>
            </div>

            {/* ---- チェックを押したときの操作モード ---- */}
            <div role="radiogroup" aria-label="チェックの操作モード" className="mb-2 grid grid-cols-3 gap-1.5">
              {MARK_MODES.map((m) => {
                const on = markMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMarkMode(m.id)}
                    className={`teacher-mode-btn min-h-12 rounded-xl border-2 px-2 text-sm font-bold transition-all ${
                      on
                        ? "border-primary"
                        : "border-border bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {on ? "● " : ""}
                    {m.label}
                  </button>
                );
              })}
            </div>
            <p className="-mt-1 mb-2 text-xs font-bold text-primary">
              いまは「{MARK_MODES.find((m) => m.id === markMode)?.label}」：{MARK_MODES.find((m) => m.id === markMode)?.hint}
            </p>

            <Suspense fallback={<div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />}>
              <QrScanner active={scanning} onDetected={handleDetected} />
            </Suspense>

            {/* ---- 手入力（カメラが使えないとき） ---- */}
            <form
              className="mt-2 flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const v = manual.trim();
                if (!v) return;
                lastScan.current = { text: "", at: 0 };
                handleDetected(v);
                setManual("");
              }}
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="手入力（児童名／しゅくだいのカード）"
                aria-label="手入力"
                className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs"
              />
              <Button type="submit" size="sm" variant="secondary" className="rounded-full">
                記録
              </Button>
            </form>

            {/* ---- 読み取りのしかた ---- */}
            <div className="mt-2 rounded-2xl bg-primary/5 p-2.5 text-xs">
              <p className="font-bold">
                提出は「教材のQR」だけでOK
                <span className="ml-1 font-medium text-muted-foreground">
                  ／ 直しが終わったら、同じ教材のQRをもう一度
                </span>
              </p>
              {pendingStudent ? (
                <p className="mt-1 font-bold text-primary">
                  {pendingStudent.student.name} さん
                  {pendingStudent.assignment ? `／${pendingStudent.assignment.name}` : ""}
                  <span className="ml-1 font-medium text-muted-foreground">
                    「わすれました」のカードをかざしてください
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  わすれたときだけ、児童のQR →「わすれました」カードの順に読み取ります。
                </p>
              )}
              {pendingStudent && (
                <button
                  type="button"
                  className="mt-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                  onClick={() => {
                    setPendingStudent(null);
                    setPendingConfirm(null);
                  }}
                >
                  えらび直す
                </button>
              )}
            </div>

            {pendingConfirm && (
              <div className="mt-2 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-2.5 text-xs">
                <p className="font-bold text-destructive">{pendingConfirm.message}</p>
                <p className="mt-0.5">
                  {pendingConfirm.student.name}／{pendingConfirm.target.name}／
                  {HW_STATE_META[pendingConfirm.hw].label}
                </p>
                <div className="mt-1.5 flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() =>
                      record(pendingConfirm.student, pendingConfirm.target, pendingConfirm.hw, true)
                    }
                  >
                    先生が確認して記録する
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => setPendingConfirm(null)}
                  >
                    やめる
                  </Button>
                </div>
              </div>
            )}

            {lastResult && (
              <div
                className={`mt-2 rounded-2xl border-2 p-2.5 text-xs ${HW_STATE_META[lastResult.hw].card}`}
              >
                <p className="font-display text-base font-bold leading-tight">
                  {lastResult.studentName}
                  <span className="ml-1 text-[11px] font-normal opacity-80">
                    {lastResult.className}
                  </span>
                </p>
                <p className="mt-0.5 font-bold">{lastResult.assignmentName}</p>
                <p className="mt-0.5 font-bold">
                  {HW_STATE_META[lastResult.hw].icon} {HW_STATE_META[lastResult.hw].label}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold tabular-nums">
                  {lastResult.delta >= 0 ? `＋${lastResult.delta}` : lastResult.delta}ポイント
                </p>
                <p className="text-[11px] opacity-80">ぜんぶで {lastResult.total} ポイント</p>
              </div>
            )}

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
        </div>

        {/* ---- 右：提出一覧（2列でクラス全員を一画面に） ---- */}
        <section className="teacher-submissions glass-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-3 py-1.5">
            <h2 className="mr-auto font-display text-sm font-bold">提出一覧</h2>
            <select
              className="rounded-full border border-input bg-background px-3 py-1 text-xs"
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
              className="rounded-full border border-input bg-background px-3 py-1 text-xs"
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
              className="h-7 rounded-full"
              variant={locked ? "outline" : "default"}
              onClick={() => setLocked((v) => !v)}
            >
              {locked ? "編集ロック中" : "編集できます"}
            </Button>
          </div>

          <div className="grid min-h-0 flex-1 gap-2 overflow-auto p-1.5 xl:grid-cols-2">
            {(students.length > 15
              ? [students.slice(0, Math.ceil(students.length / 2)), students.slice(Math.ceil(students.length / 2))]
              : [students]
            ).map((col, ci) => (
              <table key={ci} className="w-full self-start text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-primary text-left text-xs text-primary-foreground">
                    <th className="w-8 px-1.5 py-1 font-bold">番号</th>
                    <th className="w-[9.5em] px-1.5 py-1 font-bold">氏名</th>
                    {todayAssignments.map((a) => (
                      <th key={a.id} className="px-1 py-1 text-center font-bold">
                        <span className="line-clamp-1">{a.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {col.map((s) => {
                    const allDone =
                      todayAssignments.length > 0 &&
                      todayAssignments.every((a) => isSubmitted(day[s.id]?.[a.id]));
                    return (
                      <tr
                        key={s.id}
                        className={`border-t border-border/60 odd:bg-muted/30 ${
                          allDone ? "bg-primary/5 odd:bg-primary/10" : ""
                        } ${flashRow === s.id ? "fx-row-hit" : ""}`}
                      >
                        <td className="px-1.5 py-0.5 text-center tabular-nums text-muted-foreground">
                          {s.number}
                        </td>
                        <td className={`whitespace-nowrap px-1.5 py-0.5 font-bold ${allDone ? "text-primary" : ""}`}>
                          <span className="flex min-w-0 items-center gap-1">
                            <CollectionIcon
                              iconId={badges[s.id]?.icon}
                              frameId={badges[s.id]?.frame}
                              size={20}
                            />
                            <span className="text-[15px]">{s.name}</span>
                            {allDone && (
                              <span className="shrink-0 text-xs font-bold text-primary">✓</span>
                            )}
                          </span>
                        </td>

                        {todayAssignments.map((a) => {
                          const st = toStatus(day[s.id]?.[a.id]);
                          const meta = STATUS_META[st];
                          return (
                            <td key={a.id} className="px-1 py-0.5 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  disabled={markMode === "normal" && locked}
                                  onClick={() => {
                                    if (markMode === "redo") teacherMark(s, a, "REDO");
                                    else if (markMode === "school") teacherMark(s, a, "SCHOOL_DONE");
                                    else cycleRecord(s.id, a.id);
                                  }}
                                  title={meta.label}
                                  className={`h-9 w-9 shrink-0 rounded-lg text-base font-bold transition-all ${meta.tone} ${
                                    st === "none"
                                      ? "hover:bg-secondary"
                                      : "shadow-[var(--shadow-lift)]"
                                  } ${markMode === "normal" && locked ? "cursor-not-allowed opacity-70" : ""}`}
                                  aria-label={`${s.name} ${a.name} ${meta.label}（${MARK_MODES.find((m) => m.id === markMode)?.label}）`}
                                >
                                  {meta.short}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}
            {students.length === 0 && (
              <p className="px-3 py-10 text-center text-muted-foreground">
                名簿がまだありません。管理画面から追加してください。
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
