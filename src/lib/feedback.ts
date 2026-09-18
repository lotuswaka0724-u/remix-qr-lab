let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 画面タップのタイミングで音を使えるようにしておく（ブラウザの自動再生制限対策） */
export function primeAudio() {
  audio();
}

/** 今なっている音（試聴のとき、前の音を止めるために持っておく） */
const live = new Set<OscillatorNode>();

/** なっている音をすべて止める（試聴で音がかさならないようにする） */
export function stopAllSounds() {
  for (const osc of live) {
    try {
      osc.stop();
    } catch {
      /* すでに止まっている */
    }
  }
  live.clear();
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.12,
  slideTo?: number,
) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.02);
  live.add(osc);
  osc.onended = () => live.delete(osc);
}

export const SOUND_PRESETS = [
  "0: なし",
  "1: ピッ（標準）",
  "2: ピポ（2音）",
  "3: ポーン（チャイム）",
  "4: パパン（連続）",
  "5: キラッ（高音）",
  "6: コイン（ゲーム風）",
  "7: ピロリ（トリル）",
  "8: ぽこっ（泡）",
  "9: シャラーン（魔法）",
];

export function playSuccess(preset: number) {
  switch (preset) {
    case 1:
      tone(1046, 0, 0.12);
      break;
    case 2:
      tone(880, 0, 0.1);
      tone(1318, 0.1, 0.14);
      break;
    case 3:
      tone(784, 0, 0.5, "triangle", 0.1);
      tone(1174, 0.05, 0.5, "sine", 0.06);
      break;
    case 4:
      [0, 0.09, 0.18].forEach((t) => tone(660, t, 0.07, "square", 0.07));
      break;
    case 5:
      tone(1568, 0, 0.08);
      tone(2093, 0.07, 0.16);
      break;
    case 6:
      tone(988, 0, 0.07, "square", 0.08);
      tone(1319, 0.07, 0.2, "square", 0.08);
      break;
    case 7:
      [0, 0.06, 0.12, 0.18].forEach((t, i) => tone(1046 + i * 130, t, 0.06, "triangle", 0.08));
      break;
    case 8:
      tone(420, 0, 0.14, "sine", 0.14);
      tone(900, 0.05, 0.1, "sine", 0.05);
      break;
    case 9:
      [0, 0.05, 0.1, 0.15, 0.2].forEach((t, i) => tone(1200 + i * 220, t, 0.25, "sine", 0.05));
      break;
    default:
      break;
  }
}

export function playError() {
  tone(220, 0, 0.18, "sawtooth", 0.08);
  tone(160, 0.16, 0.24, "sawtooth", 0.08);
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  u.rate = 1.15;
  window.speechSynthesis.speak(u);
}

/* ---------- ランク別の演出音 ---------- */

type RankKey = "NORMAL" | "GOLD" | "BLACK";

/** 読み取り成功音。ランクが上がるほど豪華になる */
export function playRankSuccess(rank: RankKey, preset: number) {
  playSuccess(preset);
  if (rank === "GOLD") {
    [0, 0.08, 0.16].forEach((t, i) => tone(1046 + i * 262, 0.12 + t, 0.18, "triangle", 0.09));
  }
  if (rank === "BLACK") {
    [0, 0.07, 0.14, 0.21, 0.28].forEach((t, i) =>
      tone(784 + i * 261, 0.1 + t, 0.26, "triangle", 0.1),
    );
    tone(196, 0.1, 0.6, "sine", 0.09);
    tone(2093, 0.42, 0.5, "sine", 0.06);
  }
}

/** ランクアップしたときのファンファーレ */
export function playRankUp(rank: RankKey) {
  const base = rank === "BLACK" ? 523 : 440;
  [0, 0.12, 0.24].forEach((t, i) => tone(base * (1 + i * 0.25), t, 0.22, "triangle", 0.12));
  tone(base * 2, 0.36, 0.8, "sine", 0.1);
  if (rank === "BLACK") {
    tone(base * 3, 0.5, 0.7, "sine", 0.07);
    tone(base / 2, 0.36, 0.9, "sine", 0.08);
  }
}

/* ---------- コレクションの読み取り効果音（ガチャで手に入る音） ---------- */

/**
 * アイテムの音を鳴らす。
 * ・音ごとに はっきり ちがう鳴り方にしてある
 * ・ランクが GOLD / BLACK のときは、うしろに豪華な音をかさねる
 * 将来、音声ファイル（mp3など）に差しかえるときは、この関数の中だけを変えればよい。
 * アイテムの `asset` に音声ファイルのパスが入っていれば、それを優先して鳴らす。
 */
export function playCollectionSound(
  tune: string | null | undefined,
  rank: RankKey = "NORMAL",
  asset?: string | null,
) {
  if (asset) {
    try {
      const el = new Audio(asset);
      el.volume = 0.8;
      void el.play();
      return;
    } catch {
      /* 再生できなければ内蔵の音にもどる */
    }
  }
  switch (tune) {
    case "pico":
      // みじかい電子音ひとつ
      tone(1400, 0, 0.07, "square", 0.1);
      break;
    case "pon":
      // ひくい やわらかい ポン
      tone(300, 0, 0.22, "sine", 0.18, 180);
      break;
    case "kira":
      // 上へすべる たかい音
      tone(1200, 0, 0.28, "sine", 0.1, 3000);
      break;
    case "chime":
      // 鐘のような ながい ひびき
      tone(659, 0, 0.9, "triangle", 0.12);
      tone(988, 0.02, 0.9, "sine", 0.07);
      tone(1318, 0.04, 0.7, "sine", 0.04);
      break;
    case "coin":
      // ゲームのコイン（2音のスタッカート）
      tone(988, 0, 0.06, "square", 0.12);
      tone(1568, 0.06, 0.26, "square", 0.12);
      break;
    case "sparkle":
      // こまかい粒が上へ
      [0, 0.04, 0.08, 0.12, 0.16, 0.2, 0.24].forEach((t, i) =>
        tone(1400 + i * 260, t, 0.18, "sine", 0.06),
      );
      break;
    case "levelup":
      // 階段のように のぼる
      [0, 0.07, 0.14, 0.21, 0.3].forEach((t, i) =>
        tone(523 * Math.pow(2, i / 4), t, 0.2, "square", 0.08),
      );
      break;
    case "fanfare":
      // 和音のファンファーレ
      [0, 0.12, 0.24].forEach((t, i) => tone(523 * (1 + i * 0.25), t, 0.24, "triangle", 0.13));
      [523, 659, 784].forEach((f) => tone(f, 0.38, 0.8, "triangle", 0.08));
      break;
    case "gold":
      // 低音＋のぼる和音＋きらめき
      tone(220, 0, 1.0, "sine", 0.1);
      [0, 0.1, 0.2, 0.3].forEach((t, i) => tone(659 + i * 165, t, 0.3, "triangle", 0.13));
      [0, 0.06, 0.12].forEach((t, i) => tone(1760 + i * 220, 0.45 + t, 0.35, "sine", 0.07));
      break;
    case "black":
      // いちばん豪華：うなり＋和音の連なり＋ながい残響
      tone(110, 0, 1.3, "sawtooth", 0.07);
      [0, 0.07, 0.14, 0.21, 0.28, 0.35, 0.42].forEach((t, i) =>
        tone(392 * Math.pow(2, i / 6), t, 0.34, "triangle", 0.12),
      );
      [1046, 1568, 2093].forEach((f, i) => tone(f, 0.6 + i * 0.05, 0.9, "sine", 0.06));
      break;
    default:
      tone(1046, 0, 0.12);
      break;
  }
  if (rank === "GOLD")
    [0, 0.09].forEach((t, i) => tone(1318 + i * 262, 0.3 + t, 0.2, "sine", 0.06));
  if (rank === "BLACK") {
    [0, 0.08, 0.16].forEach((t, i) => tone(784 + i * 262, 0.32 + t, 0.26, "triangle", 0.07));
    tone(164, 0.3, 0.8, "sine", 0.07);
  }
}

/**
 * アイテムBOXでの「試聴」。
 * 前になっている音を止めてから鳴らすので、音がかさならない。
 * ポイントも装備も変えない（音を鳴らすだけ）。
 */
export function previewCollectionSound(
  tune: string | null | undefined,
  rank: RankKey = "NORMAL",
  asset?: string | null,
) {
  stopAllSounds();
  playCollectionSound(tune, rank, asset);
}

/* ---------- ガチャ演出の音（Web Audio でその場でつくる） ---------- */

/** ボタンを押した音 */
export function playGachaPress() {
  tone(520, 0, 0.08, "square", 0.09, 880);
  tone(1040, 0.06, 0.1, "sine", 0.05);
}

/** 抽選中（装置がまわっている間）のカラカラ音。durMs のあいだ鳴らす */
export function playGachaSpin(durMs = 1200) {
  const steps = Math.max(4, Math.round(durMs / 110));
  for (let i = 0; i < steps; i++) {
    const t = (i * durMs) / steps / 1000;
    // だんだん速く・高くして、盛り上がりを出す
    tone(300 + i * 26, t, 0.05, "triangle", 0.05 + i * 0.004);
  }
}

/** カプセルが出てくる音 */
export function playGachaEject() {
  tone(180, 0, 0.16, "sine", 0.12, 90);
  tone(620, 0.12, 0.1, "triangle", 0.07);
}

/** カプセルがひらく音 */
export function playGachaOpen() {
  tone(900, 0, 0.09, "square", 0.08, 1500);
  [0, 0.05, 0.1].forEach((t, i) => tone(1400 + i * 300, 0.08 + t, 0.14, "sine", 0.06));
}
