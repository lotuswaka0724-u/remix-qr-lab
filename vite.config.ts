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
    // iPad が最初の画面を要求した後に optimizer が依存を追加すると、配信中の
    // module URL が無効になり Safari が白画面になる。初回画面と動的 QR 機能で
    // 実際に使う依存を起動時にまとめ、ページ配信後の二度目の最適化を防ぐ。
    optimizeDeps: {
      holdUntilCrawlEnd: true,
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/client",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@tanstack/react-router > @tanstack/react-store",
        "@tanstack/router-core",
        "@tanstack/router-core/isServer",
        "@tanstack/router-core/ssr/client",
        "@supabase/supabase-js",
        "@radix-ui/react-slot",
        "@radix-ui/react-switch",
        "class-variance-authority",
        "clsx",
        "seroval",
        "sonner",
        "tailwind-merge",
        "qrcode",
        "html5-qrcode",
      ],
      ignoreOutdatedRequests: true,
    },
  },
});
