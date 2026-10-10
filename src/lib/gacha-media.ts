import video from "@/assets/gacha/cinematic.mp4.asset.json";
import poster from "@/assets/gacha/console.jpg.asset.json";
import score from "@/assets/gacha/score.mp3.asset.json";

/** All replaceable gacha media references live here. No draw logic belongs here. */
export const GACHA_MEDIA = { video: video.url, poster: poster.url, score: score.url };

// Dedicated media element; never stop or modify the shared QR/equipment audio context.
let soundtrack: HTMLAudioElement | null = null;
let preparing: Promise<void> | null = null;
let generation = 0;
export function prepareGachaAudio() {
  if (typeof window === "undefined") return;
  if (!soundtrack) {
    soundtrack = new Audio(GACHA_MEDIA.score);
    soundtrack.preload = "auto";
    soundtrack.volume = 0.65;
  }
  const track = soundtrack;
  // Unlock only this media element on the draw gesture, without an audible preview.
  track.muted = true;
  preparing = track.play().then(() => {
    track.pause();
    track.currentTime = 0;
    track.muted = false;
  }).catch(() => { track.muted = false; });
}
export async function startGachaAudio(time: number) {
  const current = generation;
  await preparing;
  const track = soundtrack;
  if (!track || current !== generation) return false;
  track.currentTime = time;
  try { await track.play(); return true; } catch { return false; }
}
export function getGachaAudio() { return soundtrack; }
export function stopGachaAudio() {
  generation += 1;
  if (!soundtrack) return;
  soundtrack.pause();
  soundtrack.currentTime = 0;
}