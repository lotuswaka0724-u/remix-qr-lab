import type { CollPrize, CollView } from "@/lib/collection.functions";

export type GachaState = {
  phase: "idle" | "drawing" | "video" | "result" | "uncertain";
  prize: CollPrize | null;
  message: string;
  run: number;
};
type DrawReply = (CollView & { prize?: CollPrize; error?: string }) | null;
const initial: GachaState = { phase: "idle", prize: null, message: "", run: 0 };

/** Presentation state only. The existing server remains the sole draw/save authority. */
export function createGachaSession() {
  let state = initial;
  let recovering = false;
  const listeners = new Set<() => void>();
  const update = (next: GachaState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => initial,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    async draw(request: () => Promise<DrawReply>, apply: (view: CollView) => void) {
      // Synchronous lock: two calls within one React render still make one request.
      if (state.phase !== "idle") return;
      const run = state.run + 1;
      update({ phase: "drawing", prize: null, message: "", run });
      try {
        const response = await request();
        if (!response) throw new Error("No confirmed result");
        apply(response);
        if (response.error) {
          update({ phase: "idle", prize: null, run, message: response.error === "points" ? "ポイントが たりません" : response.error === "daily" ? "きょうのガチャは おしまい。また あした！" : "いまはガチャができません" });
          return;
        }
        if (!response.prize) throw new Error("Missing confirmed prize");
        update({ phase: "video", prize: response.prize, message: "", run });
      } catch {
        // A transport error can follow a partial save. Never retry the draw automatically.
        update({ phase: "uncertain", prize: null, run, message: "保存結果を確認できませんでした。もう一度ひく前に、最新のポイントとアイテムBOXを確認してください。" });
      }
    },
    finish(run: number) {
      if (state.run !== run || state.phase !== "video") return;
      update({ ...state, phase: "result" });
    },
    close() {
      if (state.phase !== "result") return;
      update({ ...state, phase: "idle", prize: null });
    },
    async recover(read: () => Promise<CollView | null>, apply: (view: CollView) => void) {
      if (state.phase !== "uncertain" || recovering) return;
      recovering = true;
      try {
        const view = await read();
        if (!view) throw new Error("Could not read saved state");
        apply(view);
        update({ ...state, phase: "idle", message: "最新のポイントと所持品を読み直しました。アイテムBOXも確認してね。", prize: null });
      } catch {
        update({ ...state, message: "最新のデータを確認できませんでした。通信を確認して、保存結果の確認をやり直してください。" });
      } finally {
        recovering = false;
      }
    },
  };
}