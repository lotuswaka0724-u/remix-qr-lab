import { createFileRoute } from "@tanstack/react-router";

/**
 * 先生が登録した景品素材（画像・音声）を配る。
 * 保存先は非公開バケットなので、ここから読み出して返す。
 */
export const Route = createFileRoute("/api/public/prize-asset/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const file = String(params.file ?? "");
        if (!/^[A-Za-z0-9._-]+$/.test(file)) return new Response("not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("prize-assets").download(file);
        if (error || !data) return new Response("not found", { status: 404 });
        const buf = await data.arrayBuffer();
        return new Response(buf, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
