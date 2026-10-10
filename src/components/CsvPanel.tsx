import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadCsv, parseCsv } from "@/lib/csv";
import { parseRoster } from "@/lib/roster-csv";
import { isSubmitted, setState, todayKey, useAppState } from "@/lib/homework-store";

const uid = () => Math.random().toString(36).slice(2, 9);

export default function CsvPanel() {
  const state = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const onImport = async (file: File) => {
    setBusy(true);
    try {
      const rows = parseCsv(await file.text());
      const { added, readings } = parseRoster(
        rows,
        state.students,
        state.students[0]?.className || "1年1組",
      );
      const updated = Object.keys(readings).length;

      if (added.length === 0 && updated === 0) {
        toast.error("読み取れる名前がありませんでした");
        return;
      }
      setState((s) => ({
        ...s,
        students: [
          ...s.students.map((st) => { const r = readings[st.id]; return r ? { ...st, reading: r } : st; }),
          ...added.map((a) => ({ id: `st_${uid()}`, ...a })),
        ],
      }));
      toast.success(
        [added.length ? `${added.length}人を名簿に追加しました` : "", updated ? `${updated}人の読みを更新しました` : ""]
          .filter(Boolean)
          .join("／"),
      );
    } catch {
      toast.error("CSVの読み込みに失敗しました");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const exportToday = () => {
    const day = state.records[todayKey()] ?? {};
    const todays = state.assignments.filter((a) => a.inToday);
    const rows: (string | number)[][] = [
      ["日付", "クラス", "番号", "氏名", ...todays.map((a) => a.name), "未提出数"],
      ...[...state.students]
        .sort((x, y) => x.className.localeCompare(y.className) || x.number - y.number)
        .map((s) => {
          const cells = todays.map((a) => (isSubmitted(day[s.id]?.[a.id]) ? "○" : "×"));
          return [
            todayKey(),
            s.className,
            s.number,
            s.name,
            ...cells,
            cells.filter((c) => c === "×").length,
          ];
        }),
    ];
    downloadCsv(`提出状況_${todayKey()}.csv`, rows);
  };

  const exportAll = () => {
    const rows: (string | number)[][] = [["日付", "クラス", "番号", "氏名", "宿題", "提出"]];
    Object.keys(state.records)
      .sort()
      .forEach((date) => {
        const day = state.records[date] ?? {};
        state.students.forEach((s) => {
          state.assignments.forEach((a) => {
            if (isSubmitted(day[s.id]?.[a.id]))
              rows.push([date, s.className, s.number, s.name, a.name, "○"]);
          });
        });
      });
    downloadCsv("提出履歴.csv", rows);
  };

  const exampleCsv = () =>
    downloadCsv("名簿テンプレート.csv", [
      ["番号", "氏名", "クラス"],
      [1, "青山 太郎", "1年1組"],
      [2, "石田 花子", "1年1組"],
    ]);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">名簿の取り込み・記録の書き出し</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        CSV（番号, 氏名, クラス）で名簿をまとめて追加できます。提出の記録はCSVで保存できます。
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
          }}
        />
        <Button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "読み込み中…" : "CSVから名簿を追加"}
        </Button>
        <Button type="button" variant="outline" onClick={exampleCsv}>
          テンプレートを保存
        </Button>
        <Button type="button" variant="outline" onClick={exportToday}>
          今日の提出状況を書き出す
        </Button>
        <Button type="button" variant="outline" onClick={exportAll}>
          全期間の記録を書き出す
        </Button>
      </div>
    </section>
  );
}
