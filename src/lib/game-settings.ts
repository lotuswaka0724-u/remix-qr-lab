/** 先生が変えられるゲーム要素の設定（既存のポイント計算には影響しない） */
export type GameSettings = {
  /** ガチャを使えるようにするか */
  gachaOn: boolean;
  /** ガチャ1回に必要なポイント */
  itemGachaCost: number;
  /** 1日にカスタマイズできる回数 */
  dailyCustomizeLimit: number;
  /** 公開する季節アイテム */
  seasons: string[];
  /** 公開するイベントアイテム */
  events: string[];
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gachaOn: true,
  itemGachaCost: 5,
  dailyCustomizeLimit: 20,
  seasons: ["spring", "summer", "autumn", "winter"],
  events: [],
};

export const SEASON_LABEL: Record<string, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

export const EVENT_LABEL: Record<string, string> = {
  halloween: "ハロウィン",
  christmas: "クリスマス",
  newyear: "お正月",
  setsubun: "節分",
  tanabata: "七夕",
};
