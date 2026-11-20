// sw.js: makes Summit an installable web app that also works offline.
// Twin of Dopps Class sw.js, rebuilt for Summit's Next.js static export.
//
// How it works:
//  • On install, the offline page, the app icons and a few key pages (with the /_next/ files they need) are saved.
//  • Pages always try the internet first, so students get the newest version. If there is no internet (or it takes
//    more than 4 seconds), the saved copy is used. Every page opened online is saved, so it works offline next time.
//    A page that was never saved shows /offline.html instead.
//  • /_next/static/ files have a hash in their name and never change, so the saved copy is used right away.
//  • Supabase (logins, scores, everything on another site) is NEVER cached or touched: those requests go straight
//    to the network. Live-game data, Next.js page data (?_rsc=) and PDFs are not saved either.
//  • Cache versioning: VERSION is stamped with the Next.js build id by scripts/pwa-stamp.mjs at the end of
//    `npm run build`. Each deploy gets fresh caches and the old "summit-" caches are deleted when it activates,
//    so a new deploy can never be stuck behind an old one. (Unstamped, e.g. in `next dev`, it is "dev".)

const VERSION = "__SUMMIT_BUILD__";
const CACHE = "summit-" + (VERSION.startsWith("__") ? "dev" : VERSION);
const OFFLINE = "/offline.html";
const SHELL = [OFFLINE, "/manifest.webmanifest", "/app/icon-32.png", "/app/icon-192.png", "/app/icon-512.png", "/app/icon-180.png"];
// Saved on install so the app opens offline even before the student has browsed. Best effort.
const WARM = ["/", "/welcome/", "/quest/", "/chapters/", "/chapters/1/", "/glossary/"];
const MAX_ITEMS = 600;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {})));
    await Promise.allSettled(WARM.map((u) => warm(c, u)));
    await self.skipWaiting();
  })());
});

// Save a page and the /_next/static/ files its HTML points to.
async function warm(c, url) {
  const r = await fetch(new Request(url, { cache: "reload" }));
  if (!r.ok || r.type !== "basic") return;
  const html = await r.clone().text();
  await c.put(url, r);
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?#]+)"/g)].map((m) => m[1]))];
  await Promise.allSettled(assets.map(async (a) => { if (!(await c.match(a))) await c.add(a); }));
}

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("summit-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function timeout(ms) { return new Promise((_, no) => setTimeout(() => no(new Error("slow")), ms)); }
async function trim(c) {
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_ITEMS; i++) await c.delete(keys[i]);
}
const save = (c, req, r) => { if (r.ok && r.type === "basic" && r.status === 200) c.put(req, r.clone()).then(() => trim(c)).catch(() => {}); return r; };

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                   // Supabase and every other site: straight to the network
  if (url.searchParams.has("_rsc") || req.headers.get("RSC")) return; // Next.js page data: network only (offline → full page load below)
  if (/\.pdf$/i.test(url.pathname) || url.pathname === "/sw.js") return;

  // Hashed build files never change: saved copy first.
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.open(CACHE).then(async (c) => (await c.match(req)) || save(c, req, await fetch(req))));
    return;
  }

  // Pages and every other file of ours: internet first, saved copy if offline or slow, offline page last.
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const net = fetch(req).then((r) => save(c, req, r));
    net.catch(() => {});                                               // handled below; keeps the console quiet
    try {
      return await Promise.race([net, timeout(4000)]);
    } catch {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try { return await net; }                                        // nothing saved: keep waiting for a slow network
      catch {
        if (req.mode === "navigate") return (await c.match(OFFLINE)) || Response.error();
        return Response.error();
      }
    }
  })());
});
