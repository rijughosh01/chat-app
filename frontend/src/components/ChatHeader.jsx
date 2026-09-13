import { X, Phone, Video, Search, ArrowLeft, Paintbrush, Check, Sparkles, Timer } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useThemeStore, WALLPAPER_OPTIONS } from "../store/useThemeStore";
import { formatLastSeen } from "../lib/utils";

const DISAPPEARING_OPTIONS = [
  { id: 0, label: "Off", desc: "Keep messages permanently" },
  { id: 60, label: "1 Minute", desc: "Instant vanish for testing" },
  { id: 86400, label: "24 Hours", desc: "Disappear after 1 day" },
  { id: 604800, label: "7 Days", desc: "Disappear after 1 week" },
  { id: 7776000, label: "90 Days", desc: "Disappear after 3 months" },
];

function formatTimerLabel(seconds) {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

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
  const {
    selectedUser,
    setSelectedUser,
    typingUsers,
    disappearingTimer,
    setDisappearingTimer,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { wallpaper, setWallpaper, wallpaperDoodle, toggleWallpaperDoodle } =
    useThemeStore();

  const handleSelectDisappearingOption = (id) => {
    setDisappearingTimer(id);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  };

  const handleSelectWallpaper = (id) => {
    setWallpaper(id);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  };

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
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-bold text-sm sm:text-base leading-tight text-base-content truncate">
              {selectedUser?.fullName}
            </h3>
            {disappearingTimer > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/25 flex-shrink-0"
                title={`Disappearing messages enabled: ${formatTimerLabel(disappearingTimer)}`}
              >
                <Timer size={10} className="stroke-[2.5]" />
                {formatTimerLabel(disappearingTimer)}
              </span>
            )}
          </div>
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
      <div className="flex items-center gap-2 sm:gap-2.5 text-base-content/70 flex-shrink-0">
        <button
          type="button"
          className="size-8 sm:size-9 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-emerald-600 active:scale-90 transition-all cursor-pointer"
          title="Voice Call"
        >
          <Phone size={18} />
        </button>

        <button
          type="button"
          className="size-8 sm:size-9 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-emerald-600 active:scale-90 transition-all cursor-pointer"
          title="Video Call"
        >
          <Video size={19} />
        </button>

        <button
          type="button"
          className="hidden sm:flex size-9 items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content active:scale-90 transition-all cursor-pointer"
          title="Search in chat"
        >
          <Search size={18} />
        </button>

        {/* Disappearing Messages Dropdown */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className={`size-8 sm:size-9 flex items-center justify-center rounded-full transition-all cursor-pointer relative ${disappearingTimer > 0
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 ring-1 ring-amber-500/30"
                : "hover:bg-base-200 text-base-content/70 hover:text-emerald-600"
              } active:scale-90`}
            title={
              disappearingTimer > 0
                ? `Disappearing Messages: ${formatTimerLabel(disappearingTimer)}`
                : "Disappearing Messages"
            }
          >
            <Timer size={18} />
            {disappearingTimer > 0 && (
              <span className="absolute -top-0.5 -right-0.5 size-2 bg-amber-500 rounded-full ring-2 ring-base-100 animate-pulse" />
            )}
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-50 menu p-3 shadow-2xl bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl w-64 sm:w-72 max-w-[calc(100vw-24px)] text-xs space-y-2.5 mt-2"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-base-content/10">
              <span className="font-bold text-sm text-base-content flex items-center gap-1.5">
                <Timer size={16} className="text-amber-500" />
                Disappearing Messages
              </span>
              {disappearingTimer > 0 ? (
                <span className="badge badge-xs bg-amber-500 text-white font-bold px-2 py-0.5">
                  {formatTimerLabel(disappearingTimer)}
                </span>
              ) : (
                <span className="badge badge-xs badge-ghost text-base-content/60 font-semibold px-2 py-0.5">
                  Off
                </span>
              )}
            </div>

            <p className="text-[11px] text-base-content/65 leading-tight">
              When turned on, new messages sent in this chat will automatically disappear after the selected duration.
            </p>

            <div className="space-y-1">
              {DISAPPEARING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectDisappearingOption(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left font-medium transition-all ${disappearingTimer === opt.id
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30"
                      : "hover:bg-base-200 text-base-content/80 hover:text-base-content"
                    }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] opacity-70 font-normal">{opt.desc}</span>
                  </div>
                  {disappearingTimer === opt.id && (
                    <Check size={14} className="stroke-[2.5] text-amber-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wallpaper Customizer Dropdown */}
        <div className="dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className="size-8 sm:size-9 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-emerald-600 active:scale-90 transition-all cursor-pointer"
            title="Chat Wallpaper & Style"
          >
            <Paintbrush size={18} />
          </button>
          <div
            tabIndex={0}
            className="dropdown-content z-50 menu p-3 shadow-2xl bg-base-100/95 backdrop-blur-xl border border-base-content/10 rounded-2xl w-60 sm:w-64 max-w-[calc(100vw-24px)] text-xs space-y-2.5 mt-2"
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
                  onClick={() => handleSelectWallpaper(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left font-medium transition-all ${wallpaper === opt.id
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
