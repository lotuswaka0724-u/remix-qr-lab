import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/homework-store";

type Card = { key: string; text: string; studentName: string; assignmentName: string; url: string };

export default function QrMaker() {
  const state = useAppState();
  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const [cls, setCls] = useState<string>("all");
  const [assignmentId, setAssignmentId] = useState<string>("all");
  const [cards, setCards] = useState<Card[]>([]);

  const students = state.students
    .filter((s) => cls === "all" || s.className === cls)
    .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number);
  const assignments = state.assignments.filter((a) => assignmentId === "all" || a.id === assignmentId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const list: Card[] = [];
      for (const s of students) {
        for (const a of assignments) {
          const text = `${s.name},${a.name}`;
          const url = await QR.toDataURL(text, { margin: 1, width: 240 });
          list.push({ key: `${s.id}_${a.id}`, text, studentName: s.name, assignmentName: a.name, url });
        }
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, assignmentId, state.students, state.assignments]);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">QRコード作成</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        児童名と宿題名を組み合わせたQRコードを作ります。印刷して配り、スキャン画面で読み取ると提出が記録されます。
      </p>

      <div className="mb-3 flex flex-wrap gap-2 print:hidden">
        <select
          value={cls}
          onChange={(e) => setCls(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="クラスを選ぶ"
        >
          <option value="all">すべてのクラス</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={assignmentId}
          onChange={(e) => setAssignmentId(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="宿題を選ぶ"
        >
          <option value="all">すべての宿題</option>
          {state.assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <Button type="button" onClick={() => window.print()}>
          印刷する
        </Button>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">作成できるQRコードがありません。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((c) => (
            <figure key={c.key} className="rounded-xl border border-border bg-card p-2 text-center">
              <img src={c.url} alt={`${c.studentName} ${c.assignmentName} のQRコード`} className="mx-auto w-full" />
              <figcaption className="mt-1 text-xs font-bold leading-tight">
                {c.studentName}
                <span className="block font-normal text-muted-foreground">{c.assignmentName}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
