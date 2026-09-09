import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/lib/homework-store";

type QrItem = {
  key: string;
  label: string;
  sublabel: string;
  text: string;
  url: string;
};

export default function MaterialQrPrint() {
  const state = useAppState();
  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const [cls, setCls] = useState<string>("all");
  const [assignmentId, setAssignmentId] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<QrItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const students = useMemo(
    () =>
      state.students
        .filter((s) => cls === "all" || s.className === cls)
        .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number),
    [state.students, cls],
  );
  const assignments = useMemo(
    () => state.assignments.filter((a) => assignmentId === "all" || a.id === assignmentId),
    [state.assignments, assignmentId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const list: QrItem[] = [];
      for (const s of students) {
        for (const a of assignments) {
          const text = `${s.name},${a.name}`;
          const url = await QR.toDataURL(text, { margin: 2, width: 320 });
          list.push({
            key: `${s.id}_${a.id}`,
            label: a.name,
            sublabel: `${s.className} ${s.name}`,
            text,
            url,
          });
        }
      }
      if (!cancelled) setItems(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [students, assignments]);

  const visible = items.filter((i) => {
    const q = keyword.trim();
    if (!q) return true;
    return `${i.label} ${i.sublabel}`.includes(q);
  });
  const chosen = items.filter((i) => selected[i.key]);

  const print = () => {
    document.body.classList.add("printing-material");
    const done = () => {
      document.body.classList.remove("printing-material");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">教材貼付用QR印刷</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        ワークやノートに貼るためのQRコードです。必要なものだけを選んで、A4用紙にまとめて印刷し、線に沿って切り取って使います。
      </p>

      <div className="mb-3 flex flex-wrap gap-2 print:hidden">
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
          aria-label="教科・宿題でしぼりこむ"
        >
          <option value="all">すべての教科・宿題</option>
          {state.assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="名前や教科でさがす"
          className="h-10 min-w-[10rem] flex-1 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="キーワードでさがす"
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2 print:hidden">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setSelected((prev) => {
              const next = { ...prev };
              visible.forEach((i) => (next[i.key] = true));
              return next;
            })
          }
        >
          表示中をすべて選ぶ
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected({})}>
          選択をすべて解除
        </Button>
        <span className="text-xs text-muted-foreground">選択中 {chosen.length} 個</span>
        <Button type="button" disabled={chosen.length === 0} onClick={print}>
          選んだQRを印刷
        </Button>
      </div>

      <div className="mb-4 max-h-72 overflow-auto rounded-xl border border-border p-2 print:hidden">
        {visible.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">QRコードがありません。</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2">
            {visible.map((i) => (
              <li key={i.key}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60">
                  <input
                    type="checkbox"
                    checked={!!selected[i.key]}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [i.key]: e.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-bold">{i.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{i.sublabel}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mb-2 text-xs font-bold print:hidden">印刷プレビュー（A4）</p>
      <div className="overflow-auto print:overflow-visible">
        <div id="material-qr-sheet" className="material-sheet">
          {chosen.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground print:hidden">
              上のリストからQRコードを選ぶと、ここに配置が表示されます。
            </p>
          ) : (
            <div className="material-grid">
              {chosen.map((i) => (
                <figure key={i.key} className="material-cell">
                  <img src={i.url} alt={`${i.sublabel} ${i.label} のQRコード`} className="material-qr" />
                  <figcaption className="material-caption">
                    <span className="material-title">{i.label}</span>
                    <span className="material-sub">{i.sublabel}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
