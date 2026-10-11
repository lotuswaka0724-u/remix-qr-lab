import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pause, Play, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NameplatePrototype } from "@/components/NameplatePrototype";
import prototypeCss from "@/nameplate-prototype.css?url";
import NamePlate from "@/components/NamePlate";
import { ANIMATED_PLATES } from "@/lib/animated-plates";

export const Route = createFileRoute("/nameplate-lab")({
  head: () => ({
    meta: [
      { title: "名前プレート試作室 | REMIX QR LAB" },
      { name: "description", content: "REMIX QR LABの独立した名前プレート試作画面。" },
      { property: "og:title", content: "名前プレート試作室 | REMIX QR LAB" },
      { property: "og:description", content: "本番アイテムとは分離した名前プレートの試作。" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: prototypeCss }],
  }),
  component: NameplateLab,
});

function NameplateLab() {
  const [many, setMany] = useState(false);
  const [paused, setPaused] = useState(false);
  const [added, setAdded] = useState(true);
  return (
    <main className="nameplate-lab" data-paused={paused}>
      <div className="nameplate-lab__content">
        <p className="text-sm text-muted-foreground">REMIX QR LAB / 試作室</p>
        <h1 className="mt-2 text-2xl font-bold">クリスタル・シアン</h1>
        <div className="nameplate-lab__toolbar">
          <div className="flex gap-1" role="group" aria-label="表示人数">
            <Button variant={many ? "outline" : "default"} onClick={() => setMany(false)} aria-pressed={!many}><UserRound />1人</Button>
            <Button variant={many ? "default" : "outline"} onClick={() => setMany(true)} aria-pressed={many}><Users />30人</Button>
          </div>
          <Button variant="outline" onClick={() => setPaused((value) => !value)} aria-label={paused ? "動きを再開" : "動きを停止"}>{paused ? <Play /> : <Pause />}{paused ? "再開" : "停止"}</Button>
          <Button variant="outline" onClick={() => setAdded(value => !value)}>{added ? "以前の試作" : "追加6種類"}</Button>
        </div>
        {added ? (
          <div className="nameplate-lab__grid">
            {Array.from({ length: many ? 30 : 6 }, (_, index) => {
              const item = ANIMATED_PLATES[index % ANIMATED_PLATES.length];
              if (!item) return null;
              return <div className="nameplate-lab__entry" key={index}>
                <NamePlate plateId={item.id} lite={many}>テスト児童 {index + 1}</NamePlate>
                <p>{item.name} / {item.rarity}　✓ 提出済み</p>
              </div>;
            })}
          </div>
        ) : many ? (
          <div className="nameplate-lab__grid">
            {Array.from({ length: 30 }, (_, index) => (
              <div className="nameplate-lab__entry" key={index}>
                <NameplatePrototype name={`テスト児童 ${String(index + 1).padStart(2, "0")}`} />
                <p>✓ 提出済み</p>
              </div>
            ))}
          </div>
        ) : <div className="nameplate-lab__single"><NameplatePrototype name="テスト児童" /></div>}
      </div>
    </main>
  );
}