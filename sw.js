const CACHE_NAME="bwe-alpha-038-v4";
const CORE=[
 "./","./index.html","./style.css","./ios-safe.css","./equipment-ui.css","./equipment-live.js","./background-progress.js","./training-profile.js","./skill-cooldown-balance.js","./auto-pet-fusion.js","./identity-start-gear.js","./early-progression-balance.js","./build-system-v14.js","./jackpot-system-v14.js","./alpha-038-systems.js",
 "./core-00.js","./core-01.js","./core-02.js","./core-03.js","./core-04.js","./core-05.js","./core-06.js","./core-07.js",
 "./core-08.js","./core-09.js","./core-10.js","./core-11.js","./core-12.js","./core-13.js","./core-14.js","./core-15.js",
 "./manifest.webmanifest","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy));return response;}).catch(()=>caches.match("./index.html")));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&response.status===200){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return response;})));
});
