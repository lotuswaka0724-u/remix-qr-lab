import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ensureStudentCodes, resetStudentCode } from "@/lib/class-sync.functions";
import { useAppState } from "@/lib/homework-store";

type Card = { id: string; name: string; className: string; qr: string };

export default function MyPageLinks() {
  const state = useAppState();
  const [cls, setCls] = useState("all");
  const [cards, setCards] = useState<Card[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const ensure = useServerFn(ensureStudentCodes);
  const reset = useServerFn(resetStudentCode);

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );

  const students = state.students
    .filter((s) => cls === "all" || s.className === cls)
    .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const origin = window.location.origin;
      const list: Card[] = [];
      for (const s of students) {
        const qr = await QR.toDataURL(`${origin}/me/${s.id}`, { margin: 1, width: 240 });
        list.push({ id: s.id, name: s.name, className: s.className, qr });
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, state.students]);

  useEffect(() => {
    void ensure({}).then((c) => c && setCodes(c));
  }, [ensure, state.students.length]);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">児童の個人ページと合言葉</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        QRコードを読み取り、4けたの合言葉を入れると、その子だけのページがひらきます。
        合言葉はほかの人に見せないでください。
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
        <Button type="button" onClick={() => window.print()}>
          印刷する
        </Button>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">名簿に児童がいません。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {cards.map((c) => (
            <figure key={c.id} className="rounded-xl border border-border bg-card p-2 text-center">
              <img src={c.qr} alt={`${c.name} の個人ページのQRコード`} className="mx-auto w-full" />
              <figcaption className="mt-1 text-xs font-bold leading-tight">
                {c.name}
                <span className="block font-normal text-muted-foreground">{c.className}</span>
                <span className="mt-1 block font-display text-lg tracking-[0.3em] text-primary">
                  {codes[c.id] ?? "----"}
                </span>
                <button
                  type="button"
                  className="mt-1 text-[11px] font-normal text-muted-foreground underline print:hidden"
                  onClick={async () => {
                    const r = await reset({ data: { studentId: c.id } });
                    if (r) setCodes((p) => ({ ...p, [c.id]: r.code }));
                  }}
                >
                  合言葉を作り直す
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
