// なおし通知専用（ページのキャッシュはしない）
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { title: event.data && event.data.text() }; }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(d.title || "なおしがあるよ！", {
        body: d.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: d.tag || "redo",
        data: { url: "/me?tab=homework" },
      }),
      // ひらいている画面には、最新のなおしを読みに行くよう知らせる
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
        for (const c of list) c.postMessage({ type: "redo-push" });
      }),
    ]),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/me";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.postMessage({ type: "redo-open" });
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
