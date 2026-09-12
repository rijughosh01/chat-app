import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import {
  Search,
  X,
  CheckCheck,
  Camera,
  Mic,
  Smile,
  Sparkles,
  MessageSquareDashed,
} from "lucide-react";
import { formatSidebarTime, formatLastSeen } from "../lib/utils";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

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

  const onlineContacts = users.filter(
    (u) => u.showOnlineStatus !== false && onlineUsers.includes(u._id)
  );

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
    <aside className="h-full w-full border-r border-base-content/10 flex flex-col bg-base-100/70 select-none overflow-hidden">
      {/* Sidebar Top Header */}
      <div className="p-3.5 sm:p-4 border-b border-base-content/10 space-y-3 flex-shrink-0 bg-base-100/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              to="/profile"
              className="relative group cursor-pointer flex-shrink-0"
              title={`${authUser?.fullName || "You"} (Click to edit profile)`}
            >
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={authUser?.fullName || "Your Profile"}
                className="size-9 sm:size-10 rounded-2xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-500 group-hover:scale-105 transition-all shadow-xs"
              />
              <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-base-100" />
            </Link>
            <div>
              <h2 className="font-bold text-lg leading-tight tracking-tight text-base-content flex items-center gap-1.5">
                <span>Chats</span>
                {totalUnread > 0 && (
                  <span className="badge badge-sm bg-emerald-500 text-white font-bold border-none text-[10px] px-1.5 h-4.5">
                    {totalUnread}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-base-content/50 font-medium">
                {users.length} {users.length === 1 ? "conversation" : "conversations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {onlineContacts.length} online
            </span>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-base-content/40">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-base-200/70 hover:bg-base-200/90 focus:bg-base-100 rounded-xl border border-transparent focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none placeholder:text-base-content/40 text-base-content shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-base-content/40 hover:text-base-content active:scale-90 transition-transform"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs (All / Unread / Online) */}
        <div className="flex items-center gap-1.5 text-xs pt-0.5">
          <button
            type="button"
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1 rounded-full font-semibold transition-all active:scale-95 ${
              filterTab === "all"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                : "bg-base-200/80 hover:bg-base-200 text-base-content/70 hover:text-base-content"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("unread")}
            className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
              filterTab === "unread"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                : "bg-base-200/80 hover:bg-base-200 text-base-content/70 hover:text-base-content"
            }`}
          >
            <span>Unread</span>
            {totalUnread > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
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
            className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center gap-1.5 active:scale-95 ${
              filterTab === "online"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                : "bg-base-200/80 hover:bg-base-200 text-base-content/70 hover:text-base-content"
            }`}
          >
            <span>Online</span>
            {onlineContacts.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterTab === "online"
                    ? "bg-white text-emerald-700"
                    : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {onlineContacts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* "Active Now" Horizontal Avatar Reel */}
      {onlineContacts.length > 0 && !searchQuery && filterTab !== "unread" && (
        <div className="py-2.5 px-3 border-b border-base-content/5 bg-base-100/40 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
              Active Now
            </span>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 px-1">
            {onlineContacts.map((contact) => (
              <button
                key={contact._id}
                type="button"
                onClick={() => setSelectedUser(contact)}
                className="flex flex-col items-center gap-1 group flex-shrink-0 cursor-pointer active:scale-95 transition-all"
                title={`Chat with ${contact.fullName}`}
              >
                <div className="relative">
                  <div className="p-0.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 group-hover:shadow-md group-hover:shadow-emerald-500/30 transition-all">
                    {contact.profilePic ? (
                      <img
                        src={contact.profilePic}
                        alt={contact.fullName}
                        className="size-10 sm:size-11 rounded-[14px] object-cover bg-base-100"
                      />
                    ) : (
                      <div className="size-10 sm:size-11 rounded-[14px] bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs">
                        {getInitials(contact.fullName)}
                      </div>
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-base-100 shadow-xs" />
                </div>
                <span className="text-[11px] font-medium text-base-content/80 group-hover:text-emerald-500 max-w-[56px] truncate text-center">
                  {contact.fullName.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Users & Conversations List */}
      <div className="overflow-y-auto w-full py-1.5 px-2 space-y-1 flex-1 no-scrollbar">
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
                w-full p-2.5 sm:p-3 rounded-2xl flex items-center gap-3 transition-all duration-200 text-left cursor-pointer group
                ${
                  isSelected
                    ? "bg-emerald-500/15 dark:bg-emerald-500/20 text-base-content shadow-xs ring-1 ring-emerald-500/30 font-medium"
                    : "hover:bg-base-200/60 active:scale-[0.99]"
                }
              `}
            >
              {/* Avatar + Status */}
              <div className="relative flex-shrink-0">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.fullName}
                    className="size-11 sm:size-12 object-cover rounded-2xl ring-1 ring-base-content/10 shadow-xs group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                    {getInitials(user.fullName)}
                  </div>
                )}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-base-100 shadow-xs" />
                )}
              </div>

              {/* User Info & Message Snippet */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span
                    className={`text-sm truncate ${
                      hasUnread
                        ? "font-extrabold text-base-content"
                        : "font-semibold text-base-content/90"
                    }`}
                  >
                    {user.fullName}
                  </span>
                  {user.lastMessage?.createdAt && (
                    <span
                      className={`text-[11px] flex-shrink-0 font-medium ${
                        hasUnread
                          ? "text-emerald-600 dark:text-emerald-400 font-bold"
                          : "text-base-content/50"
                      }`}
                    >
                      {formatSidebarTime(user.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs truncate flex items-center gap-1 ${
                      hasUnread
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-base-content/60"
                    }`}
                  >
                    {user.lastMessage?.senderId === authUser?._id && (
                      <CheckCheck className="size-3.5 text-base-content/50 inline mr-0.5 flex-shrink-0" />
                    )}
                    {user.lastMessage ? (
                      user.lastMessage.image && !user.lastMessage.text ? (
                        <span className="flex items-center gap-1">
                          <Camera className="size-3.5 text-emerald-500 inline" />
                          <span>Photo</span>
                        </span>
                      ) : user.lastMessage.audio && !user.lastMessage.text ? (
                        <span className="flex items-center gap-1">
                          <Mic className="size-3.5 text-emerald-500 inline" />
                          <span>
                            Voice note
                            {user.lastMessage.audioDuration
                              ? ` (${Math.round(user.lastMessage.audioDuration)}s)`
                              : ""}
                          </span>
                        </span>
                      ) : user.lastMessage.sticker ? (
                        <span className="flex items-center gap-1">
                          <Smile className="size-3.5 text-emerald-500 inline" />
                          <span>Sticker</span>
                        </span>
                      ) : (
                        <span className="truncate">{user.lastMessage.text}</span>
                      )
                    ) : (
                      <span className="italic text-base-content/40 truncate">
                        {isOnline
                          ? "Online now"
                          : user.showOnlineStatus !== false && user.lastSeen
                          ? formatLastSeen(user.lastSeen)
                          : "Tap to message"}
                      </span>
                    )}
                  </p>

                  {/* Unread Counter Badge */}
                  {hasUnread && !isSelected && (
                    <span className="badge bg-emerald-600 text-white border-none badge-xs py-1.5 px-2 text-[10px] font-bold shadow-xs">
                      {user.unreadCount > 99 ? "99+" : user.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 text-base-content/50 space-y-2">
            <div className="size-12 rounded-2xl bg-base-200/80 flex items-center justify-center text-base-content/40">
              <MessageSquareDashed className="size-6" />
            </div>
            <p className="text-sm font-semibold text-base-content/70">
              {searchQuery ? `No results for "${searchQuery}"` : "No conversations yet"}
            </p>
            <p className="text-xs text-base-content/40 max-w-[200px]">
              {searchQuery
                ? "Try searching for a different name"
                : "Your chat contacts will appear here once connected"}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;