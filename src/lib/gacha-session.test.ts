import { describe, expect, it, vi } from "vitest";
import { createGachaSession } from "./gacha-session";
import type { CollPrize, CollView } from "./collection.functions";

const prize: CollPrize = { id: "ic_cat", name: "ねこ", category: "icon", rarity: "N", description: "test", duplicate: true, dupeCount: 1 };
const view: CollView = { points: 90, cost: 10, rank: "NORMAL", gachaOn: true, totalItems: 154, coll: { owned: ["ic_cat"], dupes: { ic_cat: 1 }, equipped: { icon: "ic_cat" } }, play: { gachaLimit: 3, gachaLeft: 2, customLimit: { background: 1, icon: 1, frame: 1, sound: 1, effect: 1 }, customLeft: { background: 1, icon: 1, frame: 1, sound: 1, effect: 1 }, newIds: [], recent: [] }, stats: { completeTotal: 0, streak: 0, completeToday: false, draws: 1 } };

describe("gacha presentation safety", () => {
  it("one synchronous lock accepts only one draw, and video waits for confirmed response", async () => {
    const session = createGachaSession();
    let resolve: (value: CollView & { prize: CollPrize }) => void = () => {};
    const request = vi.fn(() => new Promise<CollView & { prize: CollPrize }>((r) => { resolve = r; }));
    const apply = vi.fn();
    const first = session.draw(request, apply);
    await session.draw(request, apply);
    expect(request).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().phase).toBe("drawing");
    expect(apply).not.toHaveBeenCalled();
    resolve({ ...view, prize });
    await first;
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({ points: 90, prize }));
    expect(session.getSnapshot()).toMatchObject({ phase: "video", prize });
  });
  it("ended/error/skip events reveal exactly the confirmed prize without another draw", async () => {
    const session = createGachaSession();
    const request = vi.fn(async () => ({ ...view, prize }));
    await session.draw(request, () => {});
    const run = session.getSnapshot().run;
    session.finish(run); session.finish(run); session.finish(run - 1);
    expect(session.getSnapshot()).toMatchObject({ phase: "result", prize });
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("return to gacha makes no draw; only a fresh click starts the next one", async () => {
    const session = createGachaSession();
    const request = vi.fn(async () => ({ ...view, prize }));
    await session.draw(request, () => {});
    session.finish(1); session.close();
    expect(request).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().phase).toBe("idle");
    await session.draw(request, () => {});
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("save/transport failure blocks redraw until saved data can be read, never invents a prize", async () => {
    const session = createGachaSession();
    const request = vi.fn(async () => { throw new Error("save failed"); });
    await session.draw(request, () => {});
    await session.draw(request, () => {});
    expect(request).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot()).toMatchObject({ phase: "uncertain", prize: null });
    await session.recover(async () => { throw new Error("offline"); }, () => {});
    expect(session.getSnapshot().phase).toBe("uncertain");
    const apply = vi.fn();
    await session.recover(async () => view, apply);
    expect(apply).toHaveBeenCalledWith(view);
    expect(session.getSnapshot()).toMatchObject({ phase: "idle", prize: null });
  });
  it("not enough points or daily limit does not enter video or retry", async () => {
    for (const error of ["points", "daily"]) {
      const session = createGachaSession();
      const request = vi.fn(async () => ({ ...view, error }));
      await session.draw(request, () => {});
      expect(session.getSnapshot()).toMatchObject({ phase: "idle", prize: null });
      expect(request).toHaveBeenCalledTimes(1);
    }
  });
  it("screen subscribers may leave and rejoin without losing in-flight or confirmed results", async () => {
    const session = createGachaSession();
    const unsubscribe = session.subscribe(() => {});
    unsubscribe();
    await session.draw(async () => ({ ...view, prize }), () => {});
    const listener = vi.fn();
    session.subscribe(listener);
    expect(session.getSnapshot().prize?.id).toBe("ic_cat");
    session.finish(1);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(session.getSnapshot().phase).toBe("result");
  });
});