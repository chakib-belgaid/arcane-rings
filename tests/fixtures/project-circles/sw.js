self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("arcane-rings-fixture-v1").then((cache) => cache.addAll(["/"])));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
