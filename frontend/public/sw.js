// NexChat Service Worker: PWA Offline Shell Caching & Web Push Notifications

const CACHE_NAME = "nexchat-pwa-v3";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-512x512.png",
  "/icons/apple-touch-icon.png",
  "/avatar.png",
  "/whatsapp-doodle.svg",
  "/whatsapp-doodle-dark.svg",
];

// 1. Service Worker Installation: Precache Application Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("Precache failed during SW install:", err);
      })
  );
});

// 2. Service Worker Activation: Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Network-First for Navigation/API, Cache-First for Static Assets
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests, chrome-extension, and Socket.io traffic
  if (
    request.method !== "GET" ||
    !url.protocol.startsWith("http") ||
    url.pathname.includes("/socket.io/")
  ) {
    return;
  }

  // Handle SPA Page Navigation (HTML)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match("/index.html");
        return cachedIndex || new Response("Offline", { status: 503, statusText: "Offline" });
      })
    );
    return;
  }

  // Handle API Requests: Network-first
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Handle Static Shell Assets (Styles, Scripts, Images, SVGs, Fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset and update cache in background (Stale-While-Revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Fetch from network and cache
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

// 4. Web Push Notification Handler
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: "NexChat",
        body: event.data.text(),
      };
    }
  } else {
    data = {
      title: "NexChat",
      body: "You received a new message",
    };
  }

  const senderId = data.data?.senderId;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if user is actively chatting with this user right now
      const isActivelyChatting = windowClients.some((client) => {
        return (
          client.focused &&
          senderId &&
          (client.url.includes(`chatWith=${senderId}`) || client.url.includes(senderId))
        );
      });

      if (isActivelyChatting) {
        return;
      }

      const title = data.title || "NexChat";
      const options = {
        body: data.body || "New message received",
        icon: data.icon || "/icons/icon-192x192.png",
        badge: data.badge || "/icons/icon-192x192.png",
        tag: data.tag || (senderId ? `chat-${senderId}` : "nexchat-alert"),
        renotify: true,
        vibrate: [200, 100, 200],
        data: data.data || { url: "/" },
        actions: [
          { action: "open", title: "Open Chat" },
          { action: "dismiss", title: "Dismiss" },
        ],
      };

      return self.registration.showNotification(title, options);
    })
  );
});

// 5. Notification Click Handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const notifData = event.notification.data || {};
  const senderId = notifData.senderId;
  const targetUrl = notifData.url || (senderId ? `/?chatWith=${senderId}` : "/");

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.focus();
          if (senderId) {
            client.postMessage({
              type: "OPEN_CHAT",
              userId: senderId,
            });
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
