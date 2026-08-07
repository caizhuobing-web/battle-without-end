const CACHE_NAME = "bwe-alpha-032-v3";
const CORE = [
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./app-032.gz.b64"
];

async function alpha032Response(){
  const cache = await caches.open(CACHE_NAME);
  let packed = await cache.match("./app-032.gz.b64");
  if(!packed){
    packed = await fetch("./app-032.gz.b64", {cache:"no-store"});
    if(packed.ok) await cache.put("./app-032.gz.b64", packed.clone());
  }
  if(!packed || !packed.ok) throw new Error("Alpha 0.32 package unavailable");
  const b64 = (await packed.text()).trim();
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
  if(typeof DecompressionStream === "undefined") throw new Error("Browser does not support gzip decompression");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const html = await new Response(stream).text();
  return new Response(html, {
    status:200,
    headers:{
      "Content-Type":"text/html; charset=utf-8",
      "Cache-Control":"no-store",
      "X-BWE-Version":"0.32.0"
    }
  });
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;
  if(event.request.mode === "navigate"){
    event.respondWith(
      alpha032Response().catch(() => fetch(event.request).catch(() => caches.match("./index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if(response && response.status === 200){
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
