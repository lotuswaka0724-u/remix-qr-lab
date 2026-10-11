import type { CSSProperties, ReactNode } from "react";

import { namePlateStyle } from "@/lib/collection-catalog";

/** 装備中のネームプレートの色（児童カードの細い枠線に使う） */
export function namePlateFrameStyle(plateId?: string): CSSProperties | undefined {
  const s = namePlateStyle(plateId, true);
  if (s.plain) return undefined;
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
  return (
    <span
      className={`name-plate rarity-${s.rarity.toLowerCase()} ${s.plain ? "name-plate-plain" : ""} ${className}`}
      style={{ "--plate-art": s.art, "--plate-accent": s.accent } as CSSProperties}
      data-plate={s.id}
    >
      <span className="name-plate-text">{children}</span>
    </span>
  );
}
