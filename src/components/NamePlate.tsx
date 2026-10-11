import type { CSSProperties, ReactNode } from "react";

import { namePlateStyle } from "@/lib/collection-catalog";
import { animatedPlateKind } from "@/lib/animated-plates";
import "@/animated-plates.css";

/** 装備中のネームプレートの色（児童カードの細い枠線に使う） */
export function namePlateFrameStyle(plateId?: string): CSSProperties | undefined {
  const s = namePlateStyle(plateId, true);
  return { "--plate-accent": s.accent } as CSSProperties;
}

type Props = {
  plateId?: string | undefined;
  children: ReactNode;
  /** 先生画面など：画像を読まず色だけで軽く表示する */
  lite?: boolean;
  className?: string;
};

/** 名前の部分に表示するネームプレート（高さは名前の行とほぼ同じ） */
export default function NamePlate({ plateId, children, lite = false, className = "" }: Props) {
  const s = namePlateStyle(plateId, lite);
  const motion = animatedPlateKind(s.id);
  return (
    <span
      className={`name-plate rarity-${s.rarity.toLowerCase()} ${lite ? "name-plate-lite" : ""} ${className}`}
      style={{ "--plate-art": s.art, "--plate-accent": s.accent } as CSSProperties}
      data-plate={s.id}
      data-motion={motion}
    >
      {motion && <span className="motion-plate-effects" aria-hidden="true">
        <i className="motion-plate-rim" />
        <i className="motion-plate-ray motion-plate-ray-top" />
        <i className="motion-plate-ray motion-plate-ray-bottom" />
        <i className="motion-plate-end motion-plate-end-left" />
        <i className="motion-plate-end motion-plate-end-right" />
        <i className="motion-plate-spark motion-plate-spark-left" />
        <i className="motion-plate-spark motion-plate-spark-right" />
      </span>}
      <span className="name-plate-text">{children}</span>
    </span>
  );
}
