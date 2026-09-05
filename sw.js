// 📌 เมื่อไหร่ที่อัปเดตโค้ดหน้าเว็บใหม่ ให้ขยับเลขตรงนี้ (เช่น v2 -> v3)
const CACHE_NAME = 'pos-cache-v7';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './shopping-bag.png',
  './logo.jpg.png'
];

// 1. ติดตั้ง Service Worker และสลับไปใช้เวอร์ชันใหม่ทันที
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// 2. ลบแคชเวอร์ชันเก่าทิ้งอัตโนมัติเมื่อเปลี่ยนเวอร์ชัน
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Network First: เช็กเน็ตเอาโค้ดใหม่ก่อนเสมอ ถ้าไม่มีเน็ตค่อยดึงแคชในเครื่อง
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('firestore.googleapis.com') || e.request.url.includes('identitytoolkit')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
