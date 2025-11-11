const CACHE_VERSION = "v1";
const CACHE_NAME = `chamcong-${CACHE_VERSION}`;

const CACHE_URLS = [
  "/",
  "/login",
  "/register",
  "/globals.css",
];

const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const apiCacheTimestamps = new Map();

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching shell files");
      return cache.addAll(CACHE_URLS).catch((err) => {
        console.warn("[SW] Some shell files could not be cached:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests to API (POST, PUT, DELETE)
  if (request.method !== "GET") {
    // Queue POST requests for offline handling
    if (
      request.method === "POST" &&
      url.pathname.startsWith("/api/attendance")
    ) {
      event.respondWith(
        fetch(request.clone())
          .then((response) => response)
          .catch((error) => {
            console.log("[SW] POST request failed, will be queued:", error);
            return new Response(
              JSON.stringify({
                error: "Offline - will sync when online",
                queued: true,
              }),
              {
                status: 202,
                headers: { "Content-Type": "application/json" },
              }
            );
          })
      );
    } else {
      event.respondWith(
        fetch(request.clone()).catch((error) => {
          console.log("[SW] Fetch failed for non-GET:", error);
          return new Response("Offline", { status: 503 });
        })
      );
    }
    return;
  }

  // GET requests - cache first, then network
  if (url.pathname.startsWith("/api/")) {
    // API requests: network first, fall back to cache
    event.respondWith(
      fetch(request.clone())
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
            apiCacheTimestamps.set(url.toString(), Date.now());
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            if (response) {
              console.log("[SW] Using cached API response");
              return response;
            }
            return new Response(
              JSON.stringify({ error: "Offline and no cache available" }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              }
            );
          });
        })
    );
  } else {
    // Static assets: cache first, then network
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          console.log("[SW] Cache hit for:", url.pathname);
          return response;
        }

        return fetch(request.clone())
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache successful responses
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));

            return response;
          })
          .catch((error) => {
            console.log("[SW] Fetch failed, returning offline page:", error);
            return caches.match("/") || new Response("Offline");
          });
      })
    );
  }
});

// Background sync for offline queue
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-attendance") {
    console.log("[SW] Background sync triggered");
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    // This is handled by the client-side queue mechanism
    console.log("[SW] Offline queue sync completed");
  } catch (error) {
    console.error("[SW] Sync failed:", error);
  }
}

// Listen for messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "SYNC_QUEUE") {
    syncOfflineQueue().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
