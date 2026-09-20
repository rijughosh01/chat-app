import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Phone,
  Video,
  Search,
  ArrowLeft,
  Paintbrush,
  Check,
  Sparkles,
  Timer,
  MoreVertical,
  User,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useThemeStore, WALLPAPER_OPTIONS } from "../store/useThemeStore";
import { formatLastSeen } from "../lib/utils";
import UserProfileDrawer from "./UserProfileDrawer";

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
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [showMobileWallpaperModal, setShowMobileWallpaperModal] = useState(false);
  const [showMobileTimerModal, setShowMobileTimerModal] = useState(false);

  const {
    selectedUser,
    setSelectedUser,
    typingUsers,
    disappearingTimer,
    setDisappearingTimer,
    messages,
    isSearchOpen,
    setIsSearchOpen,
    searchQuery,
    setSearchQuery,
    activeSearchMatchIndex,
    setActiveSearchMatchIndex,
  } = useChatStore();
  const { startCall } = useCallStore();
  const { onlineUsers } = useAuthStore();
  const { wallpaper, setWallpaper, wallpaperDoodle, toggleWallpaperDoodle } =
    useThemeStore();

  const searchMatches = searchQuery.trim()
    ? messages.filter((m) =>
        m.text?.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];
  const totalMatches = searchMatches.length;

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    const newIndex =
      activeSearchMatchIndex > 0 ? activeSearchMatchIndex - 1 : totalMatches - 1;
    setActiveSearchMatchIndex(newIndex);
  };

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    const newIndex =
      activeSearchMatchIndex < totalMatches - 1 ? activeSearchMatchIndex + 1 : 0;
    setActiveSearchMatchIndex(newIndex);
  };

  const handleSelectDisappearingOption = (id) => {
    setDisappearingTimer(id);
    setShowMobileTimerModal(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  };

  const handleSelectWallpaper = (id) => {
    setWallpaper(id);
    setShowMobileWallpaperModal(false);
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  };

  const canShowStatus = selectedUser?.showOnlineStatus !== false;
  const isOnline = canShowStatus && onlineUsers.includes(selectedUser?._id);
  const isTyping = Boolean(selectedUser?._id && typingUsers.includes(selectedUser._id));

  return (
    <div className="px-2.5 sm:px-4 py-2 border-b border-base-content/10 bg-base-100/90 backdrop-blur-xl flex items-center justify-between z-20 flex-shrink-0 shadow-xs min-h-[57px]">
      {isSearchOpen ? (
        <div className="flex items-center gap-2 w-full animate-in fade-in duration-150">
          <div className="relative flex-1 flex items-center">
            <Search size={16} className="absolute left-3 text-base-content/50 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                } else if (e.key === "Escape") {
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search in conversation..."
              className="w-full bg-base-200/70 focus:bg-base-200 pl-9 pr-24 py-1.5 rounded-xl text-xs sm:text-sm text-base-content placeholder:text-base-content/40 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 border border-base-content/10 transition-all"
            />
            {searchQuery.trim() && (
              <span className="absolute right-3 text-[11px] text-base-content/60 font-semibold select-none">
                {totalMatches > 0
                  ? `${activeSearchMatchIndex + 1} of ${totalMatches}`
                  : "0 matches"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              disabled={totalMatches === 0}
              onClick={handlePrevMatch}
              className="size-8 rounded-lg flex items-center justify-center hover:bg-base-200 text-base-content/70 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              disabled={totalMatches === 0}
              onClick={handleNextMatch}
              className="size-8 rounded-lg flex items-center justify-center hover:bg-base-200 text-base-content/70 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
              title="Next match (Enter)"
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="size-8 rounded-lg flex items-center justify-center hover:bg-base-200 text-base-content/70 hover:text-base-content active:scale-95 transition-all cursor-pointer"
              title="Close search (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Left side: Back Button + Avatar + Contact Info */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1 mr-1">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="md:hidden size-8 -ml-1 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/80 active:scale-90 transition-all cursor-pointer flex-shrink-0"
              title="Back to chats"
            >
              <ArrowLeft size={19} className="stroke-[2.5]" />
            </button>

            {/* Clickable Avatar & User Details */}
            <div
              onClick={() => setIsProfileDrawerOpen(true)}
              className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer group/user select-none"
              title="Click to view contact info & bio"
            >
              {/* Avatar with live online dot */}
              <div className="relative flex-shrink-0 group-hover/user:scale-103 transition-transform">
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

              {/* User Details & Live Status */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base leading-tight text-base-content truncate group-hover/user:text-emerald-500 transition-colors">
                    {selectedUser?.fullName}
                  </h3>
                  {disappearingTimer > 0 && (
                    <span
                      className="hidden sm:inline-flex items-center gap-0.5 text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded-full border border-amber-500/25 flex-shrink-0"
                      title={`Disappearing messages enabled: ${formatTimerLabel(disappearingTimer)}`}
                    >
                      <Timer size={10} className="stroke-[2.5]" />
                      {formatTimerLabel(disappearingTimer)}
                    </span>
                  )}
                </div>
                <div className="text-[11px] sm:text-xs truncate flex items-center gap-1.5 min-h-[16px] text-base-content/60 font-medium">
                  {isTyping ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 truncate">
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
                    <span className="text-base-content/60 font-medium truncate">
                      {formatLastSeen(selectedUser.lastSeen)}
                    </span>
                  ) : (
                    <span className="text-base-content/40 font-medium">offline</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-2.5 text-base-content/70 flex-shrink-0">
            <button
              type="button"
              onClick={() => startCall({ user: selectedUser, callType: "voice" })}
              className="size-8 sm:size-9 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-emerald-600 active:scale-90 transition-all cursor-pointer"
              title="Voice Call"
            >
              <Phone size={18} />
            </button>

            <button
              type="button"
              onClick={() => startCall({ user: selectedUser, callType: "video" })}
              className="size-8 sm:size-9 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-emerald-600 active:scale-90 transition-all cursor-pointer"
              title="Video Call"
            >
              <Video size={19} />
            </button>

            {/* Desktop Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex size-9 items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content active:scale-90 transition-all cursor-pointer"
              title="Search in chat"
            >
              <Search size={18} />
            </button>

        {/* Desktop Disappearing Messages Dropdown */}
        <div className="hidden sm:block dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className={`size-8 sm:size-9 flex items-center justify-center rounded-full transition-all cursor-pointer relative ${
              disappearingTimer > 0
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
            className="dropdown-content z-50 p-3.5 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl w-64 sm:w-72 max-w-[calc(100vw-24px)] text-xs space-y-2.5 mt-2"
          >
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <span className="font-bold text-sm text-base-content flex items-center gap-1.5">
                <Timer size={16} className="text-amber-500" />
                Disappearing Messages
              </span>
              {disappearingTimer > 0 ? (
                <span className="badge badge-xs bg-amber-500 text-white font-bold px-2 py-0.5">
                  {formatTimerLabel(disappearingTimer)}
                </span>
              ) : (
                <span className="badge badge-xs badge-ghost text-base-content/70 font-semibold px-2 py-0.5">
                  Off
                </span>
              )}
            </div>

            <p className="text-[11px] text-base-content/75 leading-tight">
              When turned on, new messages sent in this chat will automatically disappear after the selected duration.
            </p>

            <div className="space-y-1.5">
              {DISAPPEARING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectDisappearingOption(opt.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    disappearingTimer === opt.id
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/35 ring-1 ring-amber-500/20"
                      : "bg-base-200/60 hover:bg-base-200 text-base-content font-medium border border-base-content/5"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-base-content">{opt.label}</span>
                    <span className="text-[10px] text-base-content/70 font-normal">{opt.desc}</span>
                  </div>
                  {disappearingTimer === opt.id && (
                    <Check size={15} className="stroke-[2.5] text-amber-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Wallpaper Customizer Dropdown */}
        <div className="hidden sm:block dropdown dropdown-end">
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
            className="dropdown-content z-50 p-3.5 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl w-60 sm:w-64 max-w-[calc(100vw-24px)] text-xs space-y-2.5 mt-2"
          >
            <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
              <span className="font-bold text-sm text-base-content flex items-center gap-1.5">
                <Paintbrush size={16} className="text-emerald-500" />
                Chat Wallpaper
              </span>
              <span className="badge badge-xs bg-emerald-500 text-white font-bold px-2 py-0.5">
                <Sparkles className="size-2.5 mr-0.5 inline" /> Theme
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {WALLPAPER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectWallpaper(opt.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    wallpaper === opt.id
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/35 ring-1 ring-emerald-500/20"
                      : "bg-base-200/60 hover:bg-base-200 text-base-content font-medium border border-base-content/5"
                  }`}
                >
                  <span className="truncate text-xs font-semibold text-base-content">{opt.name}</span>
                  {wallpaper === opt.id && <Check size={15} className="stroke-[2.5] text-emerald-500" />}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-base-content/10 flex items-center justify-between">
              <span className="text-xs text-base-content/80 font-medium">Doodle Pattern</span>
              <input
                type="checkbox"
                className="toggle toggle-xs toggle-success cursor-pointer"
                checked={wallpaperDoodle}
                onChange={(e) => toggleWallpaperDoodle(e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Mobile 3-Dots More Options Menu */}
        <div className="sm:hidden dropdown dropdown-end">
          <button
            tabIndex={0}
            type="button"
            className="size-8 flex items-center justify-center rounded-full hover:bg-base-200 text-base-content/70 hover:text-base-content active:scale-90 transition-all cursor-pointer relative"
            title="More options"
          >
            <MoreVertical size={18} />
            {disappearingTimer > 0 && (
              <span className="absolute 1.5 top-1.5 size-2 bg-amber-500 rounded-full ring-1 ring-base-100" />
            )}
          </button>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 p-2 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl w-56 text-xs space-y-1 mt-2"
          >
            <li>
              <button
                type="button"
                onClick={() => {
                  startCall({ user: selectedUser, callType: "voice" });
                  if (document.activeElement && typeof document.activeElement.blur === "function") {
                    document.activeElement.blur();
                  }
                }}
                className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                <Phone size={16} className="text-emerald-500" />
                <span>Voice call</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  startCall({ user: selectedUser, callType: "video" });
                  if (document.activeElement && typeof document.activeElement.blur === "function") {
                    document.activeElement.blur();
                  }
                }}
                className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                <Video size={16} className="text-emerald-500" />
                <span>Video call</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(true);
                  if (document.activeElement && typeof document.activeElement.blur === "function") {
                    document.activeElement.blur();
                  }
                }}
                className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                <Search size={16} className="text-emerald-500" />
                <span>Search in chat</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setIsProfileDrawerOpen(true);
                  if (document.activeElement && typeof document.activeElement.blur === "function") {
                    document.activeElement.blur();
                  }
                }}
                className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                <User size={16} className="text-emerald-500" />
                <span>Contact info</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setShowMobileTimerModal(true);
                  if (document.activeElement && typeof document.activeElement.blur === "function") {
                    document.activeElement.blur();
                  }
                }}
                className="w-full flex items-center justify-between py-2 px-3 rounded-xl font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Timer size={16} className="text-amber-500" />
                  <span>Disappearing messages</span>
                </div>
                {disappearingTimer > 0 && (
                  <span className="badge badge-xs bg-amber-500 text-white font-bold">
                    {formatTimerLabel(disappearingTimer)}
                  </span>
                )}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => {
                  setShowMobileWallpaperModal(true);
                  if (document.activeElement && typeof document.activeElement.blur === "function") {
                    document.activeElement.blur();
                  }
                }}
                className="w-full flex items-center gap-2.5 py-2 px-3 rounded-xl font-medium text-base-content hover:bg-base-200 transition-colors"
              >
                <Paintbrush size={16} className="text-indigo-500" />
                <span>Wallpaper & Theme</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Desktop Close Chat Button */}
        <button
          type="button"
          className="hidden md:inline-flex btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content active:scale-90 transition-all"
          onClick={() => setSelectedUser(null)}
          title="Close chat"
        >
          <X size={18} />
        </button>
      </div>
      </>
    )}

      {/* Mobile Disappearing Messages Bottom Sheet Modal (Portaled) */}
      {showMobileTimerModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setShowMobileTimerModal(false)}
            />
            <div className="relative w-full sm:max-w-sm bg-base-100 rounded-t-3xl sm:rounded-3xl border border-base-content/15 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 z-10 safe-pb">
              <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
                <span className="font-bold text-base text-base-content flex items-center gap-2">
                  <Timer size={18} className="text-amber-500" />
                  Disappearing Messages
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileTimerModal(false)}
                  className="size-8 rounded-full flex items-center justify-center hover:bg-base-200 text-base-content/70"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-base-content/75 leading-relaxed">
                When turned on, new messages sent in this chat will automatically disappear after the selected duration.
              </p>
              <div className="space-y-2">
                {DISAPPEARING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectDisappearingOption(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                      disappearingTimer === opt.id
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/40 ring-1 ring-amber-500/20"
                        : "bg-base-200/70 hover:bg-base-200 text-base-content border border-base-content/5"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-base-content">{opt.label}</div>
                      <div className="text-xs text-base-content/70 font-normal">{opt.desc}</div>
                    </div>
                    {disappearingTimer === opt.id && (
                      <Check size={18} className="text-amber-500 stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Mobile Wallpaper Bottom Sheet Modal (Portaled) */}
      {showMobileWallpaperModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setShowMobileWallpaperModal(false)}
            />
            <div className="relative w-full sm:max-w-sm bg-base-100 rounded-t-3xl sm:rounded-3xl border border-base-content/15 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 z-10 safe-pb">
              <div className="flex items-center justify-between pb-2 border-b border-base-content/10">
                <span className="font-bold text-base text-base-content flex items-center gap-2">
                  <Paintbrush size={18} className="text-emerald-500" />
                  Chat Wallpaper & Theme
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileWallpaperModal(false)}
                  className="size-8 rounded-full flex items-center justify-center hover:bg-base-200 text-base-content/70"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {WALLPAPER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectWallpaper(opt.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                      wallpaper === opt.id
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/40 ring-1 ring-emerald-500/20"
                        : "bg-base-200/70 hover:bg-base-200 text-base-content border border-base-content/5"
                    }`}
                  >
                    <span className="text-sm font-semibold text-base-content">{opt.name}</span>
                    {wallpaper === opt.id && (
                      <Check size={18} className="text-emerald-500 stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pt-3 border-t border-base-content/10 flex items-center justify-between">
                <span className="text-xs text-base-content/80 font-medium">Doodle Pattern</span>
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-success cursor-pointer"
                  checked={wallpaperDoodle}
                  onChange={(e) => toggleWallpaperDoodle(e.target.checked)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Slide-over Profile / Contact Info Drawer */}
      <UserProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        user={selectedUser}
      />
    </div>
  );
};

export default ChatHeader;
