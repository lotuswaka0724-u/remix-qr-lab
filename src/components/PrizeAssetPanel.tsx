import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  applyAssetOverrides,
  COLL_CATEGORIES,
  COLL_CATEGORY_LABEL,
  COLL_ITEMS,
  type CollCategory,
} from "@/lib/collection-catalog";
import {
  clearPrizeOverride,
  listPrizeOverrides,
  PRIZE_FILE_RULES,
  setPrizeOverride,
  type PrizeOverride,
} from "@/lib/prizes.functions";

const ERROR_TEXT: Record<string, string> = {
  auth: "先生モードでログインしてください",
  notfound: "この景品は差し替えできません",
  filetype: "このカテゴリで使えないファイル形式です",
  broken: "ファイルを読み取れませんでした",
  toobig: "ファイルが大きすぎます",
  upload: "ファイルの保存に失敗しました",
  save: "差し替えの保存に失敗しました",
};

function readBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const s = String(fr.result ?? "");
      resolve(s.slice(s.indexOf(",") + 1));
    };
    fr.onerror = () => reject(new Error("read"));
    fr.readAsDataURL(file);
  });
}

/**
 * もともと入っている景品（154種類）の素材だけを差し替える画面。
 * 景品名・カテゴリー・レアリティ・ガチャの出やすさは変わらない。
 */
export default function PrizeAssetPanel() {
  const list = useServerFn(listPrizeOverrides);
  const save = useServerFn(setPrizeOverride);
  const clear = useServerFn(clearPrizeOverride);

  const [category, setCategory] = useState<CollCategory>("icon");
  const [overrides, setOverrides] = useState<PrizeOverride[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState("");

  const apply = (rows: PrizeOverride[]) => {
    applyAssetOverrides(rows);
    setOverrides(rows);
  };

  useEffect(() => {
    let off = false;
    void list({})
      .then((rows) => {
        if (!off) apply(rows ?? []);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [list]);

  const items = useMemo(
    () => COLL_ITEMS.filter((i) => i.category === category && !i.id.startsWith("cx_")),
    // 差し替え後は一覧の見た目も更新したいので overrides も見ている
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, overrides],
  );
  const byId = useMemo(() => new Map(overrides.map((o) => [o.prizeId, o])), [overrides]);
  const rule = PRIZE_FILE_RULES[category];

  const onPick = async (file: File | null) => {
    if (!file || !target) return;
    setBusy(target);
    setMsg("");
    try {
      const res = await save({
        data: {
          prizeId: target,
          category,
          fileName: file.name,
          contentType: file.type,
          dataBase64: await readBase64(file),
        },
      });
      if ("error" in res && res.error) setMsg(ERROR_TEXT[res.error] ?? "差し替えできませんでした");
      else {
        apply(res.overrides ?? []);
        setMsg("素材を差し替えました");
      }
    } catch {
      setMsg("差し替えできませんでした");
    }
    if (fileRef.current) fileRef.current.value = "";
    setTarget("");
    setBusy("");
  };

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">既存景品の素材を差し替える</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        いま入っている {COLL_ITEMS.filter((i) => !i.id.startsWith("cx_")).length}{" "}
        種類の景品に、画像や音の素材を割りあてられます。名前・レアリティ・ガチャの設定は変わりません。「もとにもどす」でいつでも元の見た目にもどせます。
      </p>

      <label className="text-xs">
        カテゴリ
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CollCategory)}
          className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm sm:w-64"
        >
          {COLL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {COLL_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-[11px] text-muted-foreground">
        つかえる形式：{rule.hint}／最大 {Math.round(rule.maxBytes / (1024 * 1024))}MB
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={rule.types.join(",")}
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
      />
      {msg && <p className="mt-2 text-xs font-bold text-primary">{msg}</p>}

      <ul className="mt-3 max-h-96 space-y-2 overflow-auto pr-1">
        {items.map((i) => {
          const ov = byId.get(i.id);
          return (
            <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-2">
              <span className="min-w-0 flex-1 text-sm">
                {i.name}
                <span className="ml-2 text-[11px] text-muted-foreground">
                  {i.rarity}
                  {ov ? "／素材あり" : "／内蔵の見た目"}
                </span>
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy === i.id}
                onClick={() => {
                  setTarget(i.id);
                  fileRef.current?.click();
                }}
              >
                {busy === i.id ? "登録中…" : ov ? "入れかえ" : "素材を入れる"}
              </Button>
              {ov && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={async () => {
                    const res = await clear({ data: { prizeId: i.id } });
                    if (!("error" in res)) apply(res.overrides ?? []);
                  }}
                >
                  もとにもどす
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
