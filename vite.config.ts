// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // これらは実行中に動的 import されるため、事前に取り込んでおかないと
    // 画面表示中に再バンドル→リロードが起き "Importing a module script failed" になる
    optimizeDeps: {
      // 依存の自動追加は、既に開いているプレビューが参照するファイルを
      // 起動後に置き換えてしまう。必要な依存をここで固定し、再最適化を防ぐ。
      noDiscovery: true,
      include: [
        "@tanstack/react-start-client",
        "@tanstack/router-core",
        "@tanstack/router-core/isServer",
        "@tanstack/router-core/ssr/client",
        "seroval",
        "qrcode",
        "html5-qrcode",
      ],
      // 初回の依存関係解析中に生成物が更新されても、表示中の iPad が
      // 直前の module URL を読み切れるようにして白画面を防ぐ。
      ignoreOutdatedRequests: true,
    },
  },
});
