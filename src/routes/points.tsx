import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import pointsCss from "@/teacher-points.css?url";
import teacherWorld from "@/assets/collection/student-crystal-world.asset.json";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  availablePoints,
  earnedPoints,
  grantManualPoints,
  ranking,
  spentPoints,
  useAppState,
} from "@/lib/homework-store";

export const Route = createFileRoute("/points")({
  head: () => ({
    links: [{ rel: "stylesheet", href: pointsCss }],
    meta: [
      { title: "教師用ポイント一覧 | REMIX QR LAB" },
      {
        name: "description",
        content: "宿題の提出でたまった児童ごとのポイントとランキングを確認できるページです。",
      },
      { property: "og:title", content: "教師用ポイント一覧 | REMIX QR LAB" },
      {
        property: "og:description",
        content: "児童ひとりひとりの獲得ポイントと使用ポイントを確認できる一覧ページ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PointsPage,
});

function PointsPage() {
  const state = useAppState();
  const [classFilter, setClassFilter] = useState("all");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [grant, setGrant] = useState("5");
  const [grantNote, setGrantNote] = useState("");

  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const rank = useMemo(() => ranking(state, classFilter), [state, classFilter]);
  const student = state.students.find((s) => s.id === studentId) ?? null;
  const available = student ? availablePoints(state, student.id) : 0;

  return (
    <main className="teacher-points-page mx-auto max-w-5xl space-y-4 px-4 py-6" style={{ "--points-world-image": `url("${teacherWorld.url}")` } as CSSProperties}>
      <h1 className="font-display text-2xl font-bold">ポイント一覧</h1>

      <section className="glass-panel p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display text-base font-bold">だれのポイント？</h2>
          <select
            className="rounded-full border border-input bg-background px-3 py-1.5 text-xs"
            aria-label="クラスで絞り込み"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">全クラス</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rank.map((r, i) => (
            <Button
              key={r.student.id}
              type="button"
              variant="ghost"
              aria-pressed={studentId === r.student.id}
              onClick={() => {
                setStudentId(r.student.id);
              }}
              className={`points-student flex items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition-all ${
                studentId === r.student.id
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-lift)]"
                  : "bg-muted/60 hover:bg-secondary"
              }`}
            >
              <span className="points-rank w-5 shrink-0 text-center tabular-nums opacity-70">{i + 1}</span>
              <span className="points-name min-w-0 flex-1 truncate font-bold">{r.student.name}</span>
              <span className="points-row-total shrink-0 tabular-nums">
                {availablePoints(state, r.student.id)}<span className="points-unit ml-0.5">pt</span>
              </span>
            </Button>
          ))}
        </div>
      </section>

      {student && (
        <section className="glass-panel p-5 text-center">
          <p className="font-display text-lg font-bold">{student.name} さん</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ためた {earnedPoints(state, student.id)}pt ／ つかった {spentPoints(state, student.id)}
            pt
          </p>
          <p className="points-total mt-2 font-display text-5xl font-bold text-primary tabular-nums">
            {available}
            <span className="ml-1 text-base">pt</span>
          </p>

          <form
            className="points-grant-form mx-auto mt-5 flex max-w-md flex-wrap items-center justify-center gap-2 rounded-2xl bg-muted/60 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const amount = Number(grant);
              if (!Number.isFinite(amount) || amount <= 0) {
                toast.error("1以上の数字を入れてください");
                return;
              }
              const res = grantManualPoints(student.id, amount, grantNote.trim() || undefined);
              if (!res) {
                toast.error("ポイントをわたせませんでした");
                return;
              }
              setGrantNote("");
              toast.success(`${student.name} さんに ${res.amount}pt わたしました`);
            }}
          >
            <span className="w-full text-xs font-bold text-muted-foreground">
              先生からポイントをわたす
            </span>
            <Input
              type="number"
              min={1}
              step={1}
              value={grant}
              onChange={(e) => setGrant(e.target.value)}
              className="w-24 bg-card"
              aria-label="わたすポイント"
            />
            <Input
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
              placeholder="りゆう（にんい）"
              maxLength={40}
              className="min-w-[8rem] flex-1 bg-card"
            />
            <Button type="submit" className="points-grant-button">わたす</Button>
          </form>

          <p className="points-note mx-auto mt-3 max-w-md rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
            ガチャとアイテムBOXは、児童本人のマイページから利用できます。
          </p>
        </section>
      )}
    </main>
  );
}
