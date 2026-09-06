import { useSyncExternalStore } from "react";

export type Assignment = { id: string; name: string; inToday: boolean };
export type Student = { id: string; number: number; name: string; className: string };

/** 提出のようす */
export type Status = "fixed" | "submitted" | "school" | "declared" | "none";

export const STATUS_ORDER: Status[] = ["none", "submitted", "fixed", "school", "declared"];

export const STATUS_META: Record<
  Status,
  { short: string; label: string; desc: string; tone: string }
> = {
  fixed: {
    short: "直",
    label: "提出＋直し完了",
    desc: "宿題を出して、直しまで終わらせた",
    tone: "bg-[#1d4ed8] text-white",
  },
  submitted: {
    short: "提",
    label: "提出（直しまだ）",
    desc: "宿題を出したが、直しはまだ",
    tone: "bg-[#3b82f6] text-white",
  },
  school: {
    short: "校",
    label: "学校で終えて提出",
    desc: "学校で終わらせて提出した",
    tone: "bg-[#60a5fa] text-white",
  },
  declared: {
    short: "申",
    label: "忘れを申告",
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

export type GachaPrize = { id: string; name: string; weight: number };
export type GachaResult = {
  id: string;
  studentId: string;
  prize: string;
  cost: number;
  at: number;
};

/** date -> studentId -> assignmentId -> ようす */
export type Records = Record<string, Record<string, Record<string, Status | boolean>>>;

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
  pointRules: { fixed: 5, submitted: 3, school: 2, declared: 1, none: 0 },
  gachaCost: 10,
  prizes: [
    { id: "pz_1", name: "きらきらシール", weight: 40 },
    { id: "pz_2", name: "がんばりカード", weight: 30 },
    { id: "pz_3", name: "しおり", weight: 20 },
    { id: "pz_4", name: "先生からのほめことば券", weight: 9 },
    { id: "pz_5", name: "★レア★ 大きなメダル", weight: 1 },
  ],
  gachaLog: [],
});

let state: AppState = defaultState();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      const base = defaultState();
      state = {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings ?? {}) },
        pointRules: { ...base.pointRules, ...(parsed.pointRules ?? {}) },
        prizes: parsed.prizes?.length ? parsed.prizes : base.prizes,
        gachaLog: parsed.gachaLog ?? [],
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
  listeners.forEach((l) => l());
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
          listeners.forEach((l) => l());
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

export const addPrize = (name: string, weight: number) =>
  setState((s) => ({ ...s, prizes: [...s.prizes, { id: `pz_${uid()}`, name, weight }] }));

export const updatePrize = (id: string, patch: Partial<GachaPrize>) =>
  setState((s) => ({
    ...s,
    prizes: s.prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));

export const removePrize = (id: string) =>
  setState((s) => ({ ...s, prizes: s.prizes.filter((p) => p.id !== id) }));

export const clearToday = () =>
  setState((s) => ({ ...s, records: { ...s.records, [todayKey()]: {} } }));

/* ---------- points ---------- */

/** これまでに貯めた合計ポイント（使った分は含まない） */
export function earnedPoints(state: AppState, studentId: string) {
  let total = 0;
  for (const day of Object.values(state.records)) {
    const forStudent = day[studentId];
    if (!forStudent) continue;
    for (const v of Object.values(forStudent)) total += state.pointRules[toStatus(v)] ?? 0;
  }
  return total;
}

export const spentPoints = (state: AppState, studentId: string) =>
  state.gachaLog.filter((g) => g.studentId === studentId).reduce((a, g) => a + g.cost, 0);

export const availablePoints = (state: AppState, studentId: string) =>
  earnedPoints(state, studentId) - spentPoints(state, studentId);

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

const normalize = (v: string) => v.replace(/[\s　]/g, "").toLowerCase();

/** QRの中身「児童名と宿題名」を解析する。区切りは , / ｜ | タブ 改行 を許容 */
export function parseQr(text: string, state: AppState) {
  const parts = text
    .split(/[,、\/｜|\t\n]+/)
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
