const CACHE_NAME = 'kasir-mpok-nani-v1';

// Daftar file yang WAJIB disimpan di memori HP agar bisa dibuka offline
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png', // Pastikan nama file ikon sesuai dengan yang ada di folder Anda
  './icon-512.png'
];

// Tahap 1: INSTALL - Menyimpan semua file ke dalam cache (memori HP)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Menyimpan aset ke cache...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Tahap 2: ACTIVATE - Menghapus cache lama jika Anda melakukan update versi (v1 ke v2, dst)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama...');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Tahap 3: FETCH - Mengambil data dari cache saat tidak ada internet
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jika file ada di cache, langsung berikan (tanpa internet)
      if (response) {
        return response;
      }

      // Jika file tidak ada di cache, baru ambil dari internet
      return fetch(event.request).then((networkResponse) => {
        // Simpan file baru tersebut ke cache secara otomatis (optional)
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    }).catch(() => {
      // Jika benar-benar offline dan file tidak ditemukan, Anda bisa mengarahkan ke halaman offline khusus di sini
    })
  );
});
