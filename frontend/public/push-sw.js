// Receive push notifications
self.addEventListener("push", (event) => {
  let data = {
    title: "shopSquare",
    body: "You have a new order update."
  };

  if (event.data) {
    try {
      data = {
        ...data,
        ...event.data.json()
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    vibrate: [200, 100, 200],
    data: {
      url: "/orders"
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title,
      options
    )
  );
});

// Open orders page when notification is clicked
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.openWindow("/orders")
  );
});