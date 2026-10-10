import type { Student } from "@/lib/homework-store";

export type RosterImport = {
  /** 新しく名簿に加える児童 */
  added: Omit<Student, "id">[];
  /** 既存児童の読み更新（id → 読み） */
  readings: Record<string, string>;
};

/**
 * 名簿CSV（番号, 氏名, クラス, 読み）を解釈する。3列のCSV・読み空欄も可。
 * 既存児童は「番号・氏名・クラス」がすべて一致したときだけ同一人物とみなし、
 * 読みだけを更新する（別の児童に読みが入らないように）。
 */
export function parseRoster(rows: string[][], existing: Student[], defaultClass: string): RosterImport {
  const header = rows[0]?.map((c) => c.replace(/["\s]/g, "")) ?? [];
  const hasHeader = header.some((c) =>
    /番号|no\.?|number|名前|氏名|name|クラス|class|読み|よみ|ふりがな|フリガナ|reading/i.test(c),
  );
  const body = hasHeader ? rows.slice(1) : rows;
  const norm = (v: string) => v.replace(/\s+/g, "");

  const added: Omit<Student, "id">[] = [];
  const readings: Record<string, string> = {};
  body.forEach((r, i) => {
    let [a = "", b = "", c = ""] = r;
    const reading = (r[3] ?? "").trim();
    let number = Number(a);
    let name = b;
    let className = c;
    if (!Number.isFinite(number) || a === "") {
      number = i + 1;
      name = a || b;
      className = b && a ? b : c;
    }
    name = (name || "").trim();
    if (!name) return;
    className = (className || defaultClass).trim();

    const match = existing.find(
      (s) => s.number === number && norm(s.name) === norm(name) && norm(s.className) === norm(className),
    );
    if (match) {
      if (reading) readings[match.id] = reading;
      return;
    }
    added.push({ number, name, className, ...(reading ? { reading } : {}) });
  });
  return { added, readings };
}
