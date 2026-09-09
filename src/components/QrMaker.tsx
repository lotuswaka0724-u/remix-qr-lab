import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { earnedPoints, rankOfPoints, useAppState, type Rank } from "@/lib/homework-store";
import { RANK_STYLE } from "@/lib/rank-style";

type Card = {
  key: string;
  text: string;
  studentName: string;
  className: string;
  number: number;
  points: number;
  rank: Rank;
  assignmentName: string;
  url: string;
};

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
        const points = earnedPoints(state, s.id);
        const rank = rankOfPoints(state.rankRules, points);
        for (const a of assignments) {
          const text = `${s.name},${a.name}`;
          const url = await QR.toDataURL(text, { margin: 1, width: 240 });
          list.push({
            key: `${s.id}_${a.id}`,
            text,
            studentName: s.name,
            className: s.className,
            number: s.number,
            points,
            rank,
            assignmentName: a.name,
            url,
          });
        }
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, assignmentId, state.students, state.assignments, state.records, state.rankRules, state.pointRules]);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">QRカード印刷</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        児童が持つポイントカード風のQRカードです。通算ポイントに合わせて、カードのランク（NORMAL／GOLD／BLACK）が自動で変わります。
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
        <p className="text-sm text-muted-foreground">作成できるQRカードがありません。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((c) => {
            const style = RANK_STYLE[c.rank];
            return (
              <figure
                key={c.key}
                className={`flex break-inside-avoid flex-col gap-1.5 rounded-2xl border-2 p-2.5 ${style.card}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 font-display text-[10px] font-bold tracking-widest ${style.badge}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums opacity-80">
                    {c.points} pt
                  </span>
                </div>

                <div className="rounded-xl bg-white p-1.5">
                  <img
                    src={c.url}
                    alt={`${c.studentName} ${c.assignmentName} のQRコード`}
                    className="mx-auto w-full"
                  />
                </div>

                <figcaption className="text-center text-xs font-bold leading-tight">
                  {c.studentName}
                  <span className="block text-[10px] font-normal opacity-75">
                    {c.className} {c.number}番
                  </span>
                  <span className="block text-[10px] font-normal opacity-75">
                    {c.assignmentName}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </section>
  );
}
