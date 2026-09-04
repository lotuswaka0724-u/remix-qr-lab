type Props = {
  hit: { id: number; student: string; assignment: string } | null;
};

const PIECES = Array.from({ length: 14 }, (_, i) => i);

export default function SuccessFx({ hit }: Props) {
  if (!hit) return null;

  return (
    <div
      key={hit.id}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      aria-live="polite"
    >
      <div className="fx-wash absolute inset-0 bg-success/25" />

      {PIECES.map((i) => (
        <span
          key={i}
          className="fx-confetti absolute top-0 h-3 w-1.5 rounded-full bg-accent"
          style={{
            left: `${(i * 7 + 6) % 96}%`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ["--dx" as any]: `${(i % 5) * 18 - 36}px`,
            animationDelay: `${(i % 6) * 60}ms`,
            backgroundColor:
              i % 3 === 0
                ? "var(--success)"
                : i % 3 === 1
                  ? "var(--accent)"
                  : "var(--primary)",
          }}
        />
      ))}

      <div className="absolute inset-0 grid place-content-center">
        <div className="relative grid place-items-center">
          <span className="fx-ring absolute h-40 w-40 rounded-full border-4 border-success" />
          <div className="fx-pop flex flex-col items-center gap-3 rounded-4xl bg-card/95 px-10 py-8 shadow-[var(--shadow-lift)] ring-4 ring-success/40">
            <svg viewBox="0 0 48 48" className="h-16 w-16">
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
            <p className="text-sm font-bold text-success">{hit.assignment} を記録しました</p>
          </div>
        </div>
      </div>
    </div>
  );
}
