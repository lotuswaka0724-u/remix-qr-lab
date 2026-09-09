let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  const c = audio();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.02);
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
