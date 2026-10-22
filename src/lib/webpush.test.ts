import { describe, expect, it } from "vitest";
import { b64u, encrypt, fromB64u } from "@/lib/webpush.server";

// RFC 8291 第5節の例（固定の鍵とソルト）と1バイト違わず一致すること
describe("Web Push 暗号化", () => {
  it("RFC 8291 の例と同じ結果になる", async () => {
    const out = await encrypt(
      {
        endpoint: "https://push.example.net/x",
        p256dh: "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4",
        auth: "BTBZMqHH6r4Tts7J_aSIgg",
      },
      new TextEncoder().encode("When I grow up, I want to be a watermelon"),
      {
        asPriv: fromB64u("yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw"),
        salt: fromB64u("DGv6ra1nlYgDCS1FRnbzlw"),
      },
    );
    expect(b64u(out)).toBe(
      "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN",
    );
  });
});
