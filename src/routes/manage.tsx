import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import QrMaker from "@/components/QrMaker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  addAssignment,
  addStudent,
  removeAssignment,
  removeStudent,
  updateAssignment,
  updateStudent,
  useAppState,
} from "@/lib/homework-store";

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

      <p className="text-xs text-muted-foreground">
        データはこの端末のブラウザに保存されます。別の端末とは共有されません。
      </p>
    </main>
  );
}
