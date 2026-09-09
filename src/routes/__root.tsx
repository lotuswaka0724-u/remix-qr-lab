import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { gateStatus, teacherLogin } from "@/lib/class-sync.functions";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "宿題チェッカー | QRで宿題提出をかんたん記録" },
      {
        name: "description",
        content: "QRコードを読み取るだけで宿題の提出状況を記録・集計できる、先生のための宿題チェックアプリ。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700;900&family=Zen+Maru+Gothic:wght@500;700;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "スキャン" },
  { to: "/board", label: "未提出ボード" },
  { to: "/history", label: "履歴" },
  { to: "/points", label: "ポイント・ガチャ" },
  { to: "/manage", label: "管理" },
] as const;

function TeacherGate({ children }: { children: ReactNode }) {
  const check = useServerFn(gateStatus);
  const login = useServerFn(teacherLogin);
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    void check({}).then((s) => setRole(s.role));
  }, [check]);

  if (role === undefined) {
    return (
      <main className="px-4 py-10 text-center text-sm text-muted-foreground">よみこみ中…</main>
    );
  }

  if (role !== "teacher") {
    return (
      <main className="mx-auto max-w-sm px-4 py-12">
        <form
          className="glass-panel space-y-4 p-6 text-center"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            const res = await login({ data: { password: pw } });
            if (res.ok) {
              setPw("");
              setRole("teacher");
              window.location.reload();
            } else setErr("合言葉がちがいます");
          }}
        >
          <h1 className="font-display text-xl font-bold">先生用の合言葉</h1>
          <p className="text-xs text-muted-foreground">
            クラスのデータを見るには、先生用の合言葉が必要です。
          </p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-center"
            aria-label="先生用の合言葉"
          />
          {err && <p className="text-sm font-bold text-destructive">{err}</p>}
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground"
          >
            はいる
          </button>
        </form>
      </main>
    );
  }

  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isStudent = pathname.startsWith("/me/");

  if (isStudent) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          <Outlet />
        </div>
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-content-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">
                宿
              </span>
              <span className="font-display text-lg font-bold tracking-tight">宿題チェッカー</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 rounded-full bg-muted p-1 text-sm font-bold">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeOptions={{ exact: n.to === "/" }}
                  className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "bg-card text-primary shadow-[var(--shadow-card)]" }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <TeacherGate>
          <Outlet />
        </TeacherGate>
      </div>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

