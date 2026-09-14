import { RANK_STYLE } from "@/lib/rank-style";
import type { Rank } from "@/lib/homework-store";

export type Hit = {
  id: number;
  student: string;
  assignment: string;
  rank: Rank;
  points: number;
  /** ランクアップしたときだけ、上がった先のランク */
  rankUp: Rank | null;
};

type Props = { hit: Hit | null };

export default function SuccessFx({ hit }: Props) {
  if (!hit) return null;

  const style = RANK_STYLE[hit.rank];
  const pieces = Array.from({ length: style.pieces }, (_, i) => i);

  return (
    <div
      key={hit.id}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-live="polite"
    >
      <div className={`fx-wash absolute inset-0 ${style.fxWash}`} />

      {pieces.map((i) => (
        <span
          key={i}
          className="fx-confetti absolute top-0 h-3 w-1.5 rounded-full"
          style={{
            left: `${(i * 7 + 6) % 96}%`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--dx" as any]: `${(i % 5) * 18 - 36}px`,
            animationDelay: `${(i % 6) * 60}ms`,
            backgroundColor: style.confetti[i % style.confetti.length],
          }}
        />
      ))}

      <div className="absolute inset-0 grid place-content-center">
        <div className="relative grid place-items-center">
          <span className={`fx-ring absolute h-40 w-40 rounded-full border-4 ${style.fxRing}`} />
          {hit.rank !== "NORMAL" && (
            <span
              className={`fx-ring absolute h-56 w-56 rounded-full border-2 ${style.fxRing}`}
              style={{ animationDelay: "160ms" }}
            />
          )}

          <div
            className={`fx-pop flex flex-col items-center gap-2 rounded-4xl px-10 py-8 shadow-[var(--shadow-lift)] ring-4 ${style.fxPanel}`}
          >
            <span
              className={`rounded-full px-3 py-0.5 font-display text-xs font-bold tracking-widest ${style.badge}`}
            >
              {style.label}
            </span>

            <svg viewBox="0 0 48 48" className="h-14 w-14">
              <circle cx="24" cy="24" r="21" className="fill-success/15" />
              <path
                d="M14 25l7 7 13-15"
                className="fx-tick fill-none stroke-success"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="font-display text-3xl font-bold leading-none">{hit.student}</p>
            <p className={`text-sm font-bold ${style.fxText}`}>
              {hit.assignment} を記録しました
            </p>
            <p
              className={`fx-pop font-display text-2xl font-bold tabular-nums ${
                hit.points >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {hit.points >= 0 ? `+${hit.points}` : hit.points}
              <span className="ml-1 text-sm">pt</span>
            </p>

            {hit.rankUp && (
              <p
                className={`fx-pop mt-1 rounded-2xl px-4 py-2 font-display text-xl font-bold tracking-wider ${RANK_STYLE[hit.rankUp].badge}`}
              >
                {RANK_STYLE[hit.rankUp].label} CARD GET!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
