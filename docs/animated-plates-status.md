# 動く6種類のネームプレート：途中報告

## 2026-10-11 追加確認：最新公式条件・接続・生成準備

以下は今回の再確認。後続の「Recraft実呼び出し」などは前回の記録。

### 確認済み：実際のMCP接続
- `get_user` 成功、残高は今回も **58 credits**。契約プラン、無料/定期付与/購入分の内訳、失効日、課金設定は返らない。58ドル、58枚の利用権、有料契約の証明ではない。
- `subscription_plans` 成功：Free＝30 credits per daily、Basic＝月1000、Pro＝月2000/4000/8000/16000。これは選択肢の一覧であって、このアカウントの契約の回答ではない。価格金額は返らない。
- `generate_image` の現在のツール定義を確認。Recraft V2/V3/V4.1/V4.1 Proのラスター/ベクター指定が可能。V3は `model: "recraftv3_raster"`、`n: 1` を明示できる。これらはツールが受け付ける選択肢の確認であり、全モデルの実生成成功や契約別権限の検証ではない。
- 公式クレジット表のV4.1 Flash/Utilityは今回のgenerate_imageのモデル選択肢にはない。別のモデル名で代用しない。
- 今回 `generate_image` は未呼出し。画像生成0、クレジット消費0、購入・プラン変更・再認証0。接続は正常で、今回再認証は不要。

### 確認済み：学校アプリへの利用条件
1. [General Terms §7.1/7.2/7.5](https://www.recraft.ai/legal/terms) をHTTP 200で取得。
   - §7.1：無料生成素材は **“for your personal use”**、**“no commercial use ... is permitted”**、**“may not be sold, licensed or transferred”**。無料素材を単に「非営利なら何でも使用可」と解釈しない。
   - §7.2：有料契約は **“business or personal use”**、生成素材は **“You own all Assets you create”**。AI学習利用などは禁止。第三者の権利への配慮は別途必要。
   - §7.5：Community Assetsには個人/商用利用の許諾条項がある。ただし、これから自分で生成する無料素材を自動的にこの許諾で扱えることは確認できない。今回の利用権の代わりに用いない。
2. [Developer Terms §4.3/5.6](https://www.recraft.ai/legal/developer-terms) をHTTP 200で取得。
   - §4.3：公式MCP素材は **“subscription plan ... at the time of generation”** の所有権・利用制限に従う。API素材の所有権規定をMCP無料生成に流用しない。
   - §5.6：MCPの既定課金はsubscription credits、APIの既定課金はAPI Units。別課金方式が特定契約に提供される可能性は残る。
3. [Commercial rights and ownership](https://www.recraft.ai/docs/plans-and-billing/commercial-rights-and-ownership) をHTTP 200で取得。無料はRecraft所有・商用不可・公開、有料は所有権/商用権あり。

**結論：有料契約中に生成する素材は、規約を守る限り学校アプリの素材利用を許諾する根拠がある。一方、現在の契約は不明で、無料契約での学校・児童向け配布を含むREMIX QR LABへの組込み許諾は確認できない。無料で学校利用可能とも、学校利用すべてが商用だから不可とも断定しない。** 無料のまま進めるなら、非営利学校用・児童へのブラウザ表示・画像の切出し縮小・CSS演出追加を含む利用についてRecraftの書面回答が必要。無料時の素材が、後から有料化するだけで有料生成素材の権利になるとは扱わない。

### 確認済み：必要クレジット・公開料金
- [公式MCP Billing](https://www.recraft.ai/docs/mcp-reference/remote-server)：Studioと同じsubscription credit残高を消費。無料ユーザーも対象。
- [公式Credits](https://www.recraft.ai/docs/plans-and-billing/credits)：ラスターV2＝1、V3＝1、V4.1＝2、V4.1 Pro＝10 credits/枚。ベクターV2/V3＝2、V4.1＝4、V4.1 Pro＝12。V3ラスターは過去試作の1枚1credit実績とも一致。
- V3ラスター6種類を各n=1で作る場合、**計6 credits**。残高が他操作で変わらず公表料金通りなら58→52。やり直し1枚ごとに+1credit。アップスケールや背景除去を含めない。
- 58は数値上6より多いので、公表される通常のMCP方式なら追加のクレジット購入は不要。しかしこのアカウントの契約/課金方式・素材権利が未確認のため、**追加料金0を確定したとは報告しない**。
- [公式Paid plans](https://www.recraft.ai/docs/plans-and-billing/paid-plans)：Basicは月払い **$12/月・1000credits**、年払い **$10/月相当・$120/年**。権利確保に新規有料契約が必要なら、月払いの公表開始額は$12。6credit＝$0.072という按分を「6枚の購入費」とは表示しない。税・為替・地域別最終請求額は未確認。
- 公開料金は契約画面の最終金額ではない。課金が必要と判明した場合は生成を止め、必要額を提示して承認待ちとする。

### 表記が一致せず確定できない事項
- 実MCPのプラン一覧は無料30credits/day。一方、取得した最新[Free plan文書](https://www.recraft.ai/docs/plans-and-billing/free-plan)とMCP文書は無料枠について限定的な付与と説明するだけで、日次/月次付与数を確定できない。月100creditsや58の繰越/購入内訳も未確認。非公式の更新履歴は根拠に採用しない。
- 必要な追加確認：生成時点の契約名と、58の内訳・MCP利用時の追加課金の有無。Recraftのアカウント画面または公式サポート回答が必要。支払情報や秘密鍵は不要。
- 無料契約なら、今回の学校アプリ利用の個別許諾。公式窓口：help@recraft.ai（公式料金ページ記載）。こちらから問い合わせ送信はしていない。

### 準備・既存状態の保護
- `docs/recraft-six-plates-preparation.md` に6種類の独立プロンプト、V3/n=1、取得/検査/保存手順、構図不合格時の停止条件を準備。
- MCPは8:1/640×80/透過の直接指定なし。2:1キャンバス内に8:1プレートを生成し、品質確認後にローカルで切出し縮小する案。構図成功は未保証、以前の不合格画像を完成素材にしない。
- 今回はアプリコード/素材/既存37件/所持/装備/保存データを変更していない。公式画像の生成・取得・本番保存は未実施。
- 今回再実行：`animated-plates.test.ts` **6テスト成功**、`verify-catalog.ts` 成功。既存154件維持・新規6件のみ・全6件obtainable:false・初期所持なし・全既存候補/重み/当選率一致。重み55/27/13/6/4/1不変。
- 入手機能・実保存反映・iPad/Safari実機など、前回の未確認項目はこの利用条件調査では解消していない。

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
- 抽選候補数/重み合計（変更前＝変更後）：NORMAL 139/5461、GOLD 144/5481、BLACK 149/5486。全既存アイテムの当選率変化は0。
- 自動ビルドログ12:32:58 UTC build OK。型チェックは個別実施していない。

## 変更ファイル
- src/lib/animated-plates.ts、src/lib/collection-catalog.ts：排出禁止の6件登録。
- src/components/NamePlate.tsx、src/animated-plates.css、src/styles.css：新規ID専用の軽量動作と色トークン。
- src/routes/nameplate-lab.tsx、src/nameplate-prototype.css：静的な6件/30人表示。
- src/lib/animated-plates.test.ts、src/lib/name-plate.test.ts、scripts/verify-catalog.ts：保護テスト。
- AGENTS.md、roadmap.md：隔離ルールと未完了事項。

## 次に必要なこと
Recraft契約・残高内訳/個別課金設定と学校アプリへの素材利用許諾の確認。V3の6枚は公表6credits、有料契約が必要ならBasic月払いの公表開始額は$12/月。追加費用なしと利用権が確認できるまで生成しない。生成準備は別文書に記録済み。画像制作・保存・組込みは未完了。
