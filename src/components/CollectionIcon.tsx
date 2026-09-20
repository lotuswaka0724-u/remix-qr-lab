import { useEffect, useState } from "react";

import { frameRing, frameVisual, iconEmoji, iconImage } from "@/lib/collection-catalog";

type Props = {
  iconId?: string | undefined;
  frameId?: string | undefined;
  size?: number;
  className?: string;
  preview?: boolean;
};

/** アイコン＋フレーム。どちらも未設定ならなにも描かない（既存の表示をそのまま残せる） */
export default function CollectionIcon({
  iconId,
  frameId,
  size = 26,
  className = "",
  preview = false,
}: Props) {
  const emoji = iconEmoji(iconId);
  const image = iconImage(iconId);
  const ring = frameRing(frameId);
  const visual = frameVisual(frameId);
  // 画像が壊れている・消されている場合は絵文字にもどす（画面は止めない）
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [image]);
  const showImage = image && !broken;

  if (!emoji && !image && !ring) return null;

  const pad = Math.max(2, Math.round(size * 0.12));
  return (
    <span
      className={`collection-frame rarity-${visual?.rarity.toLowerCase() ?? "n"} collection-frame-${visual?.theme ?? "simple"} ${preview ? "collection-frame-preview" : ""} inline-grid shrink-0 place-content-center rounded-full align-middle ${className}`}
      style={{
        width: size,
        height: size,
        padding: ring ? pad : 0,
        background: visual?.image ? "transparent" : (ring ?? "transparent"),
      }}
      aria-hidden
    >
      {visual?.image && (
        <img
          src={visual.image}
          alt=""
          className="collection-frame-image"
          width={1024}
          height={1024}
          loading="lazy"
        />
      )}
      {ring && <span className="collection-frame-ring" style={{ background: ring }} />}
      {visual && <span className="collection-frame-ornaments" />}
      {!preview && visual?.animated && <span className="collection-frame-energy" />}
      <span
        className="collection-frame-core grid place-content-center rounded-full bg-card leading-none"
        style={{
          width: size - (ring ? pad * 2 : 0),
          height: size - (ring ? pad * 2 : 0),
          fontSize: size * 0.55,
        }}
      >
        {showImage ? (
          <img
            src={image}
            alt=""
            className="h-full w-full rounded-full object-cover"
            loading="lazy"
            onError={() => setBroken(true)}
          />
        ) : (
          (emoji ?? "🙂")
        )}
      </span>
    </span>
  );
}
