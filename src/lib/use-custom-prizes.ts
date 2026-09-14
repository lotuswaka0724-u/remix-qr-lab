import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { registerCustomItems } from "@/lib/collection-catalog";
import { listCustomPrizes, type CustomPrize } from "@/lib/prizes.functions";

/**
 * 先生が登録した景品を読み込んで、画面のアイテム一覧に合流させる。
 * 読み込めなくても既存アイテムはそのまま使えるようにしてある。
 */
export function useCustomPrizes() {
  const load = useServerFn(listCustomPrizes);
  const [prizes, setPrizes] = useState<CustomPrize[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let off = false;
    void load({})
      .then((rows) => {
        if (off) return;
        registerCustomItems(rows ?? []);
        setPrizes(rows ?? []);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => {
      off = true;
    };
  }, [load]);

  return { prizes, ready };
}
