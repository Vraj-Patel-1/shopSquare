const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

// Configure VAPID security keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Validate trusted push service endpoints
function isTrustedEndpoint(endpoint) {
  try {
    const url = new URL(endpoint);

    const trustedHosts = [
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "web.push.apple.com"
    ];

    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      (
        trustedHosts.includes(url.hostname) ||
        url.hostname.endsWith(".notify.windows.com") ||
        url.hostname.endsWith(".push.apple.com")
      )
    );
  } catch {
    return false;
  }
}

// Send notification to a specific user
async function sendNotificationToUser(userId, notification) {
  try {
    const subscriptions = await PushSubscription.find({
      user: userId
    });

    const payload = JSON.stringify({
      title: notification.title || "shopSquare",
      body: notification.body || "You have a new update.",
      icon: "/pwa-192x192.png",
      url: "/orders"
    });

    for (const subscription of subscriptions) {
      if (!isTrustedEndpoint(subscription.endpoint)) {
        console.warn("Untrusted push endpoint skipped.");
        continue;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          },
          payload,
          {
            TTL: 60,
            timeout: 5000
          }
        );

        console.log("Push notification sent successfully.");

      } catch (error) {
        if (
          error.statusCode === 404 ||
          error.statusCode === 410
        ) {
          await PushSubscription.deleteOne({
            _id: subscription._id
          });

          console.log("Expired subscription removed.");
        } else {
          console.error(
            "Push notification failed:",
            error.message
          );
        }
      }
    }

  } catch (error) {
    console.error(
      "Notification service error:",
      error.message
    );
  }
}

module.exports = {
  sendNotificationToUser,
  isTrustedEndpoint
};