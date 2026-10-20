import { createFileRoute } from "@tanstack/react-router";

import CrystalPullRefresh from "@/components/CrystalPullRefresh";
import studentCss from "@/student-page.css?url";

export const Route = createFileRoute("/ptr-check")({
  head: () => ({ links: [{ rel: "stylesheet", href: studentCss }], meta: [{ title: "ptr check" }] }),
  component: () => (
    <div className="student-page min-h-svh">
      <main className="relative z-10 mx-auto max-w-5xl px-3 py-5">
        <CrystalPullRefresh onRefresh={() => new Promise((r) => setTimeout(r, 1500))} className="space-y-4">
          <section className="kid-panel p-6">テスト</section>
          <section className="kid-panel p-6">テスト2</section>
        </CrystalPullRefresh>
      </main>
    </div>
  ),
});
