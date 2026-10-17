import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/homework-store";
import { makeForgotTokens } from "@/lib/hwqr.functions";
import { duplexCardSheets, qrGridFit } from "@/lib/qr-card-pages";

type Qr = { name: string; url?: string };
type Card = {
  key: string;
  studentName: string;
  reading: string;
  classLabel: string;
  number: number;
  submit: Qr[];
  forgot: Qr[];
};

// カード内でQRを並べられる範囲(mm)
const GRID_W = 132;
const GRID_H = 62;

/**
 * A6両面カード（児童1人＝1枚）。
 * 表＝選んだ宿題の提出QRをすべて、裏＝その児童の全宿題のわすれましたQRをすべて。数に応じて縮小。
 */
export default function DuplexHwCardPrint() {
  const state = useAppState();
  const issue = useServerFn(makeForgotTokens);
  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const [cls, setCls] = useState("all");
  const [pickedHw, setPickedHw] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [submitUrls, setSubmitUrls] = useState<Record<string, string>>({});
  const [forgotUrls, setForgotUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const students = useMemo(
    () =>
      state.students
        .filter((s) => cls === "all" || s.className === cls)
        .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number),
    [state.students, cls],
  );
  const hwFront = state.assignments.filter((a) => pickedHw[a.id]);

  const cards: Card[] = students
    .filter((s) => selected[s.id])
    .map((s) => ({
      key: s.id,
      studentName: s.name,
      reading: s.reading ?? "",
      classLabel: s.grade && s.classNumber ? `${s.grade}年${s.classNumber}組` : s.className,
      number: s.number,
      submit: hwFront.map((a) => ({ name: a.name, url: submitUrls[`${s.name},${a.name}`] })),
      forgot: state.assignments.map((a) => ({ name: a.name, url: forgotUrls[`${s.id}|${a.id}`] })),
    }));
  const sheets = duplexCardSheets(cards);
  const ready =
    cards.length > 0 &&
    hwFront.length > 0 &&
    cards.every((c) => c.submit.every((q) => q.url) && c.forgot.every((q) => q.url));

  const chosenIds = students.filter((s) => selected[s.id]).map((s) => s.id);
  const depKey = chosenIds.join(",") + "/" + hwFront.map((a) => a.id).join(",");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const chosen = state.students.filter((s) => chosenIds.includes(s.id));
      // 表：提出QR（教材QRと同じ内容）
      const sub: Record<string, string> = {};
      for (const s of chosen)
        for (const a of hwFront) {
          const text = `${s.name},${a.name}`;
          if (!submitUrls[text]) sub[text] = await QR.toDataURL(text, { margin: 1, width: 360 });
        }
      if (cancelled) return;
      if (Object.keys(sub).length) setSubmitUrls((p) => ({ ...p, ...sub }));
      // 裏：全宿題のわすれましたQR
      const need = chosen.flatMap((s) =>
        state.assignments
          .filter((a) => !forgotUrls[`${s.id}|${a.id}`])
          .map((a) => ({ studentId: s.id, assignmentId: a.id })),
      );
      if (!need.length) return;
      const res = await issue({ data: { rows: need } });
      if (cancelled) return;
      if (!res.ok) {
        setError("わすれましたQRを作れませんでした。時間をおいてもう一度お試しください。");
        return;
      }
      const fg: Record<string, string> = {};
      for (const t of res.tokens)
        fg[`${t.studentId}|${t.assignmentId}`] = await QR.toDataURL(t.token, { margin: 1, width: 360 });
      if (!cancelled) setForgotUrls((p) => ({ ...p, ...fg }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey, state.assignments.length, issue]);

  const print = () => {
    document.body.classList.add("printing-duplex");
    const done = () => {
      document.body.classList.remove("printing-duplex");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">両面カード印刷（A6・提出／わすれました）</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        児童1人につき1枚。表は選んだ宿題の「ていしゅつ」QR、裏はその児童の全宿題の「わすれました」QRです。
        QRは数に合わせて小さくなります。A4に2枚、「両面印刷・長辺とじ」で印刷してください。
      </p>

      <p className="mb-1 text-xs font-bold">表に入れる宿題</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {state.assignments.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-1 rounded-lg border border-border px-2 py-1 text-sm">
            <input
              type="checkbox"
              checked={!!pickedHw[a.id]}
              onChange={(e) => setPickedHw((p) => ({ ...p, [a.id]: e.target.checked }))}
              className="h-4 w-4"
            />
            {a.name}
          </label>
        ))}
        {state.assignments.length === 0 && <span className="text-sm text-muted-foreground">宿題がありません。</span>}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select
          value={cls}
          onChange={(e) => setCls(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="クラスでしぼりこむ"
        >
          <option value="all">すべてのクラス</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setSelected((prev) => {
              const next = { ...prev };
              students.forEach((s) => (next[s.id] = true));
              return next;
            })
          }
        >
          表示中の児童をすべて選ぶ
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected({})}>
          選択を解除
        </Button>
        <span className="text-xs text-muted-foreground">
          {cards.length}人（A4 {sheets.length}枚・{sheets.length * 2}ページ）
        </span>
        <Button type="button" disabled={!ready} onClick={print}>
          {cards.length && hwFront.length && !ready ? "QRを作っています…" : "印刷する"}
        </Button>
      </div>
      {!hwFront.length && <p className="mb-2 text-xs text-muted-foreground">表に入れる宿題を1つ以上えらんでください。</p>}
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <ul className="mb-4 grid max-h-72 gap-1 overflow-auto rounded-xl border border-border p-2 sm:grid-cols-2">
        {students.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60">
              <input
                type="checkbox"
                checked={!!selected[s.id]}
                onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))}
                className="h-4 w-4"
              />
              <span className="text-sm font-bold">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.className} {s.number}ばん</span>
            </label>
          </li>
        ))}
        {students.length === 0 && <li className="p-2 text-sm text-muted-foreground">児童がいません。</li>}
      </ul>

      <div className="overflow-auto">
        <div id="duplex-qr-sheet" className="duplex-sheet">
          {sheets.flatMap((sheet, i) =>
            (["front", "back"] as const).map((side) => (
              <div
                key={`${sheet.front[0]!.key}-${side}`}
                className="duplex-page"
                aria-label={`${i * 2 + (side === "front" ? 1 : 2)}ページ目（${side === "front" ? "表" : "裏"}）`}
              >
                {sheet[side].map((c) => (
                  <Face key={c.key} c={c} side={side} />
                ))}
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  );
}

function Face({ c, side }: { c: Card; side: "front" | "back" }) {
  const front = side === "front";
  const qrs = front ? c.submit : c.forgot;
  const fit = qrGridFit(qrs.length, GRID_W, GRID_H);
  return (
    <div className="duplex-slot">
      <div className={`duplex-card ${front ? "duplex-front" : "duplex-back"}`}>
        <div className="duplex-shine" aria-hidden />
        <div className="duplex-body">
          <div className="duplex-head">
            <div>
              <p className="duplex-brand">{front ? "HOMEWORK SUBMIT CARD" : "HOMEWORK FORGOT CARD"}</p>
              <p className="duplex-title">{front ? "🚀 しゅくだい ていしゅつカード" : "🌙 わすれましたカード"}</p>
              <p className="duplex-msg">
                {front ? "できたら ピッ！ ミッション クリア！" : "わすれた ときは こっちで ピッ。つぎは もってこよう！"}
              </p>
            </div>
            <div className="duplex-who">
              {front && <span className="duplex-chip" aria-hidden />}
              <div>
                {c.reading && <p className="duplex-reading">{c.reading}</p>}
                <p className="duplex-name">{c.studentName}</p>
                <p className="duplex-class">
                  {c.classLabel}　{c.number}ばん
                </p>
              </div>
            </div>
          </div>
          <div
            className="duplex-grid"
            style={{ gridTemplateColumns: `repeat(${fit.cols}, auto)`, ["--qr" as string]: `${fit.size}mm` }}
          >
            {qrs.map((q) => (
              <div key={q.name} className="duplex-qr">
                <span className="duplex-qr-label">{q.name}</span>
                {q.url ? <img src={q.url} alt={`${c.studentName} ${q.name} ${front ? "提出" : "わすれました"}QR`} /> : <span className="duplex-qr-wait">…</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
