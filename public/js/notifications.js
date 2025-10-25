// ==================== Notifications Manager ====================

// ✅ Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// ✅ Your public VAPID key
const VAPID_PUBLIC_KEY = "BEOg5DAEgXVUZfVsnaDe72yBrCAJp4mEPs150PwJpaHUbc8kgSOp0Wz9pgzJd8GMuzQfoxbECKCjZ7HGnpsrwhs";

// ✅ Register Service Worker and subscribe for push notifications
async function registerPush() {
  try {
    console.log("Registering Service Worker...");
    
    // 👇 Important: file is in /public, so URL path is still "/service-worker.js"
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    
    console.log("Service Worker registered ✅", registration);

    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission denied ❌");
      return;
    }

    console.log("Subscribing to push notifications...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log("Push subscription success ✅", subscription);

    // ✅ Send subscription to your backend (Render backend)
    await fetch("https://efootball-backend-91me.onrender.com/api/save-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription)
    });

    console.log("Push subscription saved on server ✅");
  } catch (error) {
    console.error("Push registration failed ❌", error);
  }
}

// ✅ Initialize notification setup
(async () => {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    await registerPush();
  } else {
    console.warn("Push notifications are not supported on this browser ❌");
  }
})();
