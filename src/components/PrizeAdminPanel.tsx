import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  COLL_CATEGORIES,
  COLL_CATEGORY_LABEL,
  registerCustomItems,
  type CollCategory,
  type CollRarity,
} from "@/lib/collection-catalog";
import {
  addCustomPrize,
  listCustomPrizes,
  PRIZE_FILE_RULES,
  removeCustomPrize,
  updateCustomPrize,
  type CustomPrize,
} from "@/lib/prizes.functions";

/** 先生が選ぶレアリティ（中の値は既存データと同じ N / R / SR / SSR / GOLD / BLACK） */
const RARITY_CHOICES: { value: CollRarity; label: string }[] = [
  { value: "N", label: "NORMAL" },
  { value: "R", label: "RARE" },
  { value: "SR", label: "SR" },
  { value: "SSR", label: "SSR" },
  { value: "GOLD", label: "GOLD（とくべつ）" },
  { value: "BLACK", label: "BLACK（さいこう）" },
];

const ERROR_TEXT: Record<string, string> = {
  auth: "先生モードでログインしてください",
  category: "カテゴリをえらんでください",
  name: "景品名を入力してください",
  filetype: "このカテゴリで使えないファイル形式です",
  broken: "ファイルを読み取れませんでした",
  toobig: "ファイルが大きすぎます",
  upload: "ファイルの保存に失敗しました",
  save: "景品の登録に失敗しました",
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

export default function PrizeAdminPanel() {
  const list = useServerFn(listCustomPrizes);
  const add = useServerFn(addCustomPrize);
  const update = useServerFn(updateCustomPrize);
  const remove = useServerFn(removeCustomPrize);

  const [prizes, setPrizes] = useState<CustomPrize[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CollCategory>("icon");
  const [rarity, setRarity] = useState<CollRarity>("N");
  const [description, setDescription] = useState("");
  const [obtainable, setObtainable] = useState(true);
  const [sort, setSort] = useState(100);
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const apply = (rows: CustomPrize[]) => {
    registerCustomItems(rows);
    setPrizes(rows);
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

  const rule = PRIZE_FILE_RULES[category];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMsg("");
    if (!name.trim()) return setMsg("景品名を入力してください");
    if (!file) return setMsg("素材ファイルをえらんでください");
    if (file.size > rule.maxBytes) return setMsg("ファイルが大きすぎます");
    setBusy(true);
    try {
      const dataBase64 = await readBase64(file);
      // サムネイルは任意。読めなかったときは本体だけで登録する。
      let thumbFields = {};
      if (thumb) {
        try {
          thumbFields = {
            thumbFileName: thumb.name,
            thumbContentType: thumb.type,
            thumbBase64: await readBase64(thumb),
          };
        } catch {
          thumbFields = {};
        }
      }
      const res = await add({
        data: {
          name: name.trim(),
          category,
          rarity,
          description: description.trim(),
          obtainable,
          sort,
          fileName: file.name,
          contentType: file.type,
          dataBase64,
          ...thumbFields,
        },
      });
      if ("error" in res && res.error) setMsg(ERROR_TEXT[res.error] ?? "登録できませんでした");
      else {
        apply(res.prizes ?? []);
        setMsg("登録しました");
        setName("");
        setDescription("");
        setFile(null);
        setThumb(null);
        if (fileRef.current) fileRef.current.value = "";
        if (thumbRef.current) thumbRef.current.value = "";
      }
    } catch {
      setMsg("登録できませんでした");
    }
    setBusy(false);
  };

  const preview = (url: string) => {
    audioRef.current?.pause();
    const a = new Audio(url);
    audioRef.current = a;
    void a.play().catch(() => setMsg("この音声は再生できませんでした"));
  };

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">ガチャ景品を追加</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        作った素材をアップロードすると、アイテムBOXにならび、「ガチャに出す」をONにしたものだけガチャから出ます。
      </p>

      <form className="grid gap-2 sm:grid-cols-2" onSubmit={onSubmit}>
        <label className="text-xs">
          景品名
          <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
        </label>
        <label className="text-xs">
          カテゴリ
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CollCategory)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            {COLL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {COLL_CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          レアリティ
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as CollRarity)}
            className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            {RARITY_CHOICES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          表示順（小さいほど前）
          <Input
            type="number"
            value={sort}
            onChange={(e) => setSort(Number(e.target.value))}
            className="mt-1"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          説明（任意）
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          素材ファイル（{rule.hint} ／ 最大 {Math.round(rule.maxBytes / (1024 * 1024))}MB）
          <Input
            ref={fileRef}
            type="file"
            accept={rule.types.join(",")}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1"
          />
        </label>
        <label className="text-xs sm:col-span-2">
          一覧用サムネイル（任意・PNG/JPG・最大1MB／入れないときは素材をそのまま表示）
          <Input
            ref={thumbRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
            className="mt-1"
          />
        </label>
        <div className="flex items-center gap-2 text-xs sm:col-span-2">
          <Switch checked={obtainable} onCheckedChange={setObtainable} aria-label="ガチャに出す" />
          <span>ガチャに出す</span>
          <Button type="submit" disabled={busy} className="ml-auto">
            {busy ? "登録中…" : "景品を追加"}
          </Button>
        </div>
      </form>
      {msg && <p className="mt-2 text-xs font-bold text-primary">{msg}</p>}

      <h3 className="mb-2 mt-4 font-display text-sm font-bold">登録した景品（{prizes.length}）</h3>
      <ul className="space-y-2">
        {prizes.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-2">
            {p.category === "sound" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => preview(p.assetUrl)}
              >
                ▶ 試聴
              </Button>
            ) : (
              <img
                src={p.thumbUrl ?? p.assetUrl}
                alt=""
                className="h-10 w-10 rounded-md bg-card object-contain"
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
              />
            )}
            <span className="min-w-0 flex-1 text-sm">
              {p.name}
              <span className="ml-2 text-[11px] text-muted-foreground">
                {COLL_CATEGORY_LABEL[p.category]}／{p.rarity}
              </span>
            </span>
            <Switch
              checked={p.obtainable}
              aria-label="ガチャに出す"
              onCheckedChange={async (v) => {
                const res = await update({ data: { id: p.id, obtainable: v } });
                if (!("error" in res)) apply(res.prizes ?? []);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={async () => {
                const res = await remove({ data: { id: p.id } });
                if (!("error" in res)) apply(res.prizes ?? []);
              }}
            >
              削除
            </Button>
          </li>
        ))}
        {!prizes.length && (
          <li className="text-xs text-muted-foreground">まだ景品を登録していません。</li>
        )}
      </ul>
    </section>
  );
}
