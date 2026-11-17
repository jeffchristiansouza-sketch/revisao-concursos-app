/* Service worker: guarda o app para abrir sem internet. A versão é carimbada pelo build.py a cada publicação. */
const V = 'rc-6c66e82';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'simulados/index.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  const sameOrigin = u.origin === location.origin;
  /* GitHub (dados) sempre pela rede; o próprio app guarda a cópia local */
  const cacheable = sameOrigin || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
  if (!cacheable) return;
  /* página, simulados e casos: rede primeiro (pega atualizações), cache se offline */
  const netFirst = sameOrigin && (e.request.mode === 'navigate' || /\.(json|html)$/.test(u.pathname) || u.pathname.endsWith('/'));
  if (netFirst) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(n => { if (n.ok || n.type === 'opaque') { const c = n.clone(); caches.open(V).then(x => x.put(e.request, c)); } return n; })));
  }
});
