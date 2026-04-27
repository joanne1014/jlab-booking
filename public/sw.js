// Service Worker - 用嚟接收推送通知
self.addEventListener('push', function (event) {
  let data = { title: '預約提醒', body: '你有新嘅預約提醒' };

  try {
    data = event.data.json();
  } catch (e) {
    // 用預設值
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
