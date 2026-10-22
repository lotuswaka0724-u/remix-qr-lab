import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PushOptIn, RedoBanner } from "@/components/RedoNotify";
import studentCss from "@/student-page.css?url";

export const Route = createFileRoute("/me_/redo-check")({
  head: () => ({ links: [{ rel: "stylesheet", href: studentCss }], meta: [{ title: "check" }] }),
  component: () => {
    const [items, setItems] = useState([
      { id: "h1", message: "🌟【計算ドリル】になおしがあるよ！" },
      { id: "h2", message: "🌟【漢字ノート】になおしがあるよ！" },
    ]);
    const api = { state: "default", enable: async () => {}, detach: async () => {} } as never;
    const on = { state: "on", enable: async () => {}, detach: async () => {} } as never;
    const home = { state: "needs-home", enable: async () => {}, detach: async () => {} } as never;
    return (
      <div className="student-page collection-page min-h-svh">
        <main className="relative z-10 mx-auto max-w-5xl space-y-4 px-3 py-28">
          <PushOptIn api={api} />
          <PushOptIn api={home} />
          <PushOptIn api={on} />
          <ul className="grid gap-2">
            <li className="hw-redo-ping flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-3">計算ドリル</li>
          </ul>
        </main>
        <RedoBanner items={items} onOpen={() => setItems([])} onClose={() => setItems([])} />
      </div>
    );
  },
});
