// Helper functions for Web Push and Service Worker management

export function isPushNotificationSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

export async function getExistingSubscription() {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Error retrieving existing push subscription:", error);
    return null;
  }
}

export async function subscribeUserToPush(vapidPublicKey) {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported by your browser");
  }

  const registration = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}

export async function unsubscribeUserFromPush() {
  if (!isPushNotificationSupported()) return true;

  try {
    const subscription = await getExistingSubscription();
    if (subscription) {
      return await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}
