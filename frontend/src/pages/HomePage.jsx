import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { Bell, X, Loader2 } from "lucide-react";

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
      className={`h-[100dvh] bg-base-200/50 flex flex-col ${
        selectedUser ? "pt-0 md:pt-16" : "pt-16"
      } overflow-hidden`}
    >
      {/* Push Notifications Opt-In Banner (Only when supported and permission is undecided) */}
      {isSupported && permission === "default" && !bannerDismissed && (
        <div className="bg-gradient-to-r from-primary/15 via-primary/10 to-base-100 border-b border-primary/20 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary shrink-0">
              <Bell className="size-3.5 sm:size-4" />
            </div>
            <p className="truncate text-base-content/90 text-[11px] sm:text-xs">
              <span className="font-semibold text-primary">Never miss a message:</span> Enable desktop alerts when NexChat is minimized or in the background.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={subscribeToPush}
              disabled={isNotificationLoading}
              className="btn btn-xs btn-primary rounded-lg font-medium shadow-xs gap-1"
            >
              {isNotificationLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "Turn On"
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

      <div className="flex-1 flex items-center justify-center p-0 md:p-2 lg:p-4 overflow-hidden w-full h-full">
        <div className="bg-base-100 rounded-none md:rounded-2xl border-0 md:border border-base-300 shadow-none md:shadow-2xl w-full max-w-[1600px] h-full overflow-hidden flex">
          {/* Sidebar: full width on mobile when no chat selected; fixed width on desktop */}
          <div
            className={`
              ${selectedUser ? "hidden md:flex" : "flex"}
              w-full md:w-80 lg:w-[360px] flex-shrink-0 h-full
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
      </div>
    </div>
  );
};

export default HomePage;