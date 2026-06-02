self.addEventListener("install", (event) => {
  event.waitUntil(caches.open("project-circles-fixture-v1").then((cache) => cache.addAll(["/"])));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached ?? fetch(event.request)));
});
