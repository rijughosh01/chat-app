import { useState } from "react";
import { useLocation } from "react-router-dom";
import { usePwaStore } from "../store/usePwaStore";
import { useChatStore } from "../store/useChatStore";
import { WifiOff, Wifi, RefreshCw, Loader2, X } from "lucide-react";

const OfflineBanner = () => {
  const {
    isOnline,
    isReconnected,
    isCheckingConnection,
    checkConnection,
  } = usePwaStore();

  const { selectedUser } = useChatStore();
  const location = useLocation();
  const [dismissedForNow, setDismissedForNow] = useState(false);

  // If online and not recently reconnected, don't show anything
  if ((isOnline && !isReconnected) || (dismissedForNow && !isOnline)) {
    return null;
  }

  const isChatOpenOnMobile = location.pathname === "/" && Boolean(selectedUser);
  const topPosition = isChatOpenOnMobile ? "top-0" : "top-14 sm:top-16";

  return (
    <aside
      id="offline-banner"
      aria-label={isOnline ? "Network reconnected" : "Offline status warning"}
      role="status"
      className={`fixed ${topPosition} left-0 right-0 z-40 transition-all duration-300 ease-in-out shadow-md select-none`}
    >
      {!isOnline ? (
        <div className="bg-amber-500 dark:bg-amber-600 text-amber-950 dark:text-amber-50 border-b border-amber-600/30 px-3 py-2 sm:px-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1 rounded-md bg-amber-600/30 text-amber-950 dark:text-amber-100 shrink-0">
              <WifiOff className="size-3.5 sm:size-4 animate-pulse" />
            </div>
            <div className="truncate">
              <span className="font-bold">You are offline:</span>{" "}
              <span className="opacity-90 hidden sm:inline">
                NexChat is running in standalone offline mode. Cached chats remain accessible.
              </span>
              <span className="opacity-90 sm:hidden">
                Waiting for network connection...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={checkConnection}
              disabled={isCheckingConnection}
              className="btn btn-xs bg-amber-950/15 hover:bg-amber-950/25 dark:bg-amber-100/20 dark:hover:bg-amber-100/30 text-inherit border-none rounded-lg font-medium gap-1 transition-all"
              title="Check connection again"
            >
              {isCheckingConnection ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <RefreshCw className="size-3" />
              )}
              <span>Retry</span>
            </button>

            <button
              onClick={() => setDismissedForNow(true)}
              className="btn btn-xs btn-ghost btn-circle text-inherit opacity-60 hover:opacity-100"
              title="Dismiss warning"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-600 dark:bg-emerald-500 text-white border-b border-emerald-700 px-3 py-2 sm:px-4 flex items-center justify-center gap-2 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <Wifi className="size-4 shrink-0" />
          <span className="font-semibold">Back online!</span>
          <span className="opacity-90">Reconnected to NexChat servers.</span>
        </div>
      )}
    </aside>
  );
};

export default OfflineBanner;
