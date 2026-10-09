/**
 * サービスワーカー：アプリとしてホーム画面に追加できるようにするための最小限の部品。
 *  ・画面の部品（HTML・CSS・JS・アイコン）だけを手元に保存し、電波が弱くても起動できるようにする
 *  ・データの通信（Apps Script への問い合わせ）には一切さわらない（常に最新を取りに行く）
 *  ・index.html は「まずネットから取り、失敗したら保存版」。古い画面のまま固まらないようにするため
 */
const CACHE = 'gtd-shell-v1';
const SHELL = ['./', './index.html', './quick.html', './app.css', './sortable.min.js', './config.js',
               './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // 通信（API）は素通し
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
