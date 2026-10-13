/** 先生用ログインの失敗回数制限（純粋関数。DB読み書きは gate.server.ts 側） */

export type AttemptRow = { count: number; window_start: string } | null | undefined;

export type LimitRule = { max: number; windowMs: number };

/** 同じ接続元（学校ネットワーク全体を含む）からの失敗：5回で15分待ち */
export const TEACHER_PER_SOURCE: LimitRule = { max: 5, windowMs: 15 * 60 * 1000 };
/** 接続元をかえながらの総当たり対策：全体で30回失敗すると15分待ち */
export const TEACHER_GLOBAL: LimitRule = { max: 30, windowMs: 15 * 60 * 1000 };

/** 制限中なら残り待ち時間（ミリ秒）、制限なしなら 0 */
export function lockRemainingMs(row: AttemptRow, rule: LimitRule, now: number): number {
  if (!row) return 0;
  const start = new Date(row.window_start).getTime();
  if (!Number.isFinite(start) || now - start >= rule.windowMs) return 0;
  return row.count >= rule.max ? start + rule.windowMs - now : 0;
}

/** 失敗1回を記録したあとの値 */
export function afterFailure(row: AttemptRow, rule: LimitRule, now: number) {
  const start = row ? new Date(row.window_start).getTime() : NaN;
  const fresh = !row || !Number.isFinite(start) || now - start >= rule.windowMs;
  return {
    count: fresh ? 1 : row!.count + 1,
    window_start: fresh ? new Date(now).toISOString() : row!.window_start,
  };
}
