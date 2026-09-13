import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { HW_STATE_META, hwStateQrText, useAppState, type HwState } from "@/lib/homework-store";

type Card = { state: HwState; url: string };

/** 児童がつかうカードは「わすれました」だけ（提出は教材QRで完了する） */
const PRINT_STATES: HwState[] = ["FORGOT"];

/** 児童が自分でえらぶ「しゅくだいのカード」を印刷する */
export default function HwStateQrPrint() {
  const state = useAppState();
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const list: Card[] = [];
      for (const s of PRINT_STATES) {
        list.push({
          state: s,
          url: await QR.toDataURL(hwStateQrText(s), { margin: 1, width: 420 }),
        });
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">しゅくだいカード印刷（児童用）</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        宿題を出すときは、教材のQRを読み取るだけで完了です。このカードは「わすれた」ときだけ使います（児童のQR
        → わすれましたカードの順）。
      </p>

      <div className="mb-3 print:hidden">
        <Button type="button" onClick={() => window.print()}>
          印刷する
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => {
          const meta = HW_STATE_META[c.state];
          const pt = state.hwPointRules[c.state] ?? meta.defaultPoints;
          return (
            <figure
              key={c.state}
              className={`flex break-inside-avoid flex-col items-center gap-2 rounded-3xl border-4 p-4 ${meta.card}`}
            >
              <span className="text-4xl leading-none">{meta.icon}</span>
              <figcaption className="text-center font-display text-2xl font-bold leading-tight">
                {meta.label}
              </figcaption>
              <div className="rounded-2xl bg-white p-2">
                <img src={c.url} alt={`${meta.label} のQRコード`} className="mx-auto w-44" />
              </div>
              <span
                className={`rounded-full px-4 py-1 font-display text-xl font-bold ${meta.badge}`}
              >
                {pt >= 0 ? `＋${pt}` : pt} ポイント
              </span>
            </figure>
          );
        })}
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground">カードを作っています…</p>
        )}
      </div>
    </section>
  );
}
