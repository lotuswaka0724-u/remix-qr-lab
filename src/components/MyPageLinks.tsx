import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/homework-store";

type Card = { id: string; name: string; className: string; path: string; qr: string };

export default function MyPageLinks() {
  const state = useAppState();
  const [cls, setCls] = useState("all");
  const [cards, setCards] = useState<Card[]>([]);

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
        const path = `/me/${s.id}`;
        const qr = await QR.toDataURL(`${origin}${path}`, { margin: 1, width: 240 });
        list.push({ id: s.id, name: s.name, className: s.className, path, qr });
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, state.students]);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">児童の個人ページ</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        ひとりずつの専用ページです。今日の宿題の出し方・ポイント・ガチャがまとまっています。
        QRコードをタブレットで読み取るか、リンクをホーム画面に追加して使います。
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
                <Link
                  to="/me/$studentId"
                  params={{ studentId: c.id }}
                  className="mt-1 inline-block font-normal text-primary underline print:hidden"
                >
                  ひらく
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
