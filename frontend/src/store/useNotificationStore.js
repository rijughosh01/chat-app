import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import {
  isPushNotificationSupported,
  registerServiceWorker,
  getExistingSubscription,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "../lib/pushManager";
import { useChatStore } from "./useChatStore";

export const useNotificationStore = create((set, get) => ({
  isSupported: false,
  permission: "default",
  isSubscribed: false,
  isLoading: false,
  isTesting: false,
  bannerDismissed: localStorage.getItem("nexchat_push_dismissed") === "true",

  dismissBanner: () => {
    localStorage.setItem("nexchat_push_dismissed", "true");
    set({ bannerDismissed: true });
  },

  init: async () => {
    const supported = isPushNotificationSupported();
    set({ isSupported: supported });

    if (!supported) return;

    const currentPermission = Notification.permission;
    set({ permission: currentPermission });

    // Ensure service worker is registered
    await registerServiceWorker();

    // Setup listener for clicks forwarded from Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "OPEN_CHAT" && event.data.userId) {
          const targetUserId = event.data.userId;
          const { users, setSelectedUser, getUsers } = useChatStore.getState();

          const found = users.find((u) => u._id === targetUserId);
          if (found) {
            setSelectedUser(found);
          } else {
            getUsers().then(() => {
              const updatedUsers = useChatStore.getState().users;
              const refreshedUser = updatedUsers.find((u) => u._id === targetUserId);
              if (refreshedUser) {
                setSelectedUser(refreshedUser);
              }
            });
          }
        }
      });
    }

    if (currentPermission === "granted") {
      try {
        const sub = await getExistingSubscription();
        if (sub) {
          set({ isSubscribed: true });
          // Ensure subscription is synchronized on backend
          axiosInstance
            .post("/notifications/subscribe", {
              subscription: sub.toJSON(),
              userAgent: navigator.userAgent,
            })
            .catch(() => {});
        } else {
          set({ isSubscribed: false });
        }
      } catch (error) {
        console.error("Failed to check push subscription status:", error);
      }
    }
  },

  subscribe: async () => {
    const { isSupported } = get();
    if (!isSupported) {
      toast.error("Push notifications are not supported by this browser.");
      return false;
    }

    set({ isLoading: true });
    try {
      // 1. Request user permission
      const perm = await Notification.requestPermission();
      set({ permission: perm });

      if (perm === "denied") {
        toast.error(
          "Notifications blocked. Please allow notifications in your browser site settings."
        );
        return false;
      }

      if (perm !== "granted") {
        toast.error("Notification permission was not granted.");
        return false;
      }

      // 2. Fetch server VAPID public key
      const keyRes = await axiosInstance.get("/notifications/vapid-key");
      const vapidPublicKey = keyRes.data.publicKey;

      // 3. Subscribe with browser PushManager
      const subscription = await subscribeUserToPush(vapidPublicKey);

      // 4. Save subscription on backend
      await axiosInstance.post("/notifications/subscribe", {
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
      });

      set({ isSubscribed: true });
      toast.success("Push notifications enabled successfully!");
      return true;
    } catch (error) {
      console.error("Push subscription error:", error);
      toast.error(
        error.response?.data?.error ||
          error.message ||
          "Failed to enable push notifications"
      );
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  unsubscribe: async () => {
    set({ isLoading: true });
    try {
      const sub = await getExistingSubscription();
      const endpoint = sub?.endpoint;

      await unsubscribeUserFromPush();

      if (endpoint) {
        await axiosInstance.post("/notifications/unsubscribe", { endpoint });
      }

      set({ isSubscribed: false });
      toast.success("Push notifications disabled");
      return true;
    } catch (error) {
      console.error("Push unsubscription error:", error);
      toast.error("Failed to disable push notifications");
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  sendTestNotification: async () => {
    set({ isTesting: true });
    try {
      await axiosInstance.post("/notifications/test");
      toast.success("Test notification sent! Check your screen for the popup.");
    } catch (error) {
      console.error("Test notification error:", error);
      toast.error(
        error.response?.data?.error || "Failed to send test notification"
      );
    } finally {
      set({ isTesting: false });
    }
  },
}));
