# 動く6種類のネームプレート：途中報告

## 登録・保護
- 新規ID：bg_motion_cyan / bg_motion_violet / bg_motion_crystal / bg_motion_neon / bg_motion_gold / bg_motion_black。
- 正式レア度：SR / SR / SSR / SSR / GOLD / BLACK。
- 6件すべて obtainable:false、initial指定なし。既存の抽選フィルタをそのまま使用し、候補に入らない。アイテム総数は154→160、プレートは37→43。
- 既存154件のID・名前・レア度（背景は変更前からN）・初期所持・排出設定を基準照合。保存構造・抽選処理の変更なし、DB書き込みなし。
- 既存 equipCollItem は未所持を notowned で拒否。BOXの装備ボタン・同期ロック・日次制限を変更していない。入手機能は未実装。
- collection.functions.ts / CollectionPanel.tsx / name-plate-assets.ts の変更前後SHA256一致。

## Recraft実呼び出し
- 公式MCP get_user 成功、残高58。無料/有料の内訳と契約プランは返されない。
- generate_image が利用可能。recraftv3_raster、n=1指定は可能。ただし寸法選択は最大2:1の横長で、640×80・8:1・透明背景の直接指定項目はない。
- Recraft公式商用権ページをHTTP 200で再取得：無料生成物は公開・Recraft所有・商用利用不可、有料プラン生成物は商用権と所有権あり。
- 参照：https://www.recraft.ai/docs/plans-and-billing/commercial-rights-and-ownership
- 学校アプリでの今回の利用権、58残高の内訳、追加料金不要を確定できないため generate_image は呼び出していない。消費0、購入0。6種類の画像URL・保存先・画像品質確認は未取得/未実施。
- V3は過去試作で1枚1クレジットの実績あり。ただし今回6枚分の無料枠と利用権は未確認。別サービスに切り替えていない。

## アニメーション準備と検証（正式画像の完成ではない）
- CSS幾何学表現は暫定の動作検証用。Recraft画像の代用として完成扱いしない。
- 明示的新規IDだけ共通NamePlateに反射・発光・端のきらめきを追加。文字・本体transformなし。画像取得後の本番組込みは未実施。
- /nameplate-labで6種類を20秒、30人の軽量表示を20秒観察。スクリーンショットの反射位置・縁の強弱・きらめきの変化を視認。CSS実再生時間も進行。
- 再読み込み後running、reduced motion時animation:none、解除後再開。非GET要求0、console pageerror 0。
- 30人の10秒実測588フレーム、p95 16.8ms、最大33.4ms。1280×1800で横はみ出しなし、一覧下端1002px。
- 最初の操作試験は再読み込み直後にクリックしたため30人切替未成立。操作準備後に再実行し30人DOMを確認して測定。最初の6人測定を30人結果には使っていない。
- iPad/Safari実機、本番教師30人一覧、実所持による装備保存・再読み込み・3画面反映は未確認。未所持状態と入手手段未実装のため、本番データを変更して試験しない。

## テスト
- vitest 5ファイル31件成功。
- 新規テスト：6件の正式レア度、排出/初期所持禁止、NORMAL/GOLD/BLACK各候補ID・重み合計・全既存アイテム当選率一致、重み55/27/13/6/4/1不変。
- verify-catalog成功：既存154件維持、許可された6件のみ追加。
- 自動ビルドログ12:32:58 UTC build OK。型チェックは個別実施していない。

## 変更ファイル
- src/lib/animated-plates.ts、src/lib/collection-catalog.ts：排出禁止の6件登録。
- src/components/NamePlate.tsx、src/animated-plates.css、src/styles.css：新規ID専用の軽量動作と色トークン。
- src/routes/nameplate-lab.tsx、src/nameplate-prototype.css：静的な6件/30人表示。
- src/lib/animated-plates.test.ts、src/lib/name-plate.test.ts、scripts/verify-catalog.ts：保護テスト。
- AGENTS.md、roadmap.md：隔離ルールと未完了事項。

## 次に必要なこと
Recraft契約・残高内訳と学校アプリへの素材利用許諾の確認。有料プランが必要なら料金確認と承認が先。画像制作・保存・組込みはその後とし、今回を完成とはしない。
