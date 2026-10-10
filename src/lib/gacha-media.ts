import video from "@/assets/gacha/cinematic.mp4.asset.json";
import poster from "@/assets/gacha/console.jpg.asset.json";
import score from "@/assets/gacha/score.mp3.asset.json";

/** All replaceable gacha media references live here. No draw logic belongs here. */
export const GACHA_MEDIA = { video: video.url, poster: poster.url, score: score.url };

// Dedicated media element; never stop or modify the shared QR/equipment audio context.
let soundtrack: HTMLAudioElement | null = null;
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
  void track.play().then(() => {
    track.pause();
    track.currentTime = 0;
    track.muted = false;
  }).catch(() => { track.muted = false; });
}
export function getGachaAudio() { return soundtrack; }
export function stopGachaAudio() {
  if (!soundtrack) return;
  soundtrack.pause();
  soundtrack.currentTime = 0;
}