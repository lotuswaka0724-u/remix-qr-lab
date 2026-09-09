import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import CsvPanel from "@/components/CsvPanel";
import HwStateQrPrint from "@/components/HwStateQrPrint";
import MaterialQrPrint from "@/components/MaterialQrPrint";
import MyPageLinks from "@/components/MyPageLinks";
import QrMaker from "@/components/QrMaker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  addAssignment,
  addPrize,
  addStudent,
  HW_STATE_META,
  HW_STATE_ORDER,
  removeAssignment,
  removePrize,
  RANK_ORDER,
  removeStudent,
  setGachaCost,
  updateAssignment,
  updateHwPointRules,
  updateRankRules,
  updatePrize,
  updateStudent,
  useAppState,
  type HwState,
} from "@/lib/homework-store";
import { RANK_STYLE } from "@/lib/rank-style";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "管理 | 宿題チェッカー" },
      {
        name: "description",
        content: "宿題の項目とクラス名簿を追加・編集。今日の宿題として表示する項目も切り替えられます。",
      },
      { property: "og:title", content: "管理 | 宿題チェッカー" },
      {
        property: "og:description",
        content: "宿題の項目とクラス名簿を追加・編集できる管理画面です。",
      },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const state = useAppState();
  const [hwName, setHwName] = useState("");
  const [stName, setStName] = useState("");
  const [stClass, setStClass] = useState(state.students[0]?.className ?? "1年1組");
  const [prizeName, setPrizeName] = useState("");
  const [prizeWeight, setPrizeWeight] = useState("1");
  const [qrMode, setQrMode] = useState<"card" | "material" | "hwstate">("card");

  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <h1 className="font-display text-2xl font-bold">管理</h1>

      <section className="paper-card p-4">
        <h2 className="mb-1 font-display text-base font-bold">宿題項目</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          スイッチをオンにした宿題が「今日の宿題」として一覧・ボードに表示されます。
        </p>

        <ul className="space-y-2">
          {state.assignments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
              <Input
                value={a.name}
                onChange={(e) => updateAssignment(a.id, { name: e.target.value })}
                className="bg-card"
              />
              <Switch
                checked={a.inToday}
                onCheckedChange={(v) => updateAssignment(a.id, { inToday: v })}
                aria-label="今日の宿題に含める"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removeAssignment(a.id)}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!hwName.trim()) return;
            addAssignment(hwName.trim());
            setHwName("");
          }}
        >
          <Input value={hwName} onChange={(e) => setHwName(e.target.value)} placeholder="新しい宿題名" />
          <Button type="submit">追加</Button>
        </form>
      </section>

      <section className="paper-card p-4">
        <h2 className="mb-3 font-display text-base font-bold">クラス名簿</h2>

        <ul className="space-y-2">
          {[...state.students]
            .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number)
            .map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-2">
                <Input
                  type="number"
                  value={s.number}
                  onChange={(e) => updateStudent(s.id, { number: Number(e.target.value) })}
                  className="w-20 bg-card"
                />
                <Input
                  value={s.name}
                  onChange={(e) => updateStudent(s.id, { name: e.target.value })}
                  className="min-w-[8rem] flex-1 bg-card"
                />
                <Input
                  value={s.className}
                  onChange={(e) => updateStudent(s.id, { className: e.target.value })}
                  className="w-28 bg-card"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeStudent(s.id)}
                >
                  削除
                </Button>
              </li>
            ))}
        </ul>

        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!stName.trim()) return;
            addStudent(stName.trim(), stClass.trim() || "1年1組");
            setStName("");
          }}
        >
          <Input
            value={stName}
            onChange={(e) => setStName(e.target.value)}
            placeholder="児童名"
            className="min-w-[10rem] flex-1"
          />
          <Input
            value={stClass}
            onChange={(e) => setStClass(e.target.value)}
            placeholder="クラス"
            className="w-32"
          />
          <Button type="submit">追加</Button>
        </form>
      </section>

      <section className="paper-card p-4">
        <h2 className="mb-1 font-display text-base font-bold">しゅくだいカードのポイント</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          児童がえらぶカードごとのポイントを決められます。変えても、これまでの記録とポイントはそのまま残ります（つぎの読み取りから新しい点数になります）。
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[...HW_STATE_ORDER, "NO_REPORT" as HwState].map((st) => (
            <li key={st} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
              <span className="text-xl leading-none">{HW_STATE_META[st].icon}</span>
              <span className="min-w-0 flex-1 text-sm">
                {HW_STATE_META[st].label}
                {HW_STATE_META[st].teacherOnly && (
                  <span className="ml-1 text-[11px] text-muted-foreground">（先生用）</span>
                )}
              </span>
              <Input
                type="number"
                value={state.hwPointRules[st]}
                onChange={(e) => updateHwPointRules({ [st]: Number(e.target.value) })}
                className="w-20 bg-card"
              />
              <span className="text-xs text-muted-foreground">pt</span>
            </li>
          ))}
        </ul>
      </section>


      <section className="paper-card p-4">
        <h2 className="mb-1 font-display text-base font-bold">カードランクの設定</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          通算ポイントが下の数字以上になると、そのランクになります。カードのデザインも、読み取りのときの音や演出も、この判定にそろって変わります。
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {RANK_ORDER.map((r) => (
            <li key={r} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2">
              <span
                className={`rounded-full px-2 py-0.5 font-display text-[11px] font-bold tracking-widest ${RANK_STYLE[r].badge}`}
              >
                {RANK_STYLE[r].label}
              </span>
              <Input
                type="number"
                value={state.rankRules[r]}
                disabled={r === "NORMAL"}
                onChange={(e) => updateRankRules({ [r]: Number(e.target.value) })}
                className="w-24 bg-card"
              />
              <span className="text-xs text-muted-foreground">pt以上</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="paper-card p-4">
        <h2 className="mb-1 font-display text-base font-bold">ガチャの設定</h2>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm">1回にひつようなポイント</span>
          <Input
            type="number"
            value={state.gachaCost}
            onChange={(e) => setGachaCost(Number(e.target.value))}
            className="w-24 bg-card"
          />
          <span className="text-xs text-muted-foreground">pt</span>
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          「当たりやすさ」の数字が大きいほど、よく出ます。
        </p>
        <ul className="space-y-2">
          {state.prizes.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-2">
              <Input
                value={p.name}
                onChange={(e) => updatePrize(p.id, { name: e.target.value })}
                className="min-w-[9rem] flex-1 bg-card"
              />
              <Input
                type="number"
                value={p.weight}
                onChange={(e) => updatePrize(p.id, { weight: Number(e.target.value) })}
                className="w-24 bg-card"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => removePrize(p.id)}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!prizeName.trim()) return;
            addPrize(prizeName.trim(), Number(prizeWeight) || 1);
            setPrizeName("");
            setPrizeWeight("1");
          }}
        >
          <Input
            value={prizeName}
            onChange={(e) => setPrizeName(e.target.value)}
            placeholder="景品名"
            className="min-w-[10rem] flex-1"
          />
          <Input
            value={prizeWeight}
            onChange={(e) => setPrizeWeight(e.target.value)}
            placeholder="当たりやすさ"
            className="w-32"
          />
          <Button type="submit">追加</Button>
        </form>
      </section>

      <CsvPanel />

      <section className="paper-card p-4">
        <h2 className="mb-1 font-display text-base font-bold">QRコード管理・印刷</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          用途に合わせて印刷のしかたを選べます。
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={qrMode === "card" ? "default" : "secondary"}
            onClick={() => setQrMode("card")}
          >
            QRカード印刷
          </Button>
          <Button
            type="button"
            variant={qrMode === "material" ? "default" : "secondary"}
            onClick={() => setQrMode("material")}
          >
            教材貼付用QR印刷
          </Button>
          <Button
            type="button"
            variant={qrMode === "hwstate" ? "default" : "secondary"}
            onClick={() => setQrMode("hwstate")}
          >
            しゅくだいカード印刷（児童用）
          </Button>
        </div>
      </section>

      {qrMode === "card" ? <QrMaker /> : qrMode === "material" ? <MaterialQrPrint /> : <HwStateQrPrint />}


      <MyPageLinks />

      <p className="text-xs text-muted-foreground">
        データはこの端末のブラウザに保存されます。別の端末とは共有されません。
      </p>
    </main>
  );
}
