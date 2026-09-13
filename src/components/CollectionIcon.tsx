import { frameRing, iconEmoji, iconImage } from "@/lib/collection-catalog";

type Props = {
  iconId?: string | undefined;
  frameId?: string | undefined;
  size?: number;
  className?: string;
};

/** アイコン＋フレーム。どちらも未設定ならなにも描かない（既存の表示をそのまま残せる） */
export default function CollectionIcon({ iconId, frameId, size = 26, className = "" }: Props) {
  const emoji = iconEmoji(iconId);
  const image = iconImage(iconId);
  const ring = frameRing(frameId);
  if (!emoji && !image && !ring) return null;

  const pad = Math.max(2, Math.round(size * 0.1));
  return (
    <span
      className={`inline-grid shrink-0 place-content-center rounded-full align-middle ${className}`}
      style={{
        width: size,
        height: size,
        padding: ring ? pad : 0,
        background: ring ?? "transparent",
      }}
      aria-hidden
    >
      <span
        className="grid place-content-center rounded-full bg-card leading-none"
        style={{ width: size - (ring ? pad * 2 : 0), height: size - (ring ? pad * 2 : 0), fontSize: size * 0.55 }}
      >
        {emoji ?? "🙂"}
      </span>
    </span>
  );
}
