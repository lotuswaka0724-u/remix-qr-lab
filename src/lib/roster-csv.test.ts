import { describe, expect, it } from "vitest";

import { spokenName, type Student } from "@/lib/homework-store";
import { parseRoster } from "@/lib/roster-csv";

const existing: Student[] = [
  { id: "st_a", number: 1, name: "青山 太郎", className: "3年2組" },
  { id: "st_b", number: 1, name: "青山 太郎", className: "3年1組" },
];

describe("名簿CSVの読み", () => {
  it("4列CSVで新しい児童に読みが入る", () => {
    const r = parseRoster([["番号", "氏名", "クラス", "読み（ふりがな）"], ["2", "石田花子", "3年2組", "イシダハナコ"]], [], "1年1組");
    expect(r.added).toEqual([{ number: 2, name: "石田花子", className: "3年2組", reading: "イシダハナコ" }]);
  });
  it("3列CSVも読み込める", () => {
    const r = parseRoster([["番号", "氏名", "クラス"], ["2", "石田花子", "3年2組"]], [], "1年1組");
    expect(r.added).toEqual([{ number: 2, name: "石田花子", className: "3年2組" }]);
  });
  it("読みが空欄でも登録できる", () => {
    const r = parseRoster([["2", "石田花子", "3年2組", ""]], [], "1年1組");
    expect(r.added[0]?.reading).toBeUndefined();
  });
  it("番号・氏名・クラスが一致した既存児童だけ読みを更新し、重複追加しない", () => {
    const r = parseRoster([["1", "青山太郎", "3年2組", "アオヤマタロウ"]], existing, "1年1組");
    expect(r.readings).toEqual({ st_a: "アオヤマタロウ" });
    expect(r.added).toEqual([]);
  });
  it("読み上げは読みを優先し、空なら登録名", () => {
    expect(spokenName({ name: "青山 太郎", reading: "アオヤマタロウ" })).toBe("アオヤマタロウ");
    expect(spokenName({ name: "青山 太郎", reading: " " })).toBe("青山 太郎");
  });
});
