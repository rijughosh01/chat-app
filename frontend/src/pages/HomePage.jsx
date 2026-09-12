import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { Bell, X, Loader2, Sparkles } from "lucide-react";

const HomePage = () => {
  const {
    selectedUser,
    users,
    setSelectedUser,
    getUsers,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { socket } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    isSupported,
    permission,
    bannerDismissed,
    isLoading: isNotificationLoading,
    subscribe: subscribeToPush,
    dismissBanner,
  } = useNotificationStore();

  useEffect(() => {
    if (socket) {
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [socket, subscribeToMessages, unsubscribeFromMessages]);

  // Handle deep link or notification click targeting a specific user: ?chatWith=<userId>
  useEffect(() => {
    const chatWithId = searchParams.get("chatWith");
    if (!chatWithId) return;

    if (users.length === 0) {
      getUsers();
      return;
    }

    const foundUser = users.find((u) => u._id === chatWithId);
    if (foundUser) {
      setSelectedUser(foundUser);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, users, setSelectedUser, setSearchParams, getUsers]);

  return (
    <div
      className={`h-[100dvh] bg-base-200/40 flex flex-col ${
        selectedUser ? "pt-0 md:pt-16" : "pt-14 sm:pt-16"
      } overflow-hidden`}
    >
      {/* Push Notifications Opt-In Banner */}
      {isSupported && permission === "default" && !bannerDismissed && (
        <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-base-100 border-b border-emerald-500/20 px-3 sm:px-5 py-2 flex items-center justify-between gap-3 text-xs flex-shrink-0 animate-fadeIn z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Bell className="size-3.5 sm:size-4 animate-live-pulse" />
            </div>
            <p className="truncate text-base-content/90 text-[11px] sm:text-xs">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Desktop Notifications:</span> Enable instant alerts when NexChat is in the background.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={subscribeToPush}
              disabled={isNotificationLoading}
              className="btn btn-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-full font-medium shadow-xs gap-1.5 px-3 active:scale-95 transition-all"
            >
              {isNotificationLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <Sparkles className="size-3" />
                  <span>Enable</span>
                </>
              )}
            </button>
            <button
              onClick={dismissBanner}
              className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-base-content"
              title="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main App Canvas */}
      <main className="flex-1 flex items-center justify-center p-0 md:p-3 lg:p-4 overflow-hidden w-full h-full">
        <div className="bg-base-100 rounded-none md:rounded-3xl border-0 md:border border-base-content/10 shadow-none md:shadow-2xl md:ring-1 md:ring-base-content/5 w-full max-w-[1600px] h-full overflow-hidden flex">
          {/* Sidebar: full width on mobile when no chat selected; fixed width on desktop */}
          <div
            className={`
              ${selectedUser ? "hidden md:flex" : "flex"}
              w-full md:w-80 lg:w-[380px] flex-shrink-0 h-full
            `}
          >
            <Sidebar />
          </div>

          {/* Chat Container: full width on mobile when chat selected; flex-1 on desktop */}
          <div
            className={`
              ${!selectedUser ? "hidden md:flex" : "flex"}
              flex-1 h-full min-w-0
            `}
          >
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;