/* RMD AudioLab — treino em casa: guarda o app no celular para abrir mesmo sem internet.
   Busca sempre a versão nova quando tem internet; sem internet, usa a cópia guardada. A nuvem (notas) não passa por aqui. */
const CACHE = "rmd-audiolab-casa-20261123004105";
const ARQUIVOS = ["./", "index.html", "casa.js", "comum.css", "comum.js", "motor.js", "figuras.js", "metronomo.js", "bateria.js", "musicos.js", "vocal.js", "treinos.js", "ferramentas.js", "documentos.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ns) => Promise.all(ns.filter((n) => n.startsWith("rmd-audiolab-casa-") && n !== CACHE).map((n) => caches.delete(n)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(
    fetch(new Request(e.request, { cache: "no-store" }))
      .then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((x) => x || caches.match("index.html")))
  );
});
