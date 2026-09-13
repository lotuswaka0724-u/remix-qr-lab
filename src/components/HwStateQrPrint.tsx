import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { HW_STATE_META, hwStateQrText, useAppState } from "@/lib/homework-store";

type Card = { key: string; assignmentName: string | null; url: string };

/** 児童がつかうカードは「わすれました」だけ（提出は教材QRで完了する） */
const META = HW_STATE_META.FORGOT;

/** 宿題ごとの「わすれました」カードを印刷する */
export default function HwStateQrPrint() {
  const state = useAppState();
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const targets = useMemo(
    () => [
      { key: "__all__", name: null as string | null },
      ...state.assignments.map((a) => ({ key: a.id, name: a.name })),
    ],
    [state.assignments],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const list: Card[] = [];
      for (const t of targets) {
        list.push({
          key: t.key,
          assignmentName: t.name,
          url: await QR.toDataURL(hwStateQrText("FORGOT", t.name ?? undefined), {
            margin: 1,
            width: 420,
          }),
        });
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [targets]);

  const chosen = cards.filter((c) => selected[c.key]);
  const pt = state.hwPointRules.FORGOT ?? META.defaultPoints;

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">わすれましたカード印刷（児童用）</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        宿題を出すときは、教材のQRを読み取るだけで完了です。このカードは「わすれた」ときだけ使います（児童のQR
        → わすれましたカードの順）。宿題ごとのカードを読み取ると、何をわすれたかが記録されます。
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setSelected(
              Object.fromEntries(cards.map((c) => [c.key, true])) as Record<string, boolean>,
            )
          }
        >
          すべて選ぶ
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected({})}>
          選択を解除
        </Button>
        <span className="text-xs text-muted-foreground">選択中 {chosen.length} 枚</span>
        <Button type="button" disabled={chosen.length === 0} onClick={() => window.print()}>
          印刷する
        </Button>
      </div>

      <ul className="mb-4 grid gap-1 rounded-xl border border-border p-2 sm:grid-cols-2 print:hidden">
        {cards.map((c) => (
          <li key={c.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60">
              <input
                type="checkbox"
                checked={!!selected[c.key]}
                onChange={(e) => setSelected((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                className="h-4 w-4"
              />
              <span className="text-sm font-bold">
                {c.assignmentName ?? "（宿題を指定しない）"}
              </span>
              <span className="text-xs text-muted-foreground">わすれました</span>
            </label>
          </li>
        ))}
        {cards.length === 0 && (
          <li className="p-2 text-sm text-muted-foreground">カードを作っています…</li>
        )}
      </ul>

      <div className="grid gap-4 sm:grid-cols-2">
        {chosen.map((c) => (
          <figure
            key={c.key}
            className={`flex break-inside-avoid flex-col items-center gap-2 rounded-3xl border-4 p-4 ${META.card}`}
          >
            <span className="text-4xl leading-none">{META.icon}</span>
            <figcaption className="text-center font-display text-2xl font-bold leading-tight">
              {c.assignmentName && <span className="block text-xl">{c.assignmentName}</span>}
              {META.label}
            </figcaption>
            <div className="rounded-2xl bg-white p-2">
              <img
                src={c.url}
                alt={`${c.assignmentName ?? ""} ${META.label} のQRコード`}
                className="mx-auto w-44"
              />
            </div>
            <span className={`rounded-full px-4 py-1 font-display text-xl font-bold ${META.badge}`}>
              {pt >= 0 ? `＋${pt}` : pt} ポイント
            </span>
          </figure>
        ))}
        {chosen.length === 0 && (
          <p className="text-sm text-muted-foreground print:hidden">
            上のリストから選ぶと、ここに印刷するカードが出ます。
          </p>
        )}
      </div>
    </section>
  );
}
