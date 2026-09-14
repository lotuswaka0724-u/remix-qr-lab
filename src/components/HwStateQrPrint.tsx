import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { HW_STATE_META, useAppState } from "@/lib/homework-store";
import { makeForgotTokens } from "@/lib/hwqr.functions";

type Card = {
  key: string;
  studentName: string;
  assignmentName: string;
  token: string;
  url?: string;
};

/** 児童がつかうカードは「わすれました」だけ（提出は教材QRで完了する） */
const META = HW_STATE_META.FORGOT;

/** 児童×宿題ごとの「わすれました」カードを印刷する（1回の読み取りで完結する） */
export default function HwStateQrPrint() {
  const state = useAppState();
  const issue = useServerFn(makeForgotTokens);
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const pairs = useMemo(
    () =>
      state.students.flatMap((s) =>
        state.assignments.map((a) => ({
          key: `${s.id}|${a.id}`,
          studentId: s.id,
          assignmentId: a.id,
          studentName: s.name,
          assignmentName: a.name,
        })),
      ),
    [state.students, state.assignments],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!pairs.length) {
        setCards([]);
        return;
      }
      const res = await issue({
        data: { rows: pairs.map((p) => ({ studentId: p.studentId, assignmentId: p.assignmentId })) },
      });
      if (cancelled || !res.ok) return;
      const byKey = new Map(res.tokens.map((t) => [`${t.studentId}|${t.assignmentId}`, t.token]));
      setCards(
        pairs
          .filter((p) => byKey.has(p.key))
          .map((p) => ({
            key: p.key,
            studentName: p.studentName,
            assignmentName: p.assignmentName,
            token: byKey.get(p.key)!,
          })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [pairs, issue]);

  const chosen = cards.filter((c) => selected[c.key]);

  // 選んだカードのQR画像だけを作る
  useEffect(() => {
    let cancelled = false;
    const need = cards.filter((c) => selected[c.key] && !c.url);
    if (!need.length) return;
    (async () => {
      const QR = await import("qrcode");
      const made = new Map<string, string>();
      for (const c of need) {
        made.set(c.key, await QR.toDataURL(c.token, { margin: 1, width: 420 }));
      }
      if (cancelled) return;
      setCards((prev) => prev.map((c) => (made.has(c.key) ? { ...c, url: made.get(c.key)! } : c)));
    })();
    return () => {
      cancelled = true;
    };
  }, [cards, selected]);

  const pt = state.hwPointRules.FORGOT ?? META.defaultPoints;

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">わすれましたカード印刷（児童用）</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        宿題を出すときは、教材のQRを読み取るだけで完了です。このカードは「わすれた」ときだけ使います。
        カードには児童と宿題の情報が安全なかたちで入っているので、このカードを1回読み取るだけで記録できます。
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
                {c.studentName}／{c.assignmentName}
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
              <span className="block text-xl">
                {c.studentName}／{c.assignmentName}
              </span>
              {META.label}
            </figcaption>
            <div className="rounded-2xl bg-white p-2">
              {c.url ? (
                <img
                  src={c.url}
                  alt={`${c.studentName} ${c.assignmentName} ${META.label} のQRコード`}
                  className="mx-auto w-44"
                />
              ) : (
                <div className="mx-auto grid h-44 w-44 place-content-center text-xs text-muted-foreground">
                  作成中…
                </div>
              )}
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
