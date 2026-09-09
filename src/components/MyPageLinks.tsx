import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { syncStudentDirectory } from "@/lib/class-sync.functions";
import { loginNumber, updateStudent, useAppState } from "@/lib/homework-store";

export default function MyPageLinks() {
  const state = useAppState();
  const [cls, setCls] = useState("all");
  const [qr, setQr] = useState("");
  const [saved, setSaved] = useState("");
  const sync = useServerFn(syncStudentDirectory);

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );

  const students = state.students
    .filter((s) => cls === "all" || s.className === cls)
    .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const QR = await import("qrcode");
      const url = `${window.location.origin}/me`;
      const img = await QR.toDataURL(url, { margin: 1, width: 320 });
      if (!cancelled) setQr(img);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = async () => {
    const rows = state.students
      .filter((s) => s.fiscalYear && s.grade && s.classNumber)
      .map((s) => ({
        studentId: s.id,
        fiscalYear: Number(s.fiscalYear),
        grade: Number(s.grade),
        classNumber: Number(s.classNumber),
        attendanceNumber: s.number,
        name: s.name,
      }));
    const res = await sync({ data: { rows } });
    setSaved(res.ok ? `${res.count}人 とうろくしました` : "とうろくできませんでした");
  };

  const numbers = students.map(loginNumber).filter(Boolean);
  const dup = numbers.filter((n, i) => numbers.indexOf(n) !== i);

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">児童のログイン番号とQRコード</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        ログイン番号は「年度＋学年＋クラス＋出席番号」をつなげた数字です。QRコードはみんな同じ
        ログイン画面につながり、番号を入れた本人のページだけがひらきます。
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
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
        <Button type="button" onClick={register}>
          ログイン番号をとうろく
        </Button>
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          印刷する
        </Button>
        {saved && <span className="text-xs text-muted-foreground">{saved}</span>}
      </div>

      {dup.length > 0 && (
        <p className="mb-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
          同じログイン番号の児童がいます（{Array.from(new Set(dup)).join("・")}
          ）。学年・クラス・出席番号を見なおしてください。
        </p>
      )}

      <div className="mb-4 flex items-center gap-4">
        {qr && (
          <img src={qr} alt="児童用ログイン画面のQRコード" className="w-32 rounded-xl border" />
        )}
        <p className="text-xs text-muted-foreground">
          このQRコードを読み取ると、児童用のログイン画面がひらきます。
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="p-2 text-left">氏名</th>
              <th className="p-2">年度</th>
              <th className="p-2">学年</th>
              <th className="p-2">クラス</th>
              <th className="p-2">出席番号</th>
              <th className="p-2">ログイン番号</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-2 font-bold">
                  {s.name}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {s.className}
                  </span>
                </td>
                {(
                  [
                    ["fiscalYear", s.fiscalYear],
                    ["grade", s.grade],
                    ["classNumber", s.classNumber],
                  ] as const
                ).map(([k, v]) => (
                  <td key={k} className="p-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={v ?? ""}
                      onChange={(e) =>
                        updateStudent(s.id, {
                          [k]: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="h-9 w-20 text-center"
                      aria-label={`${s.name} の ${k}`}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={s.number}
                    onChange={(e) => updateStudent(s.id, { number: Number(e.target.value) })}
                    className="h-9 w-20 text-center"
                    aria-label={`${s.name} の 出席番号`}
                  />
                </td>
                <td className="p-2 text-center font-display text-lg tracking-widest text-primary">
                  {loginNumber(s) || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
