import { useEffect, useRef, useState } from "react";

type Props = {
  active: boolean;
  onDetected: (text: string) => void;
};

const REGION_ID = "qr-scan-region";

export default function QrScanner({ active, onDetected }: Props) {
  const [error, setError] = useState<string | null>(null);
  const detectedRef = useRef(onDetected);
  detectedRef.current = onDetected;

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;
        scanner = new Html5Qrcode(REGION_ID, { verbose: false });
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text: string) => detectedRef.current(text),
          () => {},
        );
        if (stopped) await scanner.stop();
        else setError(null);
      } catch {
        if (!stopped) setError("カメラを起動できませんでした。ブラウザのカメラ許可をご確認ください。");
      }
    })();

    return () => {
      stopped = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, [active]);

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl bg-foreground/90 aspect-[4/3]">
        <div id={REGION_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        {active && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-44 w-44 rounded-2xl border-2 border-accent/80 shadow-[0_0_0_9999px_oklch(0_0_0/0.35)]" />
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 grid place-content-center text-center text-sm text-background/80">
            スキャンは停止中です
          </div>
        )}
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-bold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
