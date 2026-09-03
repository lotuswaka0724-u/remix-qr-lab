import { useEffect, useRef, useState } from "react";

type Props = {
  active: boolean;
  onDetected: (text: string) => void;
};

const REGION_ID = "qr-scan-region";

// iPad/iOS Safari 対応：
// - HTTPS 必須（プレビュー/公開URLはHTTPS）
// - ユーザー操作（ボタン）起点でのみカメラ起動
// - video に playsinline / muted を付与しないと再生されない
// - 背面カメラが無い機種もあるためカメラ一覧からフォールバック
function patchVideoForIOS(root: HTMLElement | null) {
  const video = root?.querySelector("video");
  if (!video) return;
  video.setAttribute("playsinline", "true");
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("muted", "true");
  video.muted = true;
  video.play().catch(() => {});
}

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
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("no-camera-api");
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        if (stopped) return;

        // 先に許可ダイアログを出しておく（iPadOS Safari で安定する）
        const probe = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        probe.getTracks().forEach((t) => t.stop());
        if (stopped) return;

        scanner = new Html5Qrcode(REGION_ID, { verbose: false });
        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.3333,
          disableFlip: false,
        };
        const onScan = (text: string) => detectedRef.current(text);

        try {
          await scanner.start({ facingMode: { exact: "environment" } }, config, onScan, () => {});
        } catch {
          // 背面カメラが使えない場合はカメラ一覧から選択
          const cams = await Html5Qrcode.getCameras();
          if (!cams?.length) throw new Error("no-camera");
          const back =
            cams.find((c) => /back|rear|environment|背面/i.test(c.label)) ?? cams[cams.length - 1];
          await scanner.start(back.id, config, onScan, () => {});
        }

        if (stopped) {
          await scanner.stop();
          return;
        }
        setError(null);
        // iOS で video が再生されないケースの保険
        setTimeout(() => patchVideoForIOS(document.getElementById(REGION_ID)), 200);
      } catch (e) {
        if (stopped) return;
        const name = (e as { name?: string })?.name;
        if (name === "NotAllowedError") {
          setError(
            "カメラの使用が許可されていません。iPad の「設定 > Safari > カメラ」または画面左上の「ぁあ」→ Webサイトの設定 から許可してください。",
          );
        } else if (!window.isSecureContext) {
          setError("安全な接続（HTTPS）でないためカメラを使用できません。");
        } else {
          setError("カメラを起動できませんでした。他のアプリでカメラを使用していないかご確認ください。");
        }
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
