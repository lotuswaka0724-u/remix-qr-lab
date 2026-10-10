import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GACHA_MEDIA, getGachaAudio, stopGachaAudio } from "@/lib/gacha-media";

export default function GachaFilm({ run, active, onDone }: { run: number; active: boolean; onDone: (run: number) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const finished = useRef(false);
  const soundStarted = useRef(false);
  const [failed, setFailed] = useState(false);
  const [silent, setSilent] = useState(false);
  const done = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    video.current?.pause();
    stopGachaAudio();
    onDone(run);
  }, [onDone, run]);

  useEffect(() => {
    if (!active) { done(); return; }
    const element = video.current;
    if (!element) return;
    let disposed = false;
    void element.play().catch(() => { if (!disposed) setFailed(true); });
    // Bounded recovery for a stalled load/playback, not a second draw or playback attempt.
    const timeout = window.setTimeout(() => { if (!finished.current) setFailed(true); }, 16_000);
    const hidden = () => { if (document.hidden) done(); };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", hidden);
      element.pause();
      stopGachaAudio();
    };
  }, [active, done]);

  const playSound = () => {
    if (soundStarted.current || finished.current || silent) return;
    soundStarted.current = true;
    const track = getGachaAudio();
    if (!track) { setSilent(true); return; }
    track.currentTime = video.current?.currentTime ?? 0;
    void track.play().catch(() => setSilent(true));
  };
  const fail = () => {
    if (finished.current) return;
    video.current?.pause();
    stopGachaAudio();
    setFailed(true);
  };

  return (
    <div className="gacha-film" role="dialog" aria-modal="true" aria-label="ガチャ演出">
      <div className="gacha-film-top"><span>REMIX QR LAB</span><span>COLLECTION / {String(run).padStart(2, "0")}</span></div>
      {failed ? (
        <div className="gacha-film-fallback">
          <img src={GACHA_MEDIA.poster} alt="クリスタルのガチャ装置" />
          <div className="gacha-fallback-light" aria-hidden />
          <p>アイテムが確定しました</p>
          <p className="text-sm text-muted-foreground">動画を再生できませんでした</p>
          <Button onClick={done}>獲得アイテムを見る <ArrowRight /></Button>
        </div>
      ) : (
        <video ref={video} src={GACHA_MEDIA.video} poster={GACHA_MEDIA.poster} muted playsInline preload="auto" onEnded={done} onError={fail} onPlaying={playSound} onWaiting={() => getGachaAudio()?.pause()} onTimeUpdate={() => {
          const track = getGachaAudio();
          const element = video.current;
          if (!track || !element || silent || !soundStarted.current || finished.current || element.paused) return;
          if (Math.abs(track.currentTime - element.currentTime) > 0.4) track.currentTime = element.currentTime;
          if (track.paused && !track.ended) void track.play().catch(() => setSilent(true));
        }} />
      )}
      <div className="gacha-film-bottom">
        <Button variant="ghost" size="icon" aria-label={silent ? "効果音はオフ" : "効果音をオフにする"} disabled={silent} onClick={() => { stopGachaAudio(); setSilent(true); }} title={silent ? "効果音はオフ" : "効果音をオフにする"}>{silent ? <VolumeX /> : <Volume2 />}</Button>
        <Button variant="ghost" onClick={done}>獲得アイテムを見る <ArrowRight /></Button>
      </div>
    </div>
  );
}