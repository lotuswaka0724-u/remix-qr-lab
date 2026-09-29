import { plugin } from "bun";

// collection-catalog.ts の画像 import を、Vite なしで読み込めるようにファイルパス文字列へ置き換える
plugin({
  name: "baseline-asset-stub",
  setup(build) {
    build.onLoad({ filter: /\.(png|jpe?g|webp|svg|gif|mp3)$/ }, (args) => ({
      contents: `export default ${JSON.stringify(args.path.slice(args.path.indexOf("/src/")))}`,
      loader: "js",
    }));
  },
});
