import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, X, CheckCheck } from "lucide-react";
import { formatSidebarTime, formatLastSeen } from "../lib/utils";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'unread' | 'online'
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const totalUnread = users.reduce((acc, u) => acc + (u.unreadCount || 0), 0);

  const onlineCount = users.filter(
    (u) => u.showOnlineStatus !== false && onlineUsers.includes(u._id)
  ).length;

  const filteredUsers = users.filter((user) => {
    let matchesTab = true;
    const isUserOnline =
      user.showOnlineStatus !== false && onlineUsers.includes(user._id);

    if (filterTab === "unread") {
      matchesTab = (user.unreadCount || 0) > 0;
    } else if (filterTab === "online") {
      matchesTab = isUserOnline;
    }

    const matchesSearch = searchQuery.trim()
      ? user.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim())
      : true;

    return matchesTab && matchesSearch;
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-full border-r border-base-300 flex flex-col bg-base-100/60 select-none">
      {/* Header & Search */}
      <div className="border-b border-base-300/80 w-full p-3.5 space-y-2.5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-base-content">
              Chats
            </span>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-block bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
            {onlineCount > 0 ? `${onlineCount} online` : "offline"}
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-4 text-base-content/40" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-sm bg-base-200/80 border-transparent focus:border-emerald-500/50 rounded-lg w-full pl-9 pr-8 text-base sm:text-xs focus:outline-none placeholder:text-base-content/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-base-content/40 hover:text-base-content"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* WhatsApp Web Filter Chips */}
        <div className="flex items-center gap-1.5 pt-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              filterTab === "all"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-base-200/80 hover:bg-base-300/70 text-base-content/70"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("unread")}
            className={`px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 ${
              filterTab === "unread"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-base-200/80 hover:bg-base-300/70 text-base-content/70"
            }`}
          >
            <span>Unread</span>
            {totalUnread > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === "unread"
                    ? "bg-white text-emerald-700"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {totalUnread}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("online")}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              filterTab === "online"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-base-200/80 hover:bg-base-300/70 text-base-content/70"
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="overflow-y-auto w-full py-1 divide-y divide-base-300/40 flex-1">
        {filteredUsers.map((user) => {
          const isSelected = selectedUser?._id === user._id;
          const isOnline =
            user.showOnlineStatus !== false && onlineUsers.includes(user._id);
          const hasUnread = (user.unreadCount || 0) > 0;

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3 transition-colors text-left
                hover:bg-base-200/60
                ${isSelected ? "bg-base-200/90 border-l-4 border-emerald-500" : ""}
              `}
            >
              {/* Avatar + Status */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.fullName}
                  className="size-12 object-cover rounded-full border border-base-300 shadow-sm"
                />
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-emerald-500 
                    rounded-full ring-2 ring-base-100"
                  />
                )}
              </div>

              {/* User info & Last message snippet */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`font-medium truncate text-sm ${
                      hasUnread ? "font-bold text-base-content" : "text-base-content/90"
                    }`}
                  >
                    {user.fullName}
                  </span>
                  {user.lastMessage?.createdAt && (
                    <span className="text-[11px] text-base-content/50 flex-shrink-0">
                      {formatSidebarTime(user.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs truncate flex items-center ${
                      hasUnread
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-base-content/60"
                    }`}
                  >
                    {user.lastMessage?.senderId === authUser?._id && (
                      <CheckCheck className="size-3.5 text-base-content/50 inline mr-1 flex-shrink-0" />
                    )}
                    {user.lastMessage ? (
                      user.lastMessage.image && !user.lastMessage.text ? (
                        <span>📷 Photo</span>
                      ) : user.lastMessage.audio && !user.lastMessage.text ? (
                        <span>
                          🎙️ Voice message
                          {user.lastMessage.audioDuration
                            ? ` (${Math.round(user.lastMessage.audioDuration)}s)`
                            : ""}
                        </span>
                      ) : user.lastMessage.sticker ? (
                        <span>💟 Sticker</span>
                      ) : (
                        <span className="truncate">{user.lastMessage.text}</span>
                      )
                    ) : (
                      <span className="italic opacity-60 truncate">
                        {isOnline
                          ? "Online"
                          : user.showOnlineStatus !== false && user.lastSeen
                          ? formatLastSeen(user.lastSeen)
                          : "Offline"}
                      </span>
                    )}
                  </p>

                  {/* Unread Counter Badge */}
                  {hasUnread && !isSelected && (
                    <span className="badge bg-emerald-500 text-white border-none badge-xs py-2 px-1.5 text-[10px] font-bold">
                      {user.unreadCount > 99 ? "99+" : user.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-base-content/50 py-8 px-4 text-sm">
            {searchQuery
              ? `No contacts matching "${searchQuery}"`
              : "No contacts to show"}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;