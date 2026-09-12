import { create } from "zustand";
import toast from "react-hot-toast";

const checkIsStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
};

const getDevicePlatform = () => {
  if (typeof window === "undefined") return "unknown";
  const userAgent = window.navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/Mac/i.test(userAgent)) return "mac";
  if (/Win/i.test(userAgent)) return "windows";
  if (/Linux/i.test(userAgent)) return "linux";
  return "desktop";
};

export const usePwaStore = create((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  wasOffline: false,
  isReconnected: false,
  isStandalone: checkIsStandalone(),
  isInstalled: checkIsStandalone(),
  canInstall: false,
  installPrompt: null,
  platform: getDevicePlatform(),
  isCheckingConnection: false,
  initialized: false,

  init: () => {
    if (get().initialized || typeof window === "undefined") return;

    // 1. Initial standalone check
    const standalone = checkIsStandalone();
    set({
      isStandalone: standalone,
      isInstalled: standalone,
      isOnline: navigator.onLine,
      platform: getDevicePlatform(),
      initialized: true,
    });

    // Register Service Worker for PWA shell caching & installability criteria
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("PWA Service Worker registration notice:", err);
        });
    }

    // 2. Listen to standalone mode changes
    try {
      const displayModeQuery = window.matchMedia("(display-mode: standalone)");
      const handleDisplayModeChange = (e) => {
        set({ isStandalone: e.matches, isInstalled: e.matches });
      };
      if (displayModeQuery.addEventListener) {
        displayModeQuery.addEventListener("change", handleDisplayModeChange);
      } else if (displayModeQuery.addListener) {
        displayModeQuery.addListener(handleDisplayModeChange);
      }
    } catch (e) {
      console.warn("Display mode media query not supported:", e);
    }

    // 3. Network online/offline event listeners
    const handleOnline = () => {
      const hadBeenOffline = !get().isOnline || get().wasOffline;
      set({ isOnline: true, isReconnected: hadBeenOffline });

      if (hadBeenOffline) {
        setTimeout(() => {
          set({ isReconnected: false });
        }, 3500);
      }
    };

    const handleOffline = () => {
      set({ isOnline: false, wasOffline: true, isReconnected: false });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 4. PWA beforeinstallprompt capture
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar on mobile
      e.preventDefault();
      // Stash event for trigger via custom UI
      set({ installPrompt: e, canInstall: true });
    };

    // 5. App installed confirmation
    const handleAppInstalled = () => {
      set({
        isInstalled: true,
        canInstall: false,
        installPrompt: null,
        isStandalone: true,
      });
      toast.success("NexChat installed successfully! Launch it anytime from your home screen or apps.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
  },

  checkConnection: async () => {
    set({ isCheckingConnection: true });
    try {
      // Fetch small static asset with cache bust
      const response = await fetch("/manifest.json?check=" + Date.now(), {
        method: "HEAD",
        cache: "no-store",
      });

      if (response.ok) {
        const hadBeenOffline = !get().isOnline || get().wasOffline;
        set({ isOnline: true, isReconnected: hadBeenOffline, isCheckingConnection: false });
        if (hadBeenOffline) {
          toast.success("Connection restored!");
          setTimeout(() => set({ isReconnected: false }), 3500);
        }
        return true;
      } else {
        set({ isOnline: false, isCheckingConnection: false });
        toast.error("Still unable to reach server. Please check your network.");
        return false;
      }
    } catch {
      set({ isOnline: false, isCheckingConnection: false });
      toast.error("Still offline. Please check your internet connection.");
      return false;
    }
  },

  installApp: async () => {
    const { installPrompt, platform } = get();

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome === "accepted") {
          set({ canInstall: false, installPrompt: null, isInstalled: true });
          return true;
        } else {
          return false;
        }
      } catch (err) {
        console.error("PWA install error:", err);
        return false;
      }
    }

    // Friendly platform-specific instructions if beforeinstallprompt is unavailable
    if (platform === "ios") {
      toast(
        "To install on iOS: Tap the Share icon in Safari, then select 'Add to Home Screen'.",
        { duration: 6000, icon: "📱" }
      );
      return false;
    }

    if (platform === "desktop" || platform === "windows" || platform === "mac") {
      toast(
        "To install NexChat, click the install icon in your browser address bar (top right).",
        { duration: 5000, icon: "💻" }
      );
      return false;
    }

    toast("To install, use your browser's menu and select 'Install app' or 'Add to Home Screen'.", {
      duration: 5000,
    });
    return false;
  },
}));
