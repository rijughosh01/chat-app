import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useStatusStore } from "../store/useStatusStore";
import { MessagesSquare, CircleDashed, Users, Palette } from "lucide-react";

const MobileBottomNav = () => {
  const { authUser, onlineUsers } = useAuthStore();
  const { selectedUser, setSelectedUser, users } = useChatStore();
  const { otherUserStatuses } = useStatusStore();
  const location = useLocation();

  if (!authUser) return null;

  // Auto-hide when inside an active conversation on mobile to give 100% screen to chat
  const isInsideChat = location.pathname === "/" && Boolean(selectedUser);

  const totalUnread = users.reduce((acc, u) => acc + (u.unreadCount || 0), 0);
  const unviewedStatusCount = otherUserStatuses.filter((s) => s.hasUnviewed).length;
  const onlineCount = users.filter(
    (u) => u.showOnlineStatus !== false && onlineUsers.includes(u._id)
  ).length;

  const currentPath = location.pathname;
  const isChatsActive =
    currentPath === "/" &&
    !selectedUser &&
    !location.search.includes("filter=online") &&
    !location.search.includes("tab=status");
  const isStatusActive =
    currentPath === "/" &&
    !selectedUser &&
    location.search.includes("tab=status");
  const isOnlineActive =
    currentPath === "/" &&
    !selectedUser &&
    location.search.includes("filter=online");

  return (
    <nav
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-40
        transition-all duration-300 ease-out
        ${isInsideChat ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}
        bg-base-100/90 backdrop-blur-2xl border-t border-base-content/10 mobile-nav-shadow
        safe-pb
      `}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 pt-1.5 pb-1">
        {/* Chats Tab */}
        <Link
          to="/"
          onClick={() => setSelectedUser(null)}
          className={`
            flex flex-col items-center justify-center flex-1 py-1 rounded-2xl relative transition-all active:scale-95 cursor-pointer
            ${isChatsActive ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-base-content/60 hover:text-base-content font-medium"}
          `}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-xl transition-all ${
                isChatsActive ? "bg-emerald-500/15" : ""
              }`}
            >
              <MessagesSquare className="size-5" />
            </div>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-white font-extrabold text-[10px] min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center shadow-xs">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Chats</span>
        </Link>

        {/* Status Tab */}
        <Link
          to="/?tab=status"
          onClick={() => setSelectedUser(null)}
          className={`
            flex flex-col items-center justify-center flex-1 py-1 rounded-2xl relative transition-all active:scale-95 cursor-pointer
            ${isStatusActive ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-base-content/60 hover:text-base-content font-medium"}
          `}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-xl transition-all ${
                isStatusActive ? "bg-emerald-500/15" : ""
              }`}
            >
              <CircleDashed className="size-5" />
            </div>
            {unviewedStatusCount > 0 && (
              <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-base-100" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Status</span>
        </Link>

        {/* Online Contacts Tab */}
        <Link
          to="/?filter=online"
          onClick={() => setSelectedUser(null)}
          className={`
            flex flex-col items-center justify-center flex-1 py-1 rounded-2xl relative transition-all active:scale-95 cursor-pointer
            ${isOnlineActive ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-base-content/60 hover:text-base-content font-medium"}
          `}
        >
          <div className="relative">
            <div
              className={`p-1 rounded-xl transition-all ${
                isOnlineActive ? "bg-emerald-500/15" : ""
              }`}
            >
              <Users className="size-5" />
            </div>
            {onlineCount > 0 && (
              <span className="absolute -top-0.5 -right-1 size-2.5 rounded-full bg-emerald-500 ring-2 ring-base-100 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Online</span>
        </Link>

        {/* Themes & Wallpaper Tab */}
        <Link
          to="/settings"
          className={`
            flex flex-col items-center justify-center flex-1 py-1 rounded-2xl relative transition-all active:scale-95 cursor-pointer
            ${currentPath === "/settings" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-base-content/60 hover:text-base-content font-medium"}
          `}
        >
          <div
            className={`p-1 rounded-xl transition-all ${
              currentPath === "/settings" ? "bg-emerald-500/15" : ""
            }`}
          >
            <Palette className="size-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Themes</span>
        </Link>

        {/* Profile Tab */}
        <Link
          to="/profile"
          className={`
            flex flex-col items-center justify-center flex-1 py-1 rounded-2xl relative transition-all active:scale-95 cursor-pointer
            ${currentPath === "/profile" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-base-content/60 hover:text-base-content font-medium"}
          `}
        >
          <div className="relative flex items-center justify-center">
            <div
              className={`size-6 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 transition-all ${
                currentPath === "/profile"
                  ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-base-100"
                  : "ring-1 ring-base-content/20"
              }`}
            >
              {authUser?.profilePic ? (
                <img
                  src={authUser.profilePic}
                  alt={authUser.fullName || "Profile"}
                  className="w-full h-full object-cover rounded-full flex-shrink-0"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-[9px]">
                  {authUser?.fullName ? authUser.fullName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 size-2 bg-emerald-500 rounded-full ring-1 ring-base-100" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
