import { useSyncExternalStore } from "react";

export type Assignment = { id: string; name: string; inToday: boolean };
export type Student = { id: string; number: number; name: string; className: string };
/** date -> studentId -> assignmentId -> submitted */
export type Records = Record<string, Record<string, Record<string, boolean>>>;

export type AppState = {
  schoolLabel: string;
  assignments: Assignment[];
  students: Student[];
  records: Records;
  settings: { sound: number; vibe: boolean; speak: boolean };
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
  settings: { sound: 1, vibe: true, speak: true },
});

let state: AppState = defaultState();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...defaultState(), ...(JSON.parse(raw) as AppState) };
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
      load();
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => state,
  );
}

/* ---------- mutations ---------- */

export const toggleRecord = (studentId: string, assignmentId: string, value?: boolean) =>
  setState((s) => {
    const day = { ...(s.records[todayKey()] ?? {}) };
    const forStudent = { ...(day[studentId] ?? {}) };
    const next = value ?? !forStudent[assignmentId];
    forStudent[assignmentId] = next;
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

export const clearToday = () =>
  setState((s) => ({ ...s, records: { ...s.records, [todayKey()]: {} } }));

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
