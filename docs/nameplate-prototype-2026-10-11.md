# 独立した名前プレート試作

## 生成と利用権
- Recraft公式MCP generate_image、recraftv3_raster、n=1、image_size=2:1、1回のみ生成。
- 残高59→58、消費1クレジット。購入、追加生成、背景除去、アップスケールなし。
- 原本: https://img.recraft.ai/fInGdfI0vpRtKeuKYGtyv4GvEDXOyLMpJdjcL70dunM/rs:fit:2048:1024:0/raw:1/plain/abs://external/images/6f269e47-3a7b-4205-817a-965755c95626
- 保存: /mnt/documents/recraft-v3-nameplate-prototype-02.webp
- 実寸2048×1024、WebP、RGB、透明なし、3,214,066 bytes。
- 水平・文字なしを視認。中央に星模様、上下中央に宝石があり、8:1の細い枠ではない。外周を維持して8:1へ単純切り抜きできず、引き伸ばし/加工はしない。
- https://www.recraft.ai/docs/plans-and-billing/commercial-rights-and-ownership に無料画像は商用利用不可と記載。契約内訳と学校アプリでの個別許諾は未確認。Recraft画像はアプリに一切組み込まない。

## 独立した動作試作
- /nameplate-lab に自作の文字なし幾何学クリスタルと既存色トークンだけで試作。ID、カタログ、装備、ポイント、データ通信との接続なし。
- NameplatePrototype.tsx、nameplate-prototype.css、nameplate-lab.tsxを新規作成。__root.tsxではこの静的パスだけ既存TeacherGateの対象外とし、既存各パスの認証を変更しない。AGENTS.mdに隔離方針を追加。
- 640×80、中央約510.4×42.9の文字領域（境界線の内寸により目標512×44との差あり）。長短辺水平/垂直、プレート本体transformなし。
- 外周反射7秒で左→右、発光5秒、端のきらめき6秒。アニメーション対象はtransform/opacityのみ。名前領域への装飾侵入なし、JSの毎フレーム更新なし。
- 停止/再開、1人/30人操作。prefers-reduced-motionでanimation:none。

## 実測
- Chromium、localhost:8080/nameplate-lab、実際のCSS再生を確認。
- 1.2秒間で反射translateX182.245→313.463、縁opacity0.672497→0.776273。きらめきopacity0→0.85。
- 768×1024の1人、1366×1024/1920×1080の30人で横はみ出しなし。横画面30人の最下部1002pxで収まる。768×1024で30人を出すと縦スクロールが必要（1345.75px）。本番教師/児童ページを変更したり実装した証拠ではない。
- 初回30人切替直後の10秒: 592フレーム、p95 16.7ms、最大183.4ms、longtask139msが1回。これを隠さず記録。
- 2.5秒待った比較10秒ずつ: 動作中600フレーム/p95 16.7ms/最大33.4ms、停止中601/16.7/33.3、再開601/16.7/33.3。全区間longtaskなし。初回停止の原因は未特定。実機の性能保証ではない。
- reduced-motionでanimationName:none、コンソール実行エラー0、非GETリクエスト0。
- 自動テスト25件成功、154件照合成功、自動ビルドOK（12:11:12 UTC）。単独型チェックは実行しない。
- 変更前SHA256との比較で既存srcの変更は__root.tsxと自動生成routeTree.gen.tsのみ。37素材・全カタログ・抽選/保存処理は一致。データベース操作なし。
- iPad/Safari実機、実際の本番教師30人画面への反映、学校アプリでのRecraft画像利用権は未確認。