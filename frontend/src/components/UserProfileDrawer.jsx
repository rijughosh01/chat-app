import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Mail,
  Calendar,
  ShieldCheck,
  Phone,
  Video,
  Copy,
  Check,
  Timer,
  Image as ImageIcon,
  Sparkles,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { formatLastSeen } from "../lib/utils";
import ImageModal from "./ImageModal";

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function formatJoinDate(dateStr) {
  if (!dateStr) return "Recent Member";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent Member";
  }
}

const UserProfileDrawer = ({ isOpen, onClose, user }) => {
  const { onlineUsers } = useAuthStore();
  const { messages, disappearingTimer } = useChatStore();
  const { startCall } = useCallStore();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!user) return null;

  const canShowStatus = user.showOnlineStatus !== false;
  const isOnline = canShowStatus && onlineUsers.includes(user._id);

  // Filter shared photos from active conversation
  const sharedImages = (messages || [])
    .filter((m) => m.image && !m.image.startsWith("data:"))
    .map((m) => ({ url: m.image, createdAt: m.createdAt }));

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (!user.email) return;
    navigator.clipboard.writeText(user.email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard 📋");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const timerLabel =
    disappearingTimer === 60
      ? "1 Minute"
      : disappearingTimer === 86400
      ? "24 Hours"
      : disappearingTimer === 604800
      ? "7 Days"
      : disappearingTimer === 7776000
      ? "90 Days"
      : "Off";

  const drawerContent = (
    <div
      className={`fixed inset-0 z-[9999] ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Full screen backdrop blur overlay */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 md:w-[420px] max-w-full
          bg-base-100 text-base-content shadow-2xl border-l border-base-content/10
          flex flex-col transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Contact info"
      >
        {/* Drawer Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-base-content/10 bg-base-100/90 backdrop-blur-md flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full flex items-center justify-center hover:bg-base-200 text-base-content/70 hover:text-base-content active:scale-90 transition-all cursor-pointer"
              title="Close drawer"
            >
              <X size={19} className="stroke-[2.5]" />
            </button>
            <h2 className="font-bold text-base text-base-content">Contact Info</h2>
          </div>
          <span className="badge badge-sm badge-ghost text-xs font-semibold px-2 py-0.5">
            Profile
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 no-scrollbar">
          {/* Avatar & Hero Info */}
          <div className="flex flex-col items-center text-center space-y-3 pt-1 pb-3">
            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => user.profilePic && setPreviewImage(user.profilePic)}
              title={user.profilePic ? "Click to view photo" : undefined}
            >
              <div className="size-28 sm:size-32 rounded-3xl overflow-hidden ring-4 ring-emerald-500/25 p-1 bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-xl group-hover/avatar:ring-emerald-500/50 transition-all">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt={user.fullName}
                    className="w-full h-full rounded-[20px] object-cover bg-base-200"
                  />
                ) : (
                  <div className="w-full h-full rounded-[20px] bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-3xl">
                    {getInitials(user.fullName)}
                  </div>
                )}
              </div>
              {isOnline && (
                <span className="absolute bottom-1 right-1 size-4 bg-emerald-500 rounded-full ring-3 ring-base-100 shadow-sm" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-lg sm:text-xl text-base-content leading-tight">
                {user.fullName}
              </h3>
              <p className="text-xs text-base-content/60 font-medium">
                {isOnline ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online now
                  </span>
                ) : canShowStatus && user.lastSeen ? (
                  formatLastSeen(user.lastSeen)
                ) : (
                  "Offline"
                )}
              </p>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  startCall({ user, callType: "voice" });
                  onClose();
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-base-200/80 hover:bg-base-200 text-base-content/80 hover:text-emerald-600 active:scale-95 transition-all text-xs font-semibold cursor-pointer"
                title="Voice Call"
              >
                <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Phone size={17} />
                </div>
                <span>Audio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  startCall({ user, callType: "video" });
                  onClose();
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-base-200/80 hover:bg-base-200 text-base-content/80 hover:text-emerald-600 active:scale-95 transition-all text-xs font-semibold cursor-pointer"
                title="Video Call"
              >
                <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Video size={17} />
                </div>
                <span>Video</span>
              </button>
            </div>
          </div>

          {/* Status Bio Card (WhatsApp Style) */}
          <div className="p-4 bg-base-200/60 rounded-2xl border border-base-content/8 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-base-content/60 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Info size={14} className="text-emerald-500" />
                About / Bio
              </span>
              <Sparkles size={13} className="text-emerald-500/70" />
            </div>
            <p className="text-sm font-medium text-base-content leading-relaxed whitespace-pre-wrap">
              {user.bio || "Hey there! I am using NexChat."}
            </p>
          </div>

          {/* User Details & Contact Info */}
          <div className="p-4 bg-base-200/60 rounded-2xl border border-base-content/8 space-y-3.5">
            <div className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
              Contact Information
            </div>

            {/* Email */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-xl bg-base-100 flex items-center justify-center text-emerald-500 flex-shrink-0 shadow-2xs border border-base-content/5">
                  <Mail size={15} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-base-content/50 font-semibold">Email</span>
                  <span className="font-semibold text-base-content truncate">{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-emerald-500"
                title="Copy email"
              >
                {copiedEmail ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-2.5 text-xs pt-1 border-t border-base-content/5">
              <div className="size-8 rounded-xl bg-base-100 flex items-center justify-center text-emerald-500 flex-shrink-0 shadow-2xs border border-base-content/5">
                <Calendar size={15} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-base-content/50 font-semibold">Joined</span>
                <span className="font-semibold text-base-content">
                  {formatJoinDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Settings & Disappearing Messages */}
          <div className="p-4 bg-base-200/60 rounded-2xl border border-base-content/8 space-y-3">
            <div className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
              Chat Features
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-base-100 flex items-center justify-center text-amber-500 flex-shrink-0 shadow-2xs border border-base-content/5">
                  <Timer size={15} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-base-content">Disappearing Messages</span>
                  <span className="text-[11px] text-base-content/55">
                    {disappearingTimer > 0 ? `Active (${timerLabel})` : "Off (Permanent)"}
                  </span>
                </div>
              </div>
              {disappearingTimer > 0 && (
                <span className="badge badge-xs bg-amber-500 text-white font-bold px-2 py-0.5">
                  {timerLabel}
                </span>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2.5 text-xs pt-2 border-t border-base-content/5">
              <div className="size-8 rounded-xl bg-base-100 flex items-center justify-center text-emerald-500 flex-shrink-0 shadow-2xs border border-base-content/5">
                <ShieldCheck size={16} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-base-content">Encryption & Privacy</span>
                <span className="text-[11px] text-base-content/55">
                  Messages are secured in transit with TLS encryption and account protection.
                </span>
              </div>
            </div>
          </div>

          {/* Shared Media Gallery Preview */}
          {sharedImages.length > 0 && (
            <div className="p-4 bg-base-200/60 rounded-2xl border border-base-content/8 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-base-content/60 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-emerald-500" />
                  Media & Photos ({sharedImages.length})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {sharedImages.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(item.url)}
                    className="aspect-square rounded-xl overflow-hidden bg-black/10 border border-base-content/10 cursor-pointer group/img relative"
                  >
                    <img
                      src={item.url}
                      alt="Shared photo"
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImageModal
          imageUrl={previewImage}
          senderName={user.fullName}
          timestamp="Profile Photo"
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(drawerContent, document.body) : null;
};

export default UserProfileDrawer;
