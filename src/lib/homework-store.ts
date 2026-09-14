import { useSyncExternalStore } from "react";

import { getClassState, saveClassState } from "@/lib/class-sync.functions";
import { DEFAULT_GAME_SETTINGS, type GameSettings } from "@/lib/game-settings";

export type Assignment = { id: string; name: string; inToday: boolean };
export type Student = {
  id: string;
  number: number;
  name: string;
  className: string;
  /** カードに出すローマ字表記（姓→名）。入っていればこれを優先して使う */
  romaji?: string;
  /** ログイン番号のもと（年度＋学年＋クラス＋出席番号） */
  fiscalYear?: number;
  grade?: number;
  classNumber?: number;
};

/** 児童のログイン番号（年度＋学年＋クラス＋出席番号を数字でつなげたもの） */
export const loginNumber = (s: Student) =>
  s.fiscalYear && s.grade && s.classNumber
    ? `${s.fiscalYear}${s.grade}${s.classNumber}${s.number}`
    : "";

/** 提出のようす */
export type Status = "fixed" | "redo" | "submitted" | "school" | "declared" | "none";

export const STATUS_ORDER: Status[] = ["none", "submitted", "redo", "fixed", "school", "declared"];

export const STATUS_META: Record<
  Status,
  { short: string; label: string; desc: string; tone: string }
> = {
  fixed: {
    short: "完",
    label: "直し完了",
    desc: "直しまで終わらせた",
    tone: "bg-[#1d4ed8] text-white",
  },
  redo: {
    short: "直",
    label: "直しあり",
    desc: "先生が直しをお願いした（直し待ち）",
    tone: "bg-[#ca8a04] text-white",
  },
  submitted: {
    short: "✓",
    label: "提出済み",
    desc: "ふつうに提出した",
    tone: "bg-[#3b82f6] text-white",
  },
  school: {
    short: "校",
    label: "学校でやった",
    desc: "学校で終わらせて提出した",
    tone: "bg-[#60a5fa] text-white",
  },
  declared: {
    short: "忘",
    label: "忘れた",
    desc: "出していないが、忘れたことを自分で伝えた",
    tone: "bg-[#bfdbfe] text-[#1e3a8a]",
  },
  none: {
    short: "—",
    label: "未提出・申告なし",
    desc: "出していないし、忘れたことも伝えていない",
    tone: "bg-muted text-muted-foreground",
  },
};

export type PointRules = Record<Status, number>;

/* ---------- カードのランク ---------- */

export type Rank = "NORMAL" | "GOLD" | "BLACK";
/** 下位から上位の順（あとからランクを増やしやすいように配列で管理） */
export const RANK_ORDER: Rank[] = ["NORMAL", "GOLD", "BLACK"];
/** ランクごとの「必要な通算ポイント」。先生があとから変更できる */
export type RankRules = Record<Rank, number>;
export const DEFAULT_RANK_RULES: RankRules = { NORMAL: 0, GOLD: 100, BLACK: 300 };

/** 通算ポイントからランクを求める（ランクは保存せず、いつも計算で出す） */
export function rankOfPoints(rules: RankRules, points: number): Rank {
  let current: Rank = RANK_ORDER[0]!;
  for (const r of RANK_ORDER) {
    if (points >= (rules[r] ?? 0)) current = r;
  }
  return current;
}

export type GachaPrize = { id: string; name: string; weight: number };
export type GachaResult = {
  id: string;
  studentId: string;
  prize: string;
  cost: number;
  at: number;
};

/* ---------- 児童が自分でえらぶ「宿題じょうたいQR」 ---------- */

export type HwState = "SUBMIT" | "REDO" | "RESUBMIT" | "FORGOT" | "SCHOOL_DONE" | "NO_REPORT";

/** 児童がえらぶ5種類（この順番で印刷・表示する） */
export const HW_STATE_ORDER: HwState[] = ["SUBMIT", "REDO", "RESUBMIT", "FORGOT", "SCHOOL_DONE"];

export type HwStateMeta = {
  /** 児童向けのことば（この表現でそろえる） */
  label: string;
  icon: string;
  defaultPoints: number;
  /** 提出一覧に反映する記録 */
  status: Status;
  /** 先ににSUBMITが必要か */
  needsSubmit: boolean;
  /** カードの色づかい */
  card: string;
  badge: string;
  /** 先生だけがつかうもの */
  teacherOnly?: boolean;
};

export const HW_STATE_META: Record<HwState, HwStateMeta> = {
  SUBMIT: {
    label: "しゅくだいを出しました",
    icon: "📗",
    defaultPoints: 10,
    status: "submitted",
    needsSubmit: false,
    card: "bg-[#dcfce7] text-[#14532d] border-[#22c55e]",
    badge: "bg-[#16a34a] text-white",
  },
  REDO: {
    label: "なおすところがありました",
    icon: "✏️",
    defaultPoints: -3,
    status: "redo",
    needsSubmit: true,
    card: "bg-[#fef9c3] text-[#713f12] border-[#eab308]",
    badge: "bg-[#ca8a04] text-white",
  },
  RESUBMIT: {
    label: "なおして出しました",
    icon: "🔵",
    defaultPoints: 3,
    status: "fixed",
    needsSubmit: true,
    card: "bg-[#dbeafe] text-[#1e3a8a] border-[#3b82f6]",
    badge: "bg-[#2563eb] text-white",
  },
  FORGOT: {
    label: "わすれました",
    icon: "🟠",
    defaultPoints: 2,
    status: "declared",
    needsSubmit: false,
    card: "bg-[#ffedd5] text-[#7c2d12] border-[#f97316]",
    badge: "bg-[#ea580c] text-white",
  },
  SCHOOL_DONE: {
    label: "学校でやりました",
    icon: "🟣",
    defaultPoints: 1,
    status: "school",
    needsSubmit: false,
    card: "bg-[#ede9fe] text-[#4c1d95] border-[#8b5cf6]",
    badge: "bg-[#7c3aed] text-white",
  },
  NO_REPORT: {
    label: "わすれたと言っていない",
    icon: "—",
    defaultPoints: 0,
    status: "none",
    needsSubmit: false,
    card: "bg-muted text-muted-foreground border-border",
    badge: "bg-muted text-muted-foreground",
    teacherOnly: true,
  },
};

export type HwPointRules = Record<HwState, number>;

export const DEFAULT_HW_POINT_RULES: HwPointRules = {
  SUBMIT: 10,
  REDO: -3,
  RESUBMIT: 3,
  FORGOT: 2,
  SCHOOL_DONE: 1,
  NO_REPORT: 0,
};

/** 宿題じょうたいQRで記録した1件 */
export type HwEvent = {
  id: string;
  /** 対象日 */
  date: string;
  studentId: string;
  assignmentId: string;
  state: HwState;
  /** そのときのポイント増減 */
  delta: number;
  /** 処理後の通算ポイント */
  total: number;
  at: number;
  /** 「今日の記録をリセット」で無効にした記録（履歴は残すが、判定・点数には使わない） */
  voided?: boolean;
};

/**
 * 宿題じょうたいQRの中身。
 * 例: HW:SUBMIT ／ 宿題名つきは HW:FORGOT:漢字ドリル
 */
export const hwStateQrText = (s: HwState, assignmentName?: string) =>
  assignmentName && assignmentName.trim() ? `HW:${s}:${assignmentName.trim()}` : `HW:${s}`;

export type HwStateQr = { state: HwState; assignmentName?: string };

export function parseHwStateQr(text: string): HwStateQr | null {
  const raw = text.trim();
  const all = [...HW_STATE_ORDER, "NO_REPORT" as HwState];

  // HW:STATE もしくは HW:STATE:宿題名
  const m = /^HW[:：]\s*([A-Za-z_]+)\s*(?:[:：]\s*(.+))?$/.exec(raw);
  if (m) {
    const id = (m[1] ?? "").toUpperCase() as HwState;
    if (all.includes(id)) {
      const name = m[2]?.trim();
      return name ? { state: id, assignmentName: name } : { state: id };
    }
  }

  const bare = raw.toUpperCase();
  if (all.includes(bare as HwState)) return { state: bare as HwState };

  // 児童向けのことばでも判定できるようにする（例:「漢字ドリルをわすれました」）
  const plain = raw.replace(/[\s\u3000]/g, "");
  for (const s of all) {
    const label = HW_STATE_META[s].label.replace(/[\s\u3000]/g, "");
    if (plain === label) return { state: s };
    if (plain.endsWith(label)) {
      const name = plain.slice(0, plain.length - label.length).replace(/[をはの]$/, "");
      return name ? { state: s, assignmentName: name } : { state: s };
    }
  }
  return null;
}

/** date -> studentId -> assignmentId -> ようす */
export type Records = Record<string, Record<string, Record<string, Status | boolean>>>;

/** 先生が手作業でわたしたポイント */
export type ManualGrant = {
  id: string;
  studentId: string;
  amount: number;
  note?: string;
  at: number;
};

export type AppState = {
  schoolLabel: string;
  assignments: Assignment[];
  students: Student[];
  records: Records;
  settings: { sound: number; vibe: boolean; speak: boolean; scanStatus: Status };
  pointRules: PointRules;
  gachaCost: number;
  prizes: GachaPrize[];
  gachaLog: GachaResult[];
  rankRules: RankRules;
  /** 宿題じょうたいQRの点数（先生が変えられる） */
  hwPointRules: HwPointRules;
  /** 宿題じょうたいQRの記録 */
  hwEvents: HwEvent[];
  /** 先生が手で足したポイント */
  manualGrants: ManualGrant[];
  /** 将来用ゲーム設定（公開画面では使用しない） */
  gameSettings: GameSettings;
  /** 児童ごとの合言葉（先生だけが見られる） */
  codes?: Record<string, string>;
};

const KEY = "shukudai-checker-v1";

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const defaultState = (): AppState => ({
  schoolLabel: "1年1組",
  assignments: [
    { id: "hw_1", name: "国語プリント（漢字）", inToday: true },
    { id: "hw_2", name: "算数ドリル（計算）", inToday: true },
    { id: "hw_3", name: "音読カード", inToday: true },
  ],
  students: [
    { id: "st_1", number: 1, name: "青山 太郎", className: "1年1組" },
    { id: "st_2", number: 2, name: "石田 花子", className: "1年1組" },
    { id: "st_3", number: 3, name: "上田 次郎", className: "1年1組" },
  ],
  records: {},
  settings: { sound: 1, vibe: true, speak: true, scanStatus: "submitted" },
  pointRules: { fixed: 5, redo: 0, submitted: 3, school: 2, declared: 1, none: 0 },
  gachaCost: 10,
  prizes: [
    { id: "pz_1", name: "マイページ背景", weight: 20 },
    { id: "pz_2", name: "アイコン", weight: 20 },
    { id: "pz_3", name: "アイコンフレーム", weight: 20 },
    { id: "pz_4", name: "QR読み取り効果音", weight: 20 },
    { id: "pz_5", name: "QR読み取りエフェクト", weight: 20 },
  ],
  gachaLog: [],
  rankRules: { ...DEFAULT_RANK_RULES },
  hwPointRules: { ...DEFAULT_HW_POINT_RULES },
  hwEvents: [],
  manualGrants: [],
  gameSettings: { ...DEFAULT_GAME_SETTINGS },
});

let state: AppState = defaultState();
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/* ---------- クラウド同期（先生の端末と児童タブレットで共有） ---------- */

let cloudReady = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let applyingRemote = false;

export const mergeState = (parsed: Partial<AppState>): AppState => {
  const base = defaultState();
  return {
    ...base,
    ...parsed,
    settings: { ...base.settings, ...(parsed.settings ?? {}) },
    pointRules: { ...base.pointRules, ...(parsed.pointRules ?? {}) },
    rankRules: { ...base.rankRules, ...(parsed.rankRules ?? {}) },
    hwPointRules: { ...base.hwPointRules, ...(parsed.hwPointRules ?? {}) },
    gameSettings: { ...base.gameSettings, ...(parsed.gameSettings ?? {}) },
    hwEvents: parsed.hwEvents ?? [],
    manualGrants: parsed.manualGrants ?? [],
    prizes: parsed.prizes?.length ? parsed.prizes : base.prizes,
    gachaLog: parsed.gachaLog ?? [],
  };
};

const merge = mergeState;

const cache = () => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

async function pullFromCloud() {
  const remote = await getClassState();
  if (!remote) return false; // 先生としてログインしていない
  if (Object.keys(remote).length === 0) {
    void pushToCloud();
    return true;
  }
  applyingRemote = true;
  state = merge(remote);
  applyingRemote = false;
  cache();
  emit();
  return true;
}

async function startCloudSync() {
  if (cloudReady) return;
  cloudReady = true;
  try {
    const ok = await pullFromCloud();
    if (!ok) return;
    // ほかの端末の変更を取り込む
    setInterval(() => {
      if (document.visibilityState === "visible") void pullFromCloud();
    }, 6000);
  } catch {
    /* オフラインでも端末内データで動く */
  }
}

async function pushToCloud() {
  try {
    await saveClassState({ data: { state: JSON.parse(JSON.stringify(state)) as AppState } });
  } catch {
    /* 通信できないときは端末内保存のみ */
  }
}

function schedulePush() {
  if (typeof window === "undefined" || applyingRemote) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushToCloud(), 400);
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = merge(JSON.parse(raw) as Partial<AppState>);
  } catch {
    /* ignore corrupt storage */
  }
  void startCloudSync();
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
  schedulePush();
  emit();
}

export function setState(updater: (prev: AppState) => AppState) {
  state = updater(state);
  persist();
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      // 保存データの読み込みはハイドレーション後に行う（SSRとの不一致を防ぐ）
      if (!loaded) {
        queueMicrotask(() => {
          load();
          emit();
        });
      }
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

/* ---------- status helpers ---------- */

/** 旧データ（true/false）も読めるようにする */
export const toStatus = (v: Status | boolean | undefined): Status =>
  v === true ? "submitted" : !v ? "none" : (v as Status);

export const isSubmitted = (v: Status | boolean | undefined) => {
  const s = toStatus(v);
  return s === "fixed" || s === "submitted" || s === "school";
};

export const getStatus = (state: AppState, date: string, studentId: string, hwId: string) =>
  toStatus(state.records[date]?.[studentId]?.[hwId]);

export const nextStatus = (s: Status): Status =>
  STATUS_ORDER[(STATUS_ORDER.indexOf(s) + 1) % STATUS_ORDER.length]!;

/* ---------- mutations ---------- */

export const setRecord = (studentId: string, assignmentId: string, status: Status) =>
  setState((s) => {
    const day = { ...(s.records[todayKey()] ?? {}) };
    const forStudent = { ...(day[studentId] ?? {}) };
    forStudent[assignmentId] = status;
    day[studentId] = forStudent;
    return { ...s, records: { ...s.records, [todayKey()]: day } };
  });

export const cycleRecord = (studentId: string, assignmentId: string) =>
  setState((s) => {
    const cur = toStatus(s.records[todayKey()]?.[studentId]?.[assignmentId]);
    const day = { ...(s.records[todayKey()] ?? {}) };
    const forStudent = { ...(day[studentId] ?? {}) };
    forStudent[assignmentId] = nextStatus(cur);
    day[studentId] = forStudent;
    return { ...s, records: { ...s.records, [todayKey()]: day } };
  });

export const addAssignment = (name: string) =>
  setState((s) => ({
    ...s,
    assignments: [...s.assignments, { id: `hw_${uid()}`, name, inToday: true }],
  }));

export const updateAssignment = (id: string, patch: Partial<Assignment>) =>
  setState((s) => ({
    ...s,
    assignments: s.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }));

export const removeAssignment = (id: string) =>
  setState((s) => ({ ...s, assignments: s.assignments.filter((a) => a.id !== id) }));

export const addStudent = (name: string, className: string) =>
  setState((s) => ({
    ...s,
    students: [
      ...s.students,
      {
        id: `st_${uid()}`,
        number: s.students.filter((x) => x.className === className).length + 1,
        name,
        className,
      },
    ],
  }));

export const updateStudent = (id: string, patch: Partial<Student>) =>
  setState((s) => ({
    ...s,
    students: s.students.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  }));

export const removeStudent = (id: string) =>
  setState((s) => ({ ...s, students: s.students.filter((x) => x.id !== id) }));

export const updateSettings = (patch: Partial<AppState["settings"]>) =>
  setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

export const updatePointRules = (patch: Partial<PointRules>) =>
  setState((s) => ({ ...s, pointRules: { ...s.pointRules, ...patch } }));

export const setGachaCost = (cost: number) => setState((s) => ({ ...s, gachaCost: cost }));

export const updateRankRules = (patch: Partial<RankRules>) =>
  setState((s) => ({ ...s, rankRules: { ...s.rankRules, ...patch } }));

export const addPrize = (name: string, weight: number) =>
  setState((s) => ({ ...s, prizes: [...s.prizes, { id: `pz_${uid()}`, name, weight }] }));

export const updatePrize = (id: string, patch: Partial<GachaPrize>) =>
  setState((s) => ({
    ...s,
    prizes: s.prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));

export const removePrize = (id: string) =>
  setState((s) => ({ ...s, prizes: s.prizes.filter((p) => p.id !== id) }));

/**
 * 今日の記録をリセットする。
 * その日のQR記録（hwEvents）も無効にして、リセット後の教材QRが
 * 「直して出しました」と判定されないようにする（履歴自体は残す）。
 */
export const clearToday = () =>
  setState((s) => {
    const date = todayKey();
    return {
      ...s,
      records: { ...s.records, [date]: {} },
      hwEvents: (s.hwEvents ?? []).map((e) => (e.date === date ? { ...e, voided: true } : e)),
    };
  });

/* ---------- points ---------- */

const hwKey = (date: string, studentId: string, assignmentId: string) =>
  `${date}|${studentId}|${assignmentId}`;

/** 宿題じょうたいQRで処理ずみの「日付・児童・宿題」 */
const hwHandledKeys = (state: AppState) =>
  new Set(
    (state.hwEvents ?? [])
      .filter((e) => !e.voided)
      .map((e) => hwKey(e.date, e.studentId, e.assignmentId)),
  );

/**
 * これまでに貯めた合計ポイント（使った分は含まない）。
 * 旧方式（先生が状態を選んだ記録）はそのまま点数に残し、
 * 宿題じょうたいQRで処理した分は、そのときの増減で数える。
 */
export function earnedPoints(state: AppState, studentId: string) {
  const handled = hwHandledKeys(state);
  let total = 0;
  for (const [date, day] of Object.entries(state.records)) {
    const forStudent = day[studentId];
    if (!forStudent) continue;
    for (const [assignmentId, v] of Object.entries(forStudent)) {
      if (handled.has(hwKey(date, studentId, assignmentId))) continue;
      total += state.pointRules[toStatus(v)] ?? 0;
    }
  }
  for (const e of state.hwEvents ?? []) {
    if (e.studentId === studentId && !e.voided) total += e.delta;
  }
  for (const g of state.manualGrants ?? []) {
    if (g.studentId === studentId) total += g.amount;
  }
  return total;
}

/* ---------- 宿題じょうたいQRの処理 ---------- */

export type HwApplyResult =
  | { ok: true; delta: number; total: number; state: HwState }
  | { ok: false; reason: "duplicate" | "order"; message: string };

/** その日・その宿題で、すでに読み取った状態の一覧 */
export const hwStatesFor = (
  state: AppState,
  date: string,
  studentId: string,
  assignmentId: string,
): HwState[] =>
  (state.hwEvents ?? [])
    .filter(
      (e) =>
        !e.voided &&
        e.date === date &&
        e.studentId === studentId &&
        e.assignmentId === assignmentId,
    )
    .map((e) => e.state);

/**
 * 宿題じょうたいQRを1件処理する。
 * 同じQRの読み直しではポイントを二重に動かさない。
 */
export function applyHwState(
  studentId: string,
  assignmentId: string,
  hw: HwState,
  opts: { force?: boolean; date?: string } = {},
): HwApplyResult {
  const date = opts.date ?? todayKey();
  const already = hwStatesFor(state, date, studentId, assignmentId);

  if (already.includes(hw)) {
    return {
      ok: false,
      reason: "duplicate",
      message: "このしゅくだいは、すでに処理されています",
    };
  }
  // 「提出」「わすれた」「学校でやった」は、どれか1つだけ（ポイントの二重付与をふせぐ）
  const exclusive: HwState[] = ["SUBMIT", "FORGOT", "SCHOOL_DONE"];
  if (exclusive.includes(hw) && already.some((a) => exclusive.includes(a))) {
    return {
      ok: false,
      reason: "duplicate",
      message: "このしゅくだいは、もう記録ずみです",
    };
  }
  if (HW_STATE_META[hw].needsSubmit && !already.includes("SUBMIT") && !opts.force) {
    return {
      ok: false,
      reason: "order",
      message: "このQRは、今の状態では使えません。",
    };
  }

  const delta = state.hwPointRules[hw] ?? HW_STATE_META[hw].defaultPoints;
  const total = earnedPoints(state, studentId) + delta;
  const event: HwEvent = {
    id: `he_${uid()}`,
    date,
    studentId,
    assignmentId,
    state: hw,
    delta,
    total,
    at: Date.now(),
  };

  setState((s) => {
    const day = { ...(s.records[date] ?? {}) };
    const forStudent = { ...(day[studentId] ?? {}) };
    forStudent[assignmentId] = HW_STATE_META[hw].status;
    day[studentId] = forStudent;
    return {
      ...s,
      records: { ...s.records, [date]: day },
      hwEvents: [...(s.hwEvents ?? []), event],
    };
  });

  return { ok: true, delta, total, state: hw };
}

/**
 * 先生だけが使う「記録の訂正」。
 * 例：「わすれました（＋2）」を「学校でやりました（＋1）」に直す。
 * 既存の記録は消さずに voided（無効）にして、新しい記録を1件だけ追加するので、
 * 履歴は残ったままポイントだけが正しくなる。
 */
export function correctHwState(
  studentId: string,
  assignmentId: string,
  hw: HwState,
  opts: { date?: string } = {},
): HwApplyResult {
  const date = opts.date ?? todayKey();
  const live = (state.hwEvents ?? []).filter(
    (e) =>
      !e.voided && e.date === date && e.studentId === studentId && e.assignmentId === assignmentId,
  );

  // すでに同じ状態なら、なにも動かさない（二重加算・重複イベントをふせぐ）
  if (live.some((e) => e.state === hw)) {
    return { ok: false, reason: "duplicate", message: "このしゅくだいは、すでに処理されています" };
  }

  const exclusive: HwState[] = ["SUBMIT", "FORGOT", "SCHOOL_DONE"];
  const conflicts = exclusive.includes(hw) ? live.filter((e) => exclusive.includes(e.state)) : [];
  if (!conflicts.length) return applyHwState(studentId, assignmentId, hw, { force: true, date });

  const voidIds = new Set(conflicts.map((e) => e.id));
  const removed = conflicts.reduce((a, e) => a + e.delta, 0);
  const delta = state.hwPointRules[hw] ?? HW_STATE_META[hw].defaultPoints;
  const total = earnedPoints(state, studentId) - removed + delta;
  const event: HwEvent = {
    id: `he_${uid()}`,
    date,
    studentId,
    assignmentId,
    state: hw,
    delta,
    total,
    at: Date.now(),
  };

  setState((s) => {
    const day = { ...(s.records[date] ?? {}) };
    const forStudent = { ...(day[studentId] ?? {}) };
    forStudent[assignmentId] = HW_STATE_META[hw].status;
    day[studentId] = forStudent;
    return {
      ...s,
      records: { ...s.records, [date]: day },
      hwEvents: [
        ...(s.hwEvents ?? []).map((e) => (voidIds.has(e.id) ? { ...e, voided: true } : e)),
        event,
      ],
    };
  });

  return { ok: true, delta: delta - removed, total, state: hw };
}

/**
 * 教材QRを1回読み取ったときの処理。
 * ・まだ何もない → 提出済み（通常提出のポイント）
 * ・先生が「直しあり」にしていた → 直し完了（直し完了のポイント）
 * ・それ以外（すでに提出ずみ・直し完了ずみ・忘れた申告ずみ）→ ポイントは動かさない
 */
export function applyMaterialScan(
  studentId: string,
  assignmentId: string,
  opts: { date?: string } = {},
): HwApplyResult {
  const date = opts.date ?? todayKey();
  const already = hwStatesFor(state, date, studentId, assignmentId);

  if (already.includes("REDO") && !already.includes("RESUBMIT")) {
    return applyHwState(studentId, assignmentId, "RESUBMIT", { force: true, date });
  }
  if (already.length) {
    return {
      ok: false,
      reason: "duplicate",
      message: "このしゅくだいは、もう記録ずみです",
    };
  }
  return applyHwState(studentId, assignmentId, "SUBMIT", { date });
}

/** 先生が児童に手でポイントをわたす（マイナスは受け付けない） */
export function grantManualPoints(studentId: string, amount: number, note?: string) {
  const value = Math.floor(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  const grant: ManualGrant = {
    id: `mg_${uid()}`,
    studentId,
    amount: value,
    ...(note ? { note } : {}),
    at: Date.now(),
  };
  setState((s) => ({ ...s, manualGrants: [...(s.manualGrants ?? []), grant] }));
  return grant;
}

export const updateGameSettings = (patch: Partial<GameSettings>) =>
  setState((p) => ({ ...p, gameSettings: { ...p.gameSettings, ...patch } }));

export const updateHwPointRules = (patch: Partial<HwPointRules>) =>
  setState((s) => ({ ...s, hwPointRules: { ...s.hwPointRules, ...patch } }));

export const spentPoints = (state: AppState, studentId: string) =>
  state.gachaLog.filter((g) => g.studentId === studentId).reduce((a, g) => a + g.cost, 0);

export const availablePoints = (state: AppState, studentId: string) =>
  earnedPoints(state, studentId) - spentPoints(state, studentId);

/** その児童の今のランク（通算ポイントから毎回計算する） */
export const rankOf = (state: AppState, studentId: string): Rank =>
  rankOfPoints(state.rankRules, earnedPoints(state, studentId));

export function ranking(state: AppState, className = "all") {
  return state.students
    .filter((s) => className === "all" || s.className === className)
    .map((s) => ({ student: s, points: earnedPoints(state, s.id) }))
    .sort((a, b) => b.points - a.points || a.student.number - b.student.number);
}

/** ガチャを1回引く。ポイントが足りなければ null */
export function drawGacha(studentId: string): GachaResult | null {
  const cost = state.gachaCost;
  if (availablePoints(state, studentId) < cost) return null;
  const prizes = state.prizes.filter((p) => p.weight > 0);
  if (!prizes.length) return null;
  const total = prizes.reduce((a, p) => a + p.weight, 0);
  let r = Math.random() * total;
  let picked = prizes[prizes.length - 1]!;
  for (const p of prizes) {
    r -= p.weight;
    if (r <= 0) {
      picked = p;
      break;
    }
  }
  const result: GachaResult = {
    id: `gc_${uid()}`,
    studentId,
    prize: picked.name,
    cost,
    at: Date.now(),
  };
  setState((s) => ({ ...s, gachaLog: [result, ...s.gachaLog].slice(0, 500) }));
  return result;
}

/* ---------- helpers ---------- */

const normalize = (v: string) => v.replace(/[\s\u3000]/g, "").toLowerCase();

/** QRの中身「児童名と宿題名」を解析する。区切りは , / ｜ | タブ 改行 を許容 */
export function parseQr(text: string, state: AppState) {
  const parts = text
    .split(/[,、/｜|\t\n]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let student: Student | undefined;
  let assignment: Assignment | undefined;

  for (const p of parts) {
    const n = normalize(p);
    student ??= state.students.find((s) => normalize(s.name) === n);
    assignment ??= state.assignments.find((a) => normalize(a.name) === n);
  }
  if (!student) {
    const n = normalize(text);
    student = state.students.find((s) => n.includes(normalize(s.name)));
    assignment ??= state.assignments.find((a) => n.includes(normalize(a.name)));
  }
  return { student, assignment };
}
