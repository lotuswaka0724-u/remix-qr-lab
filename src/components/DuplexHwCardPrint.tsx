import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/homework-store";
import { makeForgotTokens } from "@/lib/hwqr.functions";
import { duplexCardSheets } from "@/lib/qr-card-pages";

type Card = {
  key: string;
  studentId: string;
  assignmentId: string;
  studentName: string;
  reading: string;
  classLabel: string;
  number: number;
  assignmentName: string;
  submitText: string;
  submitUrl?: string;
  forgotUrl?: string;
};

/** A6両面カード：表＝提出（教材QRと同じ内容）、裏＝わすれました（署名付きQR）。A4に2枚。 */
export default function DuplexHwCardPrint() {
  const state = useAppState();
  const issue = useServerFn(makeForgotTokens);
  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const [cls, setCls] = useState("all");
  const [assignmentId, setAssignmentId] = useState("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [urls, setUrls] = useState<Record<string, { submit: string; forgot: string }>>({});
  const [error, setError] = useState("");

  const cards: Card[] = useMemo(() => {
    const students = state.students
      .filter((s) => cls === "all" || s.className === cls)
      .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number);
    const assignments = state.assignments.filter(
      (a) => assignmentId === "all" || a.id === assignmentId,
    );
    return students.flatMap((s) =>
      assignments.map((a) => ({
        key: `${s.id}|${a.id}`,
        studentId: s.id,
        assignmentId: a.id,
        studentName: s.name,
        reading: s.reading ?? "",
        classLabel: s.grade && s.classNumber ? `${s.grade}年${s.classNumber}組` : s.className,
        number: s.number,
        assignmentName: a.name,
        submitText: `${s.name},${a.name}`,
        ...urls[`${s.id}|${a.id}`] && {
          submitUrl: urls[`${s.id}|${a.id}`]!.submit,
          forgotUrl: urls[`${s.id}|${a.id}`]!.forgot,
        },
      })),
    );
  }, [state.students, state.assignments, cls, assignmentId, urls]);

  const chosen = cards.filter((c) => selected[c.key]);
  const sheets = duplexCardSheets(chosen);
  const ready = chosen.length > 0 && chosen.every((c) => c.submitUrl && c.forgotUrl);

  // 選んだカードだけ、提出QRとわすれましたQRを作る
  useEffect(() => {
    const need = chosen.filter((c) => !urls[c.key]);
    if (!need.length) return;
    let cancelled = false;
    (async () => {
      const res = await issue({
        data: { rows: need.map((c) => ({ studentId: c.studentId, assignmentId: c.assignmentId })) },
      });
      if (cancelled) return;
      if (!res.ok) {
        setError("わすれましたQRを作れませんでした。時間をおいてもう一度お試しください。");
        return;
      }
      const QR = await import("qrcode");
      const made: Record<string, { submit: string; forgot: string }> = {};
      for (const t of res.tokens) {
        const c = need.find((n) => n.studentId === t.studentId && n.assignmentId === t.assignmentId);
        if (!c) continue;
        made[c.key] = {
          submit: await QR.toDataURL(c.submitText, { margin: 1, width: 420 }),
          forgot: await QR.toDataURL(t.token, { margin: 1, width: 420 }),
        };
      }
      if (!cancelled) setUrls((prev) => ({ ...prev, ...made }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen.map((c) => c.key).join(","), issue]);

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
        表が「ていしゅつ」、裏が「わすれました」のカードです。A4に2枚ずつ印刷されます。プリンターで
        「両面印刷・長辺とじ」を選ぶと、裏に同じ児童の面が来ます。まん中の線で切って1人1枚わたせます。
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
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
        <select
          value={assignmentId}
          onChange={(e) => setAssignmentId(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="宿題でしぼりこむ"
        >
          <option value="all">すべての宿題</option>
          {state.assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setSelected((prev) => {
              const next = { ...prev };
              cards.forEach((c) => (next[c.key] = true));
              return next;
            })
          }
        >
          表示中をすべて選ぶ
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected({})}>
          選択を解除
        </Button>
        <span className="text-xs text-muted-foreground">
          {chosen.length}枚選択中（A4 {sheets.length}枚・{sheets.length * 2}ページ）
        </span>
        <Button type="button" disabled={!ready} onClick={print}>
          {chosen.length && !ready ? "QRを作っています…" : "印刷する"}
        </Button>
      </div>
      {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

      <ul className="mb-4 grid max-h-72 gap-1 overflow-auto rounded-xl border border-border p-2 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60">
              <input
                type="checkbox"
                checked={!!selected[c.key]}
                onChange={(e) => setSelected((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                className="h-4 w-4"
              />
              <span className="text-sm font-bold">{c.studentName}</span>
              <span className="text-xs text-muted-foreground">{c.assignmentName}</span>
            </label>
          </li>
        ))}
        {cards.length === 0 && <li className="p-2 text-sm text-muted-foreground">児童または宿題がありません。</li>}
      </ul>

      <div className="overflow-auto">
        <div id="duplex-qr-sheet" className="duplex-sheet">
          {sheets.map((sheet, i) => (
            <div key={sheet.front[0]!.key} className="contents">
              <div className="duplex-page" aria-label={`${i * 2 + 1}ページ目（表）`}>
                {sheet.front.map((c) => (
                  <Face key={c.key} c={c} side="front" />
                ))}
              </div>
              <div className="duplex-page" aria-label={`${i * 2 + 2}ページ目（裏）`}>
                {sheet.back.map((c) => (
                  <Face key={c.key} c={c} side="back" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Face({ c, side }: { c: Card; side: "front" | "back" }) {
  const front = side === "front";
  const url = front ? c.submitUrl : c.forgotUrl;
  return (
    <div className="duplex-slot">
      <div className={`duplex-card ${front ? "duplex-front" : "duplex-back"}`}>
        <div className="duplex-shine" aria-hidden />
        {!front && <div className="duplex-stripe" aria-hidden />}
        <div className="duplex-body">
          <div className="duplex-info">
            <p className="duplex-brand">{front ? "HOMEWORK SUBMIT CARD" : "HOMEWORK FORGOT CARD"}</p>
            <p className="duplex-title">
              {front ? "🚀 しゅくだい ていしゅつカード" : "🌙 わすれましたカード"}
            </p>
            <p className="duplex-task">{c.assignmentName}</p>
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
            <p className="duplex-msg">
              {front ? "できたら ピッ！ ミッション クリア！" : "わすれた ときは こっちで ピッ。つぎは もってこよう！"}
            </p>
          </div>
          <div className="duplex-qr">
            {url ? <img src={url} alt={`${c.studentName} ${front ? "提出" : "わすれました"}QR`} /> : <span>作成中…</span>}
            <span className="duplex-qr-label">{front ? "ていしゅつ" : "わすれました"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
