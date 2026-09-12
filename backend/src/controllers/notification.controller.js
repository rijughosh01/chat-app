import PushSubscription from "../models/pushSubscription.model.js";
import { sendPushNotification, publicVapidKey } from "../lib/webpush.js";

export const getVapidPublicKey = async (req, res) => {
  try {
    if (!publicVapidKey) {
      return res.status(500).json({ error: "VAPID public key is not configured" });
    }
    res.status(200).json({ publicKey: publicVapidKey });
  } catch (error) {
    console.error("Error in getVapidPublicKey:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const subscribe = async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    const userId = req.user._id;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription object" });
    }

    const { endpoint, keys } = subscription;

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
        userAgent: userAgent || "",
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, message: "Subscribed to push notifications" });
  } catch (error) {
    console.error("Error in subscribe:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user._id;

    if (endpoint) {
      await PushSubscription.findOneAndDelete({ endpoint, userId });
    } else {
      // If endpoint is not specified, remove all for this user
      await PushSubscription.deleteMany({ userId });
    }

    res.status(200).json({ success: true, message: "Unsubscribed from push notifications" });
  } catch (error) {
    console.error("Error in unsubscribe:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getNotificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const subscriptions = await PushSubscription.find({ userId });

    res.status(200).json({
      isSubscribed: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
    });
  } catch (error) {
    console.error("Error in getNotificationStatus:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendTestNotification = async (req, res) => {
  try {
    const user = req.user;
    const subscriptions = await PushSubscription.find({ userId: user._id });

    if (subscriptions.length === 0) {
      return res.status(400).json({
        error: "No active push subscriptions found for your account. Please enable notifications first.",
      });
    }

    await sendPushNotification(user._id, {
      title: "NexChat Alerts",
      body: "🔔 Web Push notifications are active! You will now get desktop alerts when you receive new messages in the background.",
      icon: user.profilePic || "/avatar.png",
      badge: "/vite.svg",
      tag: "test-alert",
      data: {
        url: "/",
        type: "TEST",
      },
    });

    res.status(200).json({ success: true, message: "Test notification sent successfully" });
  } catch (error) {
    console.error("Error in sendTestNotification:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
