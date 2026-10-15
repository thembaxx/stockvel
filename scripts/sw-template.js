/* Public interface assets only. Never cache authenticated documents, RSC payloads, APIs or financial data. */
const VERSION = "__VERSION__";
const CACHE = `stokvelos-shell-${VERSION}`;
const PRECACHE = __PRECACHE__;
const MAX_RUNTIME_ENTRIES = 150;
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
  // Updates stay waiting until the user finishes their work and accepts a reload.
});
self.addEventListener("activate", event => {
  event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(k=>k.startsWith("stokvelos-shell-")&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener("message", event => { if(event.data?.type==="SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", event => {
  const request=event.request;const url=new URL(request.url);
  if(request.method!=="GET"||url.origin!==self.location.origin||request.headers.get("RSC")||request.headers.get("Next-Router-Prefetch"))return;
  if(url.pathname.startsWith("/api/")||url.pathname.startsWith("/auth/")||url.pathname.startsWith("/workspace/")||url.pathname==="/workspace"||url.pathname.startsWith("/account/")||url.pathname.startsWith("/organization/")||url.pathname.startsWith("/societies/")||url.pathname.startsWith("/documents/"))return;
  if(request.mode==="navigate"){
    // Even previously viewed dashboard HTML is not stored. Only a non-sensitive shell is available offline.
    event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(CACHE);return await cache.match("/offline.html")||Response.error();}));return;
  }
  if(PRECACHE.includes(url.pathname)||url.pathname.startsWith("/_next/static/")){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);const hit=await cache.match(request);if(hit)return hit;
      const response=await fetch(request);if(response.ok&&response.type==="basic"){
        // Limit to static assets. Respect explicit no-store responses.
        if(!response.headers.get("Cache-Control")?.includes("no-store")) {await cache.put(request,response.clone());const keys=await cache.keys();const runtime=keys.filter(k=>!PRECACHE.includes(new URL(k.url).pathname));if(runtime.length>MAX_RUNTIME_ENTRIES)await cache.delete(runtime[0]);}
      }return response;})());
  }
});
