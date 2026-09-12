import { X, Phone, Video, Search, ArrowLeft, Paintbrush, Check } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore, WALLPAPER_OPTIONS } from "../store/useThemeStore";
import { formatLastSeen } from "../lib/utils";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { wallpaper, setWallpaper, wallpaperDoodle, toggleWallpaperDoodle } =
    useThemeStore();

  const canShowStatus = selectedUser?.showOnlineStatus !== false;
  const isOnline = canShowStatus && onlineUsers.includes(selectedUser?._id);


  return (
    <div className="px-3 sm:px-4 py-2.5 border-b border-base-300/80 bg-base-100/90 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* WhatsApp Mobile Back Button */}
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="md:hidden size-9 -ml-1.5 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/80 active:scale-90 transition-all cursor-pointer flex-shrink-0"
          title="Back to chats"
        >
          <ArrowLeft size={21} />
        </button>

        {/* Avatar with online dot */}
        <div className="relative flex-shrink-0">
          <img
            src={selectedUser?.profilePic || "/avatar.png"}
            alt={selectedUser?.fullName}
            className="size-9 sm:size-10 rounded-full object-cover border border-base-300 shadow-xs"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 size-2.5 sm:size-3 bg-emerald-500 rounded-full ring-2 ring-base-100" />
          )}
        </div>

        {/* User Details */}
        <div className="flex flex-col min-w-0">
          <h3 className="font-semibold text-sm leading-tight text-base-content truncate">
            {selectedUser?.fullName}
          </h3>
          <p className="text-[11px] sm:text-xs truncate">
            {isOnline ? (
              <span className="text-emerald-500 font-medium">online</span>
            ) : canShowStatus && selectedUser?.lastSeen ? (
              <span className="text-base-content/60">
                {formatLastSeen(selectedUser.lastSeen)}
              </span>
            ) : (
              <span className="text-base-content/50">offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Right WhatsApp Actions */}
      <div className="flex items-center gap-0.5 sm:gap-1 text-base-content/70 flex-shrink-0">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          title="Voice Call"
        >
          <Phone size={17} />
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          title="Video Call"
        >
          <Video size={18} />
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          title="Search in chat"
        >
          <Search size={17} />
        </button>

        {/* Wallpaper Customizer Dropdown */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content hover:text-emerald-500"
            title="Chat Wallpaper & Style"
          >
            <Paintbrush size={17} />
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-50 menu p-3 shadow-xl bg-base-100 dark:bg-[#1f2c34] border border-base-300 dark:border-white/10 rounded-2xl w-64 text-xs space-y-2 mt-2"
          >
            <div className="flex items-center justify-between pb-1 border-b border-base-200 dark:border-white/5">
              <span className="font-semibold text-sm text-base-content">
                Chat Wallpaper
              </span>
              <span className="badge badge-xs badge-success text-white font-medium">
                WhatsApp
              </span>
            </div>

            <div className="space-y-1">
              {WALLPAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWallpaper(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    wallpaper === opt.id
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "hover:bg-base-200 dark:hover:bg-white/5 text-base-content/80"
                  }`}
                >
                  <span className="truncate">{opt.name}</span>
                  {wallpaper === opt.id && <Check size={14} className="stroke-[2.5]" />}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-base-200 dark:border-white/5 flex items-center justify-between">
              <span className="text-base-content/70">Doodle Texture</span>
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
          className="hidden md:inline-flex btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          onClick={() => setSelectedUser(null)}
          title="Close chat"
        >
          <X size={19} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
