import { useEffect, useState } from "react";

import { backgroundCss, backgroundVisual } from "@/lib/collection-catalog";

type Props = {
  backgroundId?: string | undefined;
  preview?: boolean;
  className?: string;
};

export default function CollectionBackdrop({ backgroundId, preview = false, className = "" }: Props) {
  const visual = backgroundVisual(backgroundId);
  const [broken, setBroken] = useState(false);

  useEffect(() => setBroken(false), [visual.image]);

  return (
    <span
      className={`collection-backdrop collection-backdrop-${visual.theme} rarity-${visual.rarity.toLowerCase()} ${preview ? "collection-backdrop-preview" : ""} ${className}`}
      style={{ background: backgroundCss(backgroundId) }}
      aria-hidden
    >
      {visual.image && !broken && (
        <img
          src={visual.image}
          alt=""
          width={1536}
          height={1024}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      )}
      <span className="collection-backdrop-depth" />
      {!preview && visual.animated && <span className="collection-backdrop-particles" />}
      {!preview && visual.animated && <span className="collection-backdrop-light" />}
      <span className="collection-backdrop-protect" />
    </span>
  );
}