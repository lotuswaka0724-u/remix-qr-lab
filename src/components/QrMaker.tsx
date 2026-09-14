import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  earnedPoints,
  loginNumber,
  rankOfPoints,
  updateStudent,
  useAppState,
  type Rank,
  type Student,
} from "@/lib/homework-store";
import { RANK_STYLE } from "@/lib/rank-style";

type CardData = {
  key: string;
  studentId: string;
  name: string;
  romaji: string;
  className: string;
  gradeClass: string;
  number: number;
  password: string;
  points: number;
  rank: Rank;
  url: string;
};

/* かなだけの名前はローマ字に直して表示する（登録済みのローマ字があればそちらを優先） */
const KANA: [RegExp, string][] = [
  [/きゃ/g, "kya"], [/きゅ/g, "kyu"], [/きょ/g, "kyo"],
  [/しゃ/g, "sha"], [/しゅ/g, "shu"], [/しょ/g, "sho"],
  [/ちゃ/g, "cha"], [/ちゅ/g, "chu"], [/ちょ/g, "cho"],
  [/にゃ/g, "nya"], [/にゅ/g, "nyu"], [/にょ/g, "nyo"],
  [/ひゃ/g, "hya"], [/ひゅ/g, "hyu"], [/ひょ/g, "hyo"],
  [/みゃ/g, "mya"], [/みゅ/g, "myu"], [/みょ/g, "myo"],
  [/りゃ/g, "rya"], [/りゅ/g, "ryu"], [/りょ/g, "ryo"],
  [/ぎゃ/g, "gya"], [/ぎゅ/g, "gyu"], [/ぎょ/g, "gyo"],
  [/じゃ/g, "ja"], [/じゅ/g, "ju"], [/じょ/g, "jo"],
  [/びゃ/g, "bya"], [/びゅ/g, "byu"], [/びょ/g, "byo"],
  [/ぴゃ/g, "pya"], [/ぴゅ/g, "pyu"], [/ぴょ/g, "pyo"],
];
const KANA_MAP: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ー: "", "　": " ", " ": " ",
};

function kanaToRomaji(input: string): string {
  const hira = input.replace(/[\u30a1-\u30f6]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );
  let s = hira;
  for (const [re, r] of KANA) s = s.replace(re, r);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "っ") {
      const next = s[i + 1];
      const r = next ? (KANA_MAP[next] ?? "") : "";
      out += r.charAt(0);
      continue;
    }
    const m = KANA_MAP[c];
    if (m === undefined) return "";
    out += m;
  }
  return out.trim();
}

/** カードに出すローマ字（姓→名）。登録済みがあれば必ずそれを使う */
export function romajiOf(s: Student): string {
  if (s.romaji && s.romaji.trim()) return s.romaji.trim().toUpperCase();
  const parts = s.name.split(/[\s　]+/).filter(Boolean);
  const conv = parts.map(kanaToRomaji);
  if (conv.every((c) => c)) return conv.join(" ").toUpperCase();
  return s.name;
}

export default function QrMaker() {
  const state = useAppState();
  const classes = useMemo(
    () => Array.from(new Set(state.students.map((s) => s.className))),
    [state.students],
  );
  const [cls, setCls] = useState<string>("all");
  const [keyword, setKeyword] = useState("");
  const [cards, setCards] = useState<CardData[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState(false);

  const students = useMemo(
    () =>
      state.students
        .filter((s) => cls === "all" || s.className === cls)
        .sort((a, b) => a.className.localeCompare(b.className) || a.number - b.number),
    [state.students, cls],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const QR = await import("qrcode");
      const list: CardData[] = [];
      for (const s of students) {
        const points = earnedPoints(state, s.id);
        // 既存のQR形式（児童名）をそのまま使う
        const url = await QR.toDataURL(s.name, { margin: 2, width: 320 });
        list.push({
          key: s.id,
          studentId: s.id,
          name: s.name,
          romaji: romajiOf(s),
          className: s.className,
          gradeClass:
            s.grade && s.classNumber ? `${s.grade}年 ${s.classNumber}組` : s.className,
          number: s.number,
          password: loginNumber(s),
          points,
          rank: rankOfPoints(state.rankRules, points),
          url,
        });
      }
      if (!cancelled) setCards(list);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, state.records, state.rankRules, state.pointRules, state.hwEvents, state.hwPointRules]);

  const visible = cards.filter((c) => {
    const q = keyword.trim();
    if (!q) return true;
    return `${c.name} ${c.romaji} ${c.className}`.toLowerCase().includes(q.toLowerCase());
  });
  // 印刷対象は「いま表示されている児童のうち、チェックが入っている児童」だけにする
  // （クラス切り替えや名前でさがすで画面から消えた児童は印刷対象に残さない）
  const chosen = visible.filter((c) => selected[c.key]);

  const print = () => {
    document.body.classList.add("printing-cards");
    const done = () => {
      document.body.classList.remove("printing-cards");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  if (preview) {
    return (
      <section className="paper-card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
          <h2 className="mr-auto font-display text-base font-bold">
            QRカード 印刷プレビュー（A4・{chosen.length}枚）
          </h2>
          <Button type="button" variant="ghost" onClick={() => setPreview(false)}>
            もどる
          </Button>
          <Button type="button" onClick={print}>
            印刷する
          </Button>
        </div>
        <p className="mb-2 text-xs text-muted-foreground print:hidden">
          カードは名刺サイズ（85.6×54mm）で印刷されます。線に沿って切り取ってください。
        </p>
        <div className="overflow-auto print:overflow-visible">
          <div id="qr-card-sheet" className="card-sheet">
            <div className="card-grid">
              {chosen.map((c) => (
                <PrintCard key={c.key} c={c} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="paper-card p-4">
      <h2 className="mb-1 font-display text-base font-bold">QRカード印刷</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        児童ひとりに1枚ずつわたす、メンバーズカード風のQRカードです。通算ポイントでランク（NORMAL／GOLD／BLACK）が自動で変わります。
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={cls}
          onChange={(e) => setCls(e.target.value)}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="クラスでしぼりこむ"
        >
          <option value="all">すべてのクラス</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="名前でさがす"
          className="h-10 min-w-[10rem] flex-1 rounded-xl border border-border bg-card px-3 text-sm"
          aria-label="キーワードでさがす"
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setSelected((prev) => {
              const next = { ...prev };
              visible.forEach((c) => (next[c.key] = true));
              return next;
            })
          }
        >
          表示中をすべて選ぶ
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setSelected({})}>
          選択をすべて解除
        </Button>
        <span className="text-xs text-muted-foreground">{chosen.length}人選択中</span>
        <Button type="button" disabled={chosen.length === 0} onClick={() => setPreview(true)}>
          QRカード印刷
        </Button>
      </div>

      <div className="max-h-80 overflow-auto rounded-xl border border-border p-2">
        {visible.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">児童がいません。</p>
        ) : (
          <ul className="grid gap-1">
            {visible.map((c) => (
              <li key={c.key} className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/60">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected[c.key]}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-bold">{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.gradeClass} {c.number}番／{c.romaji}／{c.rank}
                    </span>
                  </span>
                </label>
                <Input
                  value={state.students.find((s) => s.id === c.studentId)?.romaji ?? ""}
                  onChange={(e) => updateStudent(c.studentId, { romaji: e.target.value })}
                  placeholder="ローマ字（姓 名）"
                  className="h-8 w-44 bg-card text-xs"
                  aria-label={`${c.name} のローマ字`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      {!chosen.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          チェックを入れてから「QRカード印刷」を押すと、印刷プレビューが開きます。
        </p>
      )}
    </section>
  );
}

function PrintCard({ c }: { c: CardData }) {
  const style = RANK_STYLE[c.rank];
  return (
    <div className={`id-card ${style.card}`}>
      <div className="id-card-body">
        <div className="id-card-info">
          <p className="id-card-school">HOMEWORK MEMBERS CARD</p>
          <p className="id-card-name">{c.romaji}</p>
          <p className="id-card-jp">{c.name}</p>
          <p className="id-card-class">
            {c.gradeClass}　{c.number}番
          </p>
          <p className="id-card-pass">PASSWORD : {c.password || "-----"}</p>
          <div className="id-card-foot">
            <span className={`id-card-badge ${style.badge}`}>{style.label}</span>
          </div>
        </div>
        <div className="id-card-qr">
          <img src={c.url} alt={`${c.name} のQRコード`} />
        </div>
      </div>
    </div>
  );
}
