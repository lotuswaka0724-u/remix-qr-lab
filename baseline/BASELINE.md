# リデザイン開始前の基準状態（REMIX QR LAB）

リデザイン後に「何も壊れていないか」を比べるための記録です。**アプリのコードからは読み込まれず、動作には影響しません。**

| 項目 | 値 |
|---|---|
| 基準コミット | `e7cf734eec5a084bcdff326c88ba91b9d00fb254`（main、2026-09-29 03:52 UTC「ガチャ演出を追加した」） |
| 記録日 | 2026-09-29 |
| 構成 | TanStack Start + TanStack Router（Vite）、React 19、Tailwind v4、Supabase（service role、サーバー側のみ） |
| 景品数 | **154件**（`src/lib/collection-catalog.ts` の `COLL_ITEMS`） |

## ファイル

| ファイル | 内容 |
|---|---|
| `baseline/BASELINE.md` | この文書（ルート・ポイント・QR・ガチャ・権限・アセットの記録） |
| `baseline/snapshot.json` | 機械で比べるためのデータ（全154景品、レアリティ設定、ランク別の確率、ルート、アセットと SHA-256、保護対象ファイルの SHA-256） |
| `baseline/prizes.md` | 154景品を人が読める表にしたもの |
| `baseline/snapshot.ts` / `asset-stub.ts` | スナップショットの作成・比較スクリプト |

### 比べ方

```bash
bun --preload ./baseline/asset-stub.ts ./baseline/snapshot.ts check
```

- 景品IDの増減、name・category・rarity・weight・必要ランク・初期所持・obtainable・ガチャ対象かどうかの変化、確率の変化、アセットやルートの消失があると **失敗**します。
- 保護対象ファイル（ポイント・QR・ガチャ・認証まわり）が1文字でも変わると **注意** を表示します。
- `write` を付けると基準を作り直します。**リデザイン中は使わないでください**（基準が上書きされます）。

---

## 1. 景品（154件）

- 景品IDの一覧の SHA-256：`69978439e587498a202a5ea4c6a41a74d2f777fd4b057015b3827206ad54e91d`
- 景品データ全体の SHA-256：`bf81fd2de9d90585281c49f1a9e1a1e36cd75f90aac6331b5fc8ccddbff678e8`

| カテゴリ | ID の頭 | 件数 |
|---|---|---|
| background（マイページ背景） | `bg_` | 37 |
| icon（アイコン） | `ic_` | 60 |
| frame（アイコンフレーム） | `fr_` | 36 |
| sound（読み取り効果音） | `sd_` | 10 |
| effect（読み取りエフェクト） | `ef_` | 11 |
| **合計** | | **154** |

| レアリティ | 件数 | 重み（1件あたり） | 出るのに必要なランク |
|---|---|---|---|
| N | 56（うち初期所持5） | 55 | NORMAL |
| R | 50 | 27 | NORMAL |
| SR | 30 | 13 | NORMAL |
| SSR | 6 | 6 | NORMAL |
| GOLD | 6 | 4 | GOLD 以上 |
| BLACK | 6 | 1 | BLACK のみ |

- 初期所持（ガチャでは出ない）：`bg_simple`・`ic_cat`・`fr_simple`・`sd_pico`・`ef_spark`
- `obtainable` は省略できる項目で、**組み込みの154件ではどれも未設定**です。そのため初期所持以外の149件がすべてガチャ対象です。
- 画像などの素材がある景品（`REAL_ASSET_IDS`）：89件
- 各景品の詳細は `baseline/prizes.md` を見てください。

### ランク別の実際の確率

重みは **景品1件ごと** にかかるので、実際の確率はレアリティごとの件数で決まります。前回の監査で示した「N 約52%…」は、レアリティの重みだけを比べた値だったため誤りでした。下の表が正しい値です。

| レアリティ | NORMAL（137件） | GOLD（143件） | BLACK（149件） |
|---|---|---|---|
| N | 61.23% | 60.91% | 60.83% |
| R | 29.47% | 29.32% | 29.28% |
| SR | 8.51% | 8.47% | 8.46% |
| SSR | 0.79% | 0.78% | 0.78% |
| GOLD | — | 0.52% | 0.52% |
| BLACK | — | — | 0.13% |

先生が追加した景品（`custom_prizes` → `registerCustomItems`）と素材の差し替え（`prize_asset_overrides` → `applyAssetOverrides`）は Supabase にあるので、この表には入っていません。**どちらも既存のIDは変えません。**

## 2. ルート

| ファイル | URL | 対象 | 保護 |
|---|---|---|---|
| `src/routes/__root.tsx` | （全体） | — | 先生用の画面を `TeacherGate` で囲む。`/me` はヘッダーなし |
| `src/routes/index.tsx` | `/` | 先生 | スキャン画面（カメラ／手入力、今日の状況、ランキング） |
| `src/routes/board.tsx` | `/board` | 先生 | 未提出ボード |
| `src/routes/history.tsx` | `/history` | 先生 | 履歴 |
| `src/routes/points.tsx` | `/points` | 先生 | ポイント・ランキング・手動付与 |
| `src/routes/manage.tsx` | `/manage` | 先生 | 宿題・名簿・点数・ランク・ガチャ設定、景品管理、CSV、QR印刷 |
| `src/routes/me.tsx` | `/me` | 児童 | ホーム／宿題／ポイント／ガチャ／アイテムBOX |
| `src/routes/api/public/prize-asset.$file.tsx` | `/api/public/prize-asset/$file` | 公開 | 非公開バケット `prize-assets` の素材を配る |

## 3. ポイント計算（`src/lib/homework-store.ts`）

| 関数 | 行 | 役割 |
|---|---|---|
| `rankOfPoints` | 86 | 獲得ポイントからランクを決める：NORMAL 0 / GOLD 100 / BLACK 300 以上 |
| `freezeCompleteBonuses` | 293 | コンプリートボーナス（5回ごと）を、その時点の金額で確定する |
| `mergeState` | 360 | 端末とサーバーの状態を合わせる |
| `earnedPoints` | 610 | 獲得ポイントの合計 |
| `applyHwState` | 666 | 宿題の状態を記録（hwEvent を追加） |
| `correctHwState` | 733 | 訂正：古い記録を無効（voided）にしてから新しく記録 |
| `applyMaterialScan` | 793 | 教材QR：1回目で提出、2回目で直し完了 |
| `grantManualPoints` | 815 | 先生による手動付与 |
| `spentPoints` / `availablePoints` | 838 / 841 | ガチャ履歴の cost 合計 / 獲得 − 消費 |
| `rankOf` / `ranking` | 845 / 848 | ランクとクラス別ランキング |

- **獲得ポイント** ＝ 旧方式 records の点 ＋ hwEvents（無効分を除く）＋ 手動付与 ＋ コンプリートボーナス
- **hwEvent の点数の初期値**（`/manage` で変更できます）：SUBMIT +10 / REDO −3 / RESUBMIT +3 / FORGOT +2 / SCHOOL_DONE +1 / NO_REPORT 0
  - 点数を変えても過去の記録の点は変わりません。
- **旧方式 records**：fixed 5 / submitted 3 / school 2 / declared 1 / redo 0 / none 0
  - 同じ日・同じ宿題に hwEvent があるときは、旧方式の点を数えません（二重に加算されない）。
- **使えるポイント** ＝ 獲得ポイント − `gachaLog` の cost の合計（ガチャ1回の初期値は `gachaCost` 10）
- **サーバー側**：`gate.server.ts` の `readClassState`（40行目）と `writeClassState`（46行目、確定済みのボーナスを消さずに合算）
- **既知のずれ**：児童画面の `student.functions.ts` にある `project()` はコンプリートボーナスを含みません。
  - これは基準状態として記録しておくもので、この作業では直していません。

## 4. QR 処理

| 種類 | 形式 | 処理 |
|---|---|---|
| 児童QR ＋ 教材QR | 児童名＋教材名（`,`・`、`・`/`・`｜`・タブなどで区切り、空白は無視） | `parseQr`（homework-store.ts 887行目）→ `applyMaterialScan` |
| しゅくだいカード | `HW:STATE` または `HW:STATE:宿題名` | `parseHwStateQr`（221行目）。先に児童QRを読む必要がある |
| わすれましたカード | `HWT1:<payload>.<HMAC>` | `hwqr.server.ts` で署名。先生だけが `makeForgotTokens`（hwqr.functions.ts 6行目）で発行し、`verifyForgotToken`（29行目）で確認してから FORGOT を記録 |

- 同じ文字列を2.5秒以内に読んだ場合は無視します。
- 順番がおかしいときは確認画面を出し、先生が強制的に記録できます。
- HMAC の鍵は `SESSION_SECRET` です。値が変わると、**印刷済みのわすれましたカードがすべて使えなくなります**。
  - 未設定のときは固定の予備鍵 `hw-token-fallback` で署名します。

## 5. ガチャ処理

**現在使われているもの**：`collection.functions.ts` の `drawCollGacha`（268行目、サーバー側）

1. `syncCustom()` で先生が追加した景品を読み込む
2. セッションの `studentId` を確認する（ない場合は null を返す）
3. 1日の回数（`usageRules.gachaPerDay`）を確認する。超えていたら `error: "daily"`
4. 使えるポイントが `gachaCost`（初期値10）より少なければ `error: "points"`
5. 抽選対象を決める：`!initial && obtainable !== false && 必要ランク <= 児童のランク`。対象がなければ `error: "off"`
6. 重み付きで抽選する（`Math.random()`、レアリティの重みを1件ずつ足した合計を使う）
7. `student_game.coll` に保存する
   - 持っていない景品なら `owned` に追加し、`play.newIds` に入れる
   - 持っている景品なら `dupes[id]` を +1 する
   - `play.gacha` を +1 し、`recent` に追加する（最大12件）
8. `class_state.gachaLog` の先頭に `{ id: "cl_xxxxxxx", studentId, prize: name, cost, at }` を追加する（最大500件）
9. `buildView` と `prize` を返す

- 装備の変更：`equipCollItem`（238行目）。カテゴリごとの1日の回数（`customPerDay`）で制限しています。
- 古い方式（互換のために残っていて、公開画面からは使われていない）：
  - `student.functions.ts` の `studentDrawGacha`（131行目）
  - `game.functions.ts` の `drawItemGacha`（200行目、ID は `ig_` で始まる）
  - `homework-store.ts` の `drawGacha`（856行目）

## 6. 児童・先生の権限分離

- **セッション**：`gate.server.ts` の `getGate`（22行目）。`useSession` の暗号化Cookie `shukudai-gate`（30日、SameSite=None）を使います。
- **先生**：`class-sync.functions.ts` の `teacherLogin`（13行目）で `TEACHER_PASSWORD` と比べ、`role: "teacher"` にします。
  - 次の関数はサーバー側でも先生かどうかを確認しています：`getClassState`（33行目）、`saveClassState`（40行目）、名簿同期、`makeForgotTokens`、景品管理（`prizes.functions.ts`）。
  - 画面側は `__root.tsx` の `TeacherGate` で守っています。
- **児童**：`student.functions.ts` の `studentLogin`（84行目）でログインします。
  - 年度＋学年＋組＋出席番号をつなげた番号を `student_directory.login_number` と照合し、1人に決まる場合だけ `role: "student"` と `studentId` をセッションに入れます。
  - 失敗が続くと、同じIPからは10分間に10回までしか試せません（`login_attempts`）。
  - 児童の関数はすべてセッションの `studentId` だけを使うので、他の児童を指定することはできません。
- **Supabase**：全テーブルで RLS が有効で、anon／authenticated からは読み書きできません。アクセスはすべてサーバー側の `supabaseAdmin` 経由です。
- **既知の点**（直していません）：`getClassBadges`（collection.functions.ts 376行目）はログインを確認していません。見た目の装備データだけを返します。

## 7. 主要アセット（88ファイル）

| 場所 | 中身 |
|---|---|
| `public/prizes/icons/` | 60枚（アイコン1件につき1枚） |
| `public/prizes/frames/` | black・gold・neon・prism（.png） |
| `public/prizes/bg/` | black・crystal・dragonlair・gold（.jpg） |
| `public/prizes/sounds/` | black・chime・coin・fanfare・gold・kira・levelup・pico・pon・sparkle（.mp3） |
| `public/prizes/gacha/` | machine・capsule・burst（.png、ガチャ演出） |
| `src/assets/collection/` | background-astral・background-legend（.jpg）、frame-astral・frame-legend（.png）、gacha-stage（.jpg） |
| `public/` | favicon.ico、robots.txt |

- 素材がない景品は、CSS や内蔵の描画（`CollectionIcon`・`CollectionBackdrop`・`CollectionFx`・`SuccessFx`）で表示し、効果音は `feedback.ts` の WebAudio で鳴らします。
- ファイルごとの SHA-256 は `snapshot.json` の `assets` に記録しています。
- Supabase Storage の `prize-assets` に先生が上げた素材は、この記録の対象外です。

## 8. 保護対象ファイル

次のファイルの SHA-256 を `snapshot.json` の `protectedFiles` に記録しています。リデザインでは、見た目だけを変え、これらのファイルの中身（ロジック）は変えないことを前提にします。

`collection-catalog.ts`・`collection.functions.ts`・`homework-store.ts`・`student.functions.ts`・`class-sync.functions.ts`・`gate.server.ts`・`hwqr.server.ts`・`hwqr.functions.ts`・`prizes.functions.ts`・`game.functions.ts`・`game-settings.ts`・`daily-play.ts`・`routes/__root.tsx`・`routes/api/public/prize-asset.$file.tsx`
