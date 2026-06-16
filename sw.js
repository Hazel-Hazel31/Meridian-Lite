const C = "meridian-v35";

self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", e => {
  let data = { title: "Meridian", body: "Reminder" };
  try { if (e.data) data = e.data.json(); } catch (_) { if (e.data) data.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(
    data.title || "Meridian",
    { body: data.body || "", tag: data.tag || "chronicle", data: data }
  ));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow("./");
  }));
});

self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.hostname.endsWith("supabase.co")) return;
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(net => {
      if (net && net.ok) { const cp = net.clone(); caches.open(C).then(c => c.put(e.request, cp)); }
      return net;
    }).catch(() => caches.open(C).then(c => c.match(e.request)))
  );
});
