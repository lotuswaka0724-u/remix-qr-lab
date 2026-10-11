# Recraft V3：6種類の生成準備と実行記録

2026-10-11 12:45 UTCの承認で以下の生成条件により6枚を実行済み。6枚の原本を取得・保存し、残高58→52（各1credit）。構図/内容が全6枚要件未達で未採用。詳細はanimated-plates-status.mdとFilesのrecraft-v3-six-plates/result.md。以下の準備手順は実行前の計画であり、追加生成許可ではない。

## 実行条件
- Recraft公式MCPのみ使用。モデル `recraftv3_raster`、各種類 `n=1`、計6回。デフォルトモデルに任せない。
- 12:45 UTCの方針変更：ユーザーが58creditsを無料枠とみなす前提で6枚分の消費を承認。内訳未取得のみを理由に停止せず、公表MCP残高方式で進める。追加料金の要求/兆候があれば停止。有料契約・購入・自動有料切替は禁止。
- 学校アプリへの組込み許諾は生成可否と別に確認。無料生成が可能と確認できても、学校利用許諾が不明なら原本取得・検査までとし、本番に組み込まない。
- 条件が不明なら生成しない。購入・プラン変更・アップスケール・背景除去・追加生成をしない。
- 実行直前と各生成後にget_userで残高確認。想定を超える消費があれば残りを停止。
- 後日の生成権限や自動再開を与える文書ではない。

## 寸法の制約
現在のMCPスキーマには8:1、640×80、透過背景の直接指定がない。`image_size: "2:1"` のキャンバス中央に横長8:1のプレートを1つ描く方式を準備する。これは構図の保証ではない。

生成後に実際のプレート位置を確認し、四辺水平・垂直、名前領域に模様や文字なし、端の装飾が切れない場合だけ、ローカルの切出し・縮小で640×80を用意する。不合格なら自動再生成せず報告。引き伸ばしで8:1に変形しない。透過を仮定せず、暗い単色背景を指定。

## 共通プロンプト
以下と各種類の追記を結合して使用。過去の実呼び出しで1000文字制限があったため、合計1000文字以内に収める。

```text
One premium cinematic sci-fi game nameplate, centered on a solid dark navy background. Front-facing flat UI, zero rotation, exact bilateral symmetry, no perspective. One horizontal rectangle, width eight times height; all edges parallel to canvas edges. Leave space above and below for cropping. Thin top/bottom trim, ornaments only at the far left/right edges. Central 80% width and middle 55% height must be uniform dark navy, completely blank and clean for HTML text added later. Refined metal, crystal and precise edges; restrained, not toy-like. No text, letters, numbers, logos, watermark, signatures, people, characters, ribbons, stars in the center, or multiple plates.
```

|種類|追記（文字として画像に描かない）|予定ID／レア度|
|---|---|---|
|CYAN|Cyan neon circuitry and precision silver bevels at the perimeter; angular symmetric end caps, cool restrained light.|bg_motion_cyan／SR|
|VIOLET|Violet and magenta cosmic filaments only along the rim, lavender iridescent alloy, curved symmetric end ornaments.|bg_motion_violet／SR|
|CRYSTAL|Transparent pearl crystal facets at both ends, clean polished platinum rim with subtle cyan spectral reflections.|bg_motion_crystal／SSR|
|NEON|Multiple parallel cyan and rose light channels around the perimeter, layered dark alloy rails and symmetric geometric end caps.|bg_motion_neon／SSR|
|GOLD|Luxury brushed and polished gold perimeter, precise engraved end caps, tiny restrained gold flecks only at outer ends.|bg_motion_gold／GOLD|
|BLACK|Obsidian and dark titanium perimeter, layered cyan and violet energy channels at edges, restrained rare iridescent crystal end caps.|bg_motion_black／BLACK|

## 取得・確認手順（未実施）
1. 返却された画像URLを取得し原本を一時領域に保存。HTTP成功だけでなく画像として読み出せることと実寸・形式を確認。
2. URL、生成時点の契約・利用条件、前後残高、実消費、実寸、形式を記録。今回の生成URLはまだない。
3. 原本と640×80候補を目視検査。水平構図、均一な名前領域、文字・ロゴなし、6種類の差別化を確認。
4. 権利・品質が確認できた正式画像だけプロジェクトの素材保存手順で登録。保存候補は `src/assets/nameplates/animated/`、参照候補は既存のID別素材管理。まだ画像ファイル・参照の作成はしない。
5. CSSの反射・発光・きらめきは画像制作と別工程。既存37件と6件のガチャ対象外設定を変えない。

原本取得・保存・品質検査は6枚実施済み。正式素材採用・640×80派生・組込みは未実施。画像品質と学校利用権の未解決を残し、正式完成とはしない。