import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import CompleteCelebration from "@/components/CompleteCelebration";
import StudentProgress from "@/components/StudentProgress";
import studentWorld from "@/assets/collection/student-crystal-world.asset.json";
import studentCss from "@/student-page.css?url";

export const Route = createFileRoute("/fx-check")({
  head: () => ({ links: [{ rel: "stylesheet", href: studentCss }], meta: [{ title: "fx check" }] }),
  component: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="student-page collection-page min-h-svh" style={{ "--student-world-image": `url("${studentWorld.url}")` } as React.CSSProperties}>
        <main className="relative z-10 mx-auto max-w-5xl space-y-4 px-3 py-5">
          <StudentProgress streak={4} total={12} completeToday={false} earned={77} rankRules={{ NORMAL: 0, GOLD: 100, BLACK: 300 }} left={2} />
          <StudentProgress variant="rank" streak={0} total={0} completeToday earned={340} rankRules={{ NORMAL: 0, GOLD: 100, BLACK: 300 }} left={0} />
          <button type="button" onClick={() => setOpen(true)}>open</button>
          <CompleteCelebration open={open} onClose={() => setOpen(false)} name="テスト" streak={4} total={12} />
        </main>
      </div>
    );
  },
});
