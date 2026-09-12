import { THEMES } from "../constants";
import { useThemeStore, WALLPAPER_OPTIONS } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { usePwaStore } from "../store/usePwaStore";
import {
  Send,
  ShieldCheck,
  BellRing,
  AlertCircle,
  Loader2,
  Paintbrush,
  Check,
  AppWindow,
  Download,
  CheckCircle2,
  Wifi,
  WifiOff,
} from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingsPage = () => {
  const {
    theme,
    setTheme,
    wallpaper,
    setWallpaper,
    wallpaperDoodle,
    toggleWallpaperDoodle,
  } = useThemeStore();
  const { authUser, updatePrivacySettings } = useAuthStore();

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading: isNotificationLoading,
    isTesting: isNotificationTesting,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
    sendTestNotification,
  } = useNotificationStore();

  const {
    isOnline,
    isStandalone,
    canInstall,
    isInstalled,
    installApp,
    platform,
  } = usePwaStore();


  return (
    <div className="min-h-[100dvh] w-full container mx-auto px-4 pt-20 pb-24 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">
            Choose a theme for your chat interface
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all
                ${theme === t ? "bg-base-200 ring-2 ring-primary shadow-sm" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div
                className="relative h-8 w-full rounded-md overflow-hidden shadow-xs border border-base-content/10"
                data-theme={t}
              >
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1 bg-base-100">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* Chat Wallpaper & WhatsApp Doodle Settings */}
        <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Paintbrush className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-base-content">
                  Chat Wallpaper & Background
                </h3>
                <p className="text-xs text-base-content/60">
                  Select your preferred WhatsApp chat wallpaper pattern and style
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-base-content/80">
                <span>WhatsApp Doodles</span>
                <input
                  type="checkbox"
                  className="toggle toggle-success toggle-sm cursor-pointer"
                  checked={wallpaperDoodle}
                  onChange={(e) => toggleWallpaperDoodle(e.target.checked)}
                />
              </label>
            </div>
          </div>

          <div className="divider my-0"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {WALLPAPER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWallpaper(opt.id)}
                className={`
                  p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between h-24 cursor-pointer
                  ${
                    wallpaper === opt.id
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5 shadow-xs"
                      : "border-base-300 hover:border-base-content/20 hover:bg-base-200/50"
                  }
                `}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-base-content">
                      {opt.name}
                    </span>
                    {wallpaper === opt.id && (
                      <span className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check size={11} className="stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-base-content/60 line-clamp-2 mt-1">
                    {opt.description}
                  </p>
                </div>

                <div
                  className={`h-4 w-full rounded-md border border-base-content/10 ${
                    opt.id === "whatsapp-midnight"
                      ? "wa-wallpaper-midnight"
                      : opt.id === "theme-matched"
                      ? "wa-wallpaper-theme"
                      : opt.id === "minimal"
                      ? "wa-wallpaper-minimal bg-base-200"
                      : "wa-wallpaper-classic"
                  } ${!wallpaperDoodle ? "wa-no-doodle" : ""}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Privacy & Online Status Settings */}
        {authUser && (
          <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-base-content">
                  Privacy & Status
                </h3>
                <p className="text-xs text-base-content/60">
                  Control who can see your online presence and last seen timestamp
                </p>
              </div>
            </div>

            <div className="divider my-0"></div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div className="space-y-1 max-w-md">
                <label
                  htmlFor="online-status-toggle"
                  className="text-sm font-medium text-base-content cursor-pointer flex items-center gap-2"
                >
                  <span>Show Online & Last Seen Status</span>
                  <span
                    className={`badge badge-xs font-semibold ${
                      authUser.showOnlineStatus !== false
                        ? "badge-success text-white"
                        : "badge-ghost"
                    }`}
                  >
                    {authUser.showOnlineStatus !== false ? "Visible" : "Hidden"}
                  </span>
                </label>
                <p className="text-xs text-base-content/50 leading-relaxed">
                  When turned off, contacts cannot see when you are online or your last seen time.
                </p>
              </div>

              <input
                id="online-status-toggle"
                type="checkbox"
                className="toggle toggle-success toggle-md cursor-pointer"
                checked={authUser.showOnlineStatus !== false}
                onChange={(e) =>
                  updatePrivacySettings({ showOnlineStatus: e.target.checked })
                }
              />
            </div>
          </div>
        )}

        {/* Push Notifications Settings */}
        {authUser && (
          <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <BellRing className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-base-content">
                    Push Notifications
                  </h3>
                  <p className="text-xs text-base-content/60">
                    Receive desktop and mobile alerts even when NexChat is minimized or in the background
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isSupported ? (
                  <span className="badge badge-warning badge-sm font-medium">
                    Unsupported
                  </span>
                ) : permission === "denied" ? (
                  <span className="badge badge-error badge-sm font-medium text-white">
                    Blocked in Browser
                  </span>
                ) : isSubscribed ? (
                  <span className="badge badge-success badge-sm font-medium text-white">
                    Active & Alerting
                  </span>
                ) : (
                  <span className="badge badge-ghost badge-sm font-medium">
                    Disabled
                  </span>
                )}
              </div>
            </div>

            <div className="divider my-0"></div>

            {!isSupported ? (
              <div className="alert alert-warning text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>
                  Your current browser or environment does not support Service Worker push notifications.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="space-y-1 max-w-md">
                    <label
                      htmlFor="push-notifications-toggle"
                      className="text-sm font-medium text-base-content cursor-pointer flex items-center gap-2"
                    >
                      <span>Web Push Alerts</span>
                    </label>
                    <p className="text-xs text-base-content/50 leading-relaxed">
                      Sends real-time browser alerts when you receive text messages, photos, audio notes, or stickers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isNotificationLoading && (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    )}
                    <input
                      id="push-notifications-toggle"
                      type="checkbox"
                      disabled={isNotificationLoading || permission === "denied"}
                      className="toggle toggle-primary toggle-md cursor-pointer disabled:opacity-40"
                      checked={isSubscribed}
                      onChange={(e) => {
                        if (e.target.checked) {
                          subscribeToPush();
                        } else {
                          unsubscribeFromPush();
                        }
                      }}
                    />
                  </div>
                </div>

                {permission === "denied" && (
                  <div className="alert alert-error text-xs p-3 rounded-xl flex items-start gap-2 bg-error/10 text-error border-error/20">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold">Notifications are blocked</p>
                      <p className="text-error/80">
                        To receive alerts, click the site settings / lock icon in your browser URL bar and change Notifications to <strong>Allow</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {isSubscribed && (
                  <div className="flex items-center justify-between pt-2 border-t border-base-200">
                    <div className="text-xs text-base-content/60">
                      Want to verify your system alerts right now?
                    </div>
                    <button
                      type="button"
                      disabled={isNotificationTesting}
                      onClick={sendTestNotification}
                      className="btn btn-sm btn-outline btn-primary gap-1.5 text-xs rounded-xl"
                    >
                      {isNotificationTesting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Sending alert...</span>
                        </>
                      ) : (
                        <>
                          <BellRing className="size-3.5" />
                          <span>Send Test Notification</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progressive Web App (PWA) & Offline Access */}
        <div className="bg-base-100 rounded-2xl border border-base-300 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                <AppWindow className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-base-content">
                  Progressive Web App (PWA)
                </h3>
                <p className="text-xs text-base-content/60">
                  Install NexChat on your desktop or mobile device for a standalone window experience and offline fallback
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isStandalone ? (
                <span className="badge badge-success badge-sm font-medium text-white gap-1">
                  <CheckCircle2 className="size-3" /> Standalone App
                </span>
              ) : (
                <span className="badge badge-ghost badge-sm font-medium">
                  Browser Tab
                </span>
              )}
              {isOnline ? (
                <span className="badge badge-outline badge-success badge-sm font-medium gap-1">
                  <Wifi className="size-3" /> Online
                </span>
              ) : (
                <span className="badge badge-error badge-sm font-medium text-white gap-1">
                  <WifiOff className="size-3" /> Offline
                </span>
              )}
            </div>
          </div>

          <div className="divider my-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-2 text-xs text-base-content/70">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Standalone window:</strong> Runs borderless without browser address bar clutter.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>Instant launch:</strong> Static application shell is cached locally via Service Worker.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>App Icon & Shortcuts:</strong> WhatsApp-style green NexChat icon with quick actions.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              {isStandalone ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>NexChat is currently active in standalone app mode</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={installApp}
                  className="btn btn-secondary btn-sm rounded-xl gap-2 font-medium shadow-xs"
                >
                  <Download className="size-4" />
                  <span>Install NexChat App</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 space-y-3 min-h-[220px] max-h-[220px] overflow-y-auto transition-all duration-300 ${
                    wallpaper === "whatsapp-midnight"
                      ? "wa-wallpaper-midnight"
                      : wallpaper === "theme-matched"
                      ? "wa-wallpaper-theme"
                      : wallpaper === "minimal"
                      ? "wa-wallpaper-minimal bg-base-100"
                      : "wa-wallpaper-classic"
                  } ${!wallpaperDoodle ? "wa-no-doodle" : ""}`}
                >
                  <div className="flex justify-center my-1 select-none">
                    <span className="wa-date-pill px-3 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide uppercase shadow-xs">
                      TODAY
                    </span>
                  </div>

                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-3.5 py-2 shadow-xs
                          ${
                            message.isSent
                              ? "wa-bubble-outgoing rounded-tr-xs"
                              : "wa-bubble-incoming rounded-tl-xs"
                          }
                        `}
                      >
                        <p className="text-xs leading-relaxed">{message.content}</p>
                        <p className="text-[9px] mt-1 text-right opacity-60">
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
