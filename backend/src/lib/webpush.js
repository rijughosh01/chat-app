import webpush from "web-push";
import dotenv from "dotenv";
import PushSubscription from "../models/pushSubscription.model.js";

dotenv.config();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@nexchat.app";

if (publicVapidKey && privateVapidKey) {
  try {
    webpush.setVapidDetails(vapidEmail, publicVapidKey, privateVapidKey);
  } catch (error) {
    console.error("Failed to initialize web-push VAPID details:", error.message);
  }
} else {
  console.warn("VAPID keys not configured in backend/.env");
}

export const sendPushNotification = async (userId, payload) => {
  if (!publicVapidKey || !privateVapidKey) return;

  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) return;

    const stringifiedPayload =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          stringifiedPayload
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Cleaning up expired push subscription ${sub._id}`);
          await PushSubscription.findByIdAndDelete(sub._id);
        } else {
          console.error(`Push notification failed for subscription ${sub._id}:`, err.message);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Error in sendPushNotification:", error.message);
  }
};

export { webpush, publicVapidKey };
