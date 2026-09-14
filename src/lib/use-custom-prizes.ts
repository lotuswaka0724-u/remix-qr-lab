import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { applyAssetOverrides, registerCustomItems } from "@/lib/collection-catalog";
import {
  listCustomPrizes,
  listPrizeOverrides,
  type CustomPrize,
  type PrizeOverride,
} from "@/lib/prizes.functions";

/**
 * 先生が登録した景品と、既存景品の素材差し替えを読み込んで画面に反映する。
 * 読み込めなくても既存アイテムはそのまま使えるようにしてある。
 */
export function useCustomPrizes() {
  const load = useServerFn(listCustomPrizes);
  const loadOverrides = useServerFn(listPrizeOverrides);
  const [prizes, setPrizes] = useState<CustomPrize[]>([]);
  const [overrides, setOverrides] = useState<PrizeOverride[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let off = false;
    void load({})
      .then((rows) => {
        if (off) return;
        registerCustomItems(rows ?? []);
        setPrizes(rows ?? []);
      })
      .catch(() => {})
      .then(() => loadOverrides({}))
      .then((rows) => {
        if (off) return;
        applyAssetOverrides(rows ?? []);
        setOverrides(rows ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!off) setReady(true);
      });
    return () => {
      off = true;
    };
  }, [load, loadOverrides]);

  return { prizes, overrides, ready };
}
