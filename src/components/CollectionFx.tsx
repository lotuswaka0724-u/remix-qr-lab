import { useEffect, useState } from "react";

/**
 * ガチャで手に入る「QR読み取りエフェクト」の演出。
 * fx のキーごとに、とぶ絵と色をかえる。GOLD / BLACK はさらに大きな演出をかさねる。
 */

type Rank = "NORMAL" | "GOLD" | "BLACK";

const FX: Record<string, { emojis: string[]; count: number; wash: string; label?: string }> = {
  spark: { emojis: ["✨"], count: 8, wash: "from-primary/25" },
  pop: { emojis: ["💥", "❕"], count: 10, wash: "from-accent/25" },
  stars: { emojis: ["⭐"], count: 12, wash: "from-warning/25" },
  bubble: { emojis: ["🫧", "○"], count: 14, wash: "from-sky-400/25" },
  glitter: { emojis: ["✨", "💫"], count: 18, wash: "from-fuchsia-400/25" },
  ring: { emojis: ["◯", "○"], count: 10, wash: "from-cyan-400/30" },
  coin: { emojis: ["🪙"], count: 16, wash: "from-amber-400/30" },
  confetti: { emojis: ["🎊", "🎉", "🟥", "🟦", "🟨"], count: 22, wash: "from-pink-400/30" },
  starfall: { emojis: ["🌟", "⭐", "✨"], count: 24, wash: "from-indigo-400/30" },
  gold: { emojis: ["🏆", "👑", "✨", "🪙"], count: 28, wash: "from-amber-300/45", label: "GOLD!" },
  black: {
    emojis: ["👑", "🌌", "💎", "✨"],
    count: 34,
    wash: "from-slate-900/60",
    label: "BLACK!!",
  },
};

type Props = { fx?: string | null | undefined; rank?: Rank; playId?: number | null };

export default function CollectionFx({ fx, rank = "NORMAL", playId }: Props) {
  const [shown, setShown] = useState<number | null>(null);
  // レアリティの段階（1=シンプル / 2=光＋粒 / 3=強い光＋リング / 4=いちばん豪華）
  const tier = Math.max(tierOfArt("fx", fx), rank === "BLACK" ? 4 : rank === "GOLD" ? 3 : 1);

  useEffect(() => {
    if (!playId) return;
    setShown(playId);
    // 授業のじゃまにならないよう、いちばん豪華でも 2.2 秒までにする
    const t = window.setTimeout(() => setShown(null), 900 + tier * 320);
    return () => window.clearTimeout(t);
  }, [playId, tier]);

  if (!shown) return null;
  const conf = FX[fx ?? "spark"] ?? FX["spark"]!;
  const count = Math.round(conf.count * (0.8 + tier * 0.3));
  const pieces = Array.from({ length: count }, (_, i) => i);
  const big = rank === "GOLD" || rank === "BLACK" || tier >= 4;

  return (
    <div
      key={shown}
      className={`pointer-events-none fixed inset-0 z-[60] overflow-hidden fx-tier-${tier}`}
      aria-hidden
    >
      <div className={`fx-wash absolute inset-0 bg-gradient-to-b ${conf.wash} to-transparent`} />
      {tier >= 2 && <div className="fx-flash" />}
      {tier >= 3 && <div className="fx-burst-ring" />}
      {tier >= 4 && <div className="fx-burst-ring fx-burst-ring-late" />}
      {big && (
        <div className={`fx-special-ring ${rank === "BLACK" ? "fx-special-ring-black" : ""}`} />
      )}
      {pieces.map((i) => (
        <span
          key={i}
          className="fx-confetti absolute top-0 select-none"
          style={{
            left: `${(i * 11 + 4) % 97}%`,
            fontSize: big ? 30 : 16 + tier * 4,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--dx" as any]: `${(i % 5) * 22 - 44}px`,
            animationDelay: `${(i % 7) * 55}ms`,
          }}
        >
          {conf.emojis[i % conf.emojis.length]}
        </span>
      ))}
      {(conf.label || big) && (
        <div className="absolute inset-0 grid place-content-center">
          <span
            className={`fx-pop rounded-full px-8 py-3 font-display text-3xl font-bold tracking-widest ${
              rank === "BLACK"
                ? "bg-slate-900 text-amber-300 ring-4 ring-amber-400"
                : "bg-amber-300 text-amber-900 ring-4 ring-amber-500"
            }`}
          >
            {conf.label ?? (rank === "BLACK" ? "BLACK!!" : "GOLD!")}
          </span>
        </div>
      )}
    </div>
  );
}
