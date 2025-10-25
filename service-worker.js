// ==================== Service Worker ====================

self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activated and ready to handle push notifications!");
});

// ✅ Handle push messages
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json();
  console.log("📩 Push received:", payload);

  const options = {
    body: payload.body || "You have a new update!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    data: payload.url || "/",
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "eFootball League 2025", options)
  );
});

// ✅ Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
