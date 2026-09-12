import { X, Phone, Video, Search, ArrowLeft, Paintbrush, Check, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore, WALLPAPER_OPTIONS } from "../store/useThemeStore";
import { formatLastSeen } from "../lib/utils";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, typingUsers } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { wallpaper, setWallpaper, wallpaperDoodle, toggleWallpaperDoodle } =
    useThemeStore();

  const canShowStatus = selectedUser?.showOnlineStatus !== false;
  const isOnline = canShowStatus && onlineUsers.includes(selectedUser?._id);
  const isTyping = Boolean(selectedUser?._id && typingUsers.includes(selectedUser._id));

  return (
    <div className="px-3 sm:px-4 py-2.5 border-b border-base-content/10 bg-base-100/90 backdrop-blur-xl flex items-center justify-between z-20 flex-shrink-0 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* WhatsApp Mobile Back Button */}
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="md:hidden size-9 -ml-1 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/80 active:scale-90 transition-all cursor-pointer flex-shrink-0"
          title="Back to chats"
        >
          <ArrowLeft size={20} className="stroke-[2.5]" />
        </button>

        {/* Avatar with live online dot */}
        <div className="relative flex-shrink-0">
          {selectedUser?.profilePic ? (
            <img
              src={selectedUser.profilePic}
              alt={selectedUser.fullName}
              className="size-9 sm:size-10 rounded-2xl object-cover ring-1 ring-base-content/10 shadow-xs"
            />
          ) : (
            <div className="size-9 sm:size-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {getInitials(selectedUser?.fullName)}
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-2.5 sm:size-3 bg-emerald-500 rounded-full ring-2 ring-base-100 shadow-xs" />
          )}
        </div>

        {/* User Details & Live Typing Indicator */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-bold text-sm sm:text-base leading-tight text-base-content truncate">
            {selectedUser?.fullName}
          </h3>
          <div className="text-[11px] sm:text-xs truncate flex items-center gap-1.5 min-h-[16px]">
            {isTyping ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>typing</span>
                <span className="inline-flex items-center gap-0.5 pt-0.5">
                  <span className="size-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="size-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </span>
            ) : isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                online
              </span>
            ) : canShowStatus && selectedUser?.lastSeen ? (
              <span className="text-base-content/55 font-medium">
                {formatLastSeen(selectedUser.lastSeen)}
              </span>
            ) : (
              <span className="text-base-content/40 font-medium">offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-0.5 sm:gap-1 text-base-content/70 flex-shrink-0">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-emerald-600 hover:bg-emerald-500/10 active:scale-90 transition-all"
          title="Voice Call"
        >
          <Phone size={17} />
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-emerald-600 hover:bg-emerald-500/10 active:scale-90 transition-all"
          title="Video Call"
        >
          <Video size={18} />
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content hover:bg-base-200/80 active:scale-90 transition-all"
          title="Search in chat"
        >
          <Search size={17} />
        </button>

        {/* Wallpaper Customizer Dropdown */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-emerald-600 hover:bg-emerald-500/10 active:scale-90 transition-all"
            title="Chat Wallpaper & Style"
          >
            <Paintbrush size={17} />
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-50 menu p-3 shadow-2xl bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl w-64 text-xs space-y-2.5 mt-2"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-base-content/10">
              <span className="font-bold text-sm text-base-content">
                Chat Wallpaper
              </span>
              <span className="badge badge-xs bg-emerald-500 text-white font-bold px-2 py-0.5">
                <Sparkles className="size-2.5 mr-0.5 inline" /> Theme
              </span>
            </div>

            <div className="space-y-1">
              {WALLPAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWallpaper(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left font-medium transition-all ${
                    wallpaper === opt.id
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "hover:bg-base-200 text-base-content/80 hover:text-base-content"
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {wallpaper === opt.id && <Check size={14} className="stroke-[2.5]" />}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-base-content/10 flex items-center justify-between">
              <span className="text-base-content/70 font-medium">Doodle Pattern</span>
              <input
                type="checkbox"
                className="toggle toggle-xs toggle-success cursor-pointer"
                checked={wallpaperDoodle}
                onChange={(e) => toggleWallpaperDoodle(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="hidden md:inline-flex btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content active:scale-90 transition-all"
          onClick={() => setSelectedUser(null)}
          title="Close chat"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
