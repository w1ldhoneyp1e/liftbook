const CACHE_NAME = "liftbook-app-shell-v2"
const APP_SHELL_URLS = ["/", "/manifest.webmanifest", "/favicon.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  const requestUrl = new URL(request.url)

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/", responseClone))
          return response
        })
        .catch(() => caches.match("/"))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response
        }

        const responseClone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
        return response
      })
    })
  )
})
