import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Play,
  Pause,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { useStatusStore } from "../../store/useStatusStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import toast from "react-hot-toast";
import StatusViewersModal from "./StatusViewersModal";

const SLIDE_DURATION = 5000; // 5 seconds per slide

function formatStatusTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
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

const FONT_CLASSES = {
  sans: "font-sans",
  serif: "font-serif",
  mono: "font-mono",
  cursive: "italic font-serif",
  display: "font-black tracking-tight",
};

const StatusViewerModal = () => {
  const {
    isViewerOpen,
    activeStoryUser,
    activeStoryIndex,
    myStatuses,
    closeStory,
    nextSlide,
    prevSlide,
    markStatusAsViewed,
    deleteStatus,
    setIsViewersListOpen,
  } = useStatusStore();

  const { authUser } = useAuthStore();
  const { sendMessage, setSelectedUser, users } = useChatStore();

  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const progressIntervalRef = useRef(null);
  const isPressingRef = useRef(false);
  const pressStartTimeRef = useRef(0);

  const isMyStory = activeStoryUser === "me";
  const currentStatuses = isMyStory
    ? myStatuses
    : activeStoryUser?.statuses || [];

  const activeStatus = currentStatuses[activeStoryIndex];
  const storyUser = isMyStory ? authUser : activeStoryUser?.user;

  // Handle keyboard arrow keys & Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isViewerOpen) return;
      if (e.key === "Escape") {
        closeStory();
      } else if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      } else if (e.key === " ") {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isViewerOpen, nextSlide, prevSlide, closeStory]);

  // Mark status as viewed when displayed
  useEffect(() => {
    if (activeStatus && !isMyStory && activeStatus._id) {
      markStatusAsViewed(activeStatus._id);
    }
  }, [activeStatus, isMyStory, markStatusAsViewed]);

  // Reset & run timer when slide changes
  useEffect(() => {
    if (!isViewerOpen || !activeStatus) return;

    setProgress(0);
    const stepTime = 50; // update progress every 50ms
    const stepPercent = (stepTime / SLIDE_DURATION) * 100;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (isPaused) return;

      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current);
          nextSlide();
          return 0;
        }
        return prev + stepPercent;
      });
    }, stepTime);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [activeStoryIndex, activeStoryUser, isViewerOpen, isPaused, nextSlide, activeStatus]);

  if (!isViewerOpen || !activeStatus || currentStatuses.length === 0) {
    return null;
  }

  // Handle Tap Left (prev) vs Tap Right (next)
  const handleScreenClick = (e) => {
    // If user clicked an interactive control or button, ignore
    if (
      e.target.closest("button") ||
      e.target.closest("form") ||
      e.target.closest("input")
    ) {
      return;
    }

    // Ignore click if it was preceded by a long press (hold-to-pause)
    const pressDuration = Date.now() - pressStartTimeRef.current;
    if (pressDuration > 250) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.35) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  // Hold to pause
  const handlePointerDown = (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest("form") ||
      e.target.closest("input")
    ) {
      return;
    }
    pressStartTimeRef.current = Date.now();
    isPressingRef.current = true;
    setIsPaused(true);
  };

  const handlePointerUp = () => {
    if (isPressingRef.current) {
      isPressingRef.current = false;
      setIsPaused(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSendingReply || !storyUser) return;

    setIsSendingReply(true);
    const textToSend = replyText.trim();
    setReplyText("");

    try {
      // Find matching user in contacts or use storyUser
      const targetUser =
        users.find(
          (u) =>
            u._id?.toString() ===
            (storyUser._id || storyUser)?.toString()
        ) || storyUser;

      setSelectedUser(targetUser);

      const statusSnippet =
        activeStatus.type === "text"
          ? `Status: "${activeStatus.text.substring(0, 40)}..."`
          : "Replying to photo status 📷";

      await sendMessage({
        text: `💬 ${statusSnippet}\n${textToSend}`,
      });

      toast.success(
        `Reply sent to ${storyUser?.fullName?.split(" ")[0] || "contact"}!`
      );
      closeStory();
    } catch (err) {
      console.error("Error sending reply to status:", err);
      toast.error("Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const viewersCount = activeStatus.viewers?.length || 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none safe-pb safe-pt">
      {/* Desktop Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md z-30 transition-transform active:scale-90 cursor-pointer"
        title="Previous slide (Left Arrow)"
      >
        <ChevronLeft size={28} />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md z-30 transition-transform active:scale-90 cursor-pointer"
        title="Next slide (Right Arrow)"
      >
        <ChevronRight size={28} />
      </button>

      {/* Main Story Container (9:16 mobile aspect ratio frame on desktop) */}
      <div
        onClick={handleScreenClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-full sm:h-[92vh] sm:max-w-md sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
        style={{
          backgroundColor:
            activeStatus.type === "text"
              ? activeStatus.backgroundColor || "#005c4b"
              : "#000000",
        }}
      >
        {/* Top Segmented Progress Bar & User Header */}
        <div className="absolute top-0 left-0 right-0 p-3.5 sm:p-4 z-30 bg-gradient-to-b from-black/75 via-black/35 to-transparent space-y-2.5">
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5 w-full">
            {currentStatuses.map((s, idx) => {
              let fillPercent = 0;
              if (idx < activeStoryIndex) {
                fillPercent = 100;
              } else if (idx === activeStoryIndex) {
                fillPercent = progress;
              }

              return (
                <div
                  key={s._id || idx}
                  className="flex-1 h-1 sm:h-1.5 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info & Controls Header */}
          <div className="flex items-center justify-between text-white pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              {storyUser?.profilePic ? (
                <img
                  src={storyUser.profilePic}
                  alt={storyUser.fullName}
                  className="size-10 rounded-full object-cover ring-2 ring-white/40 shadow-sm flex-shrink-0"
                />
              ) : (
                <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                  {getInitials(storyUser?.fullName)}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm leading-tight truncate drop-shadow-sm">
                  {isMyStory ? "My Status" : storyUser?.fullName || "Contact"}
                </span>
                <span className="text-[11px] text-white/75 font-medium drop-shadow-xs">
                  {formatStatusTime(activeStatus.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPaused((prev) => !prev);
                }}
                className="size-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
              </button>

              {/* Delete button (for own stories) */}
              {isMyStory && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this status update?")) {
                      await deleteStatus(activeStatus._id);
                    }
                  }}
                  className="size-8 rounded-full hover:bg-red-500/30 text-white/90 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                  title="Delete status"
                >
                  <Trash2 size={16} />
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeStory();
                }}
                className="size-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Story Slide Content (Text or Photo) */}
        <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden">
          {activeStatus.type === "text" ? (
            <div className="p-6 sm:p-8 text-center max-w-md w-full">
              <p
                className={`text-white text-2xl sm:text-3xl md:text-4xl leading-relaxed whitespace-pre-wrap break-words drop-shadow-md select-text ${
                  FONT_CLASSES[activeStatus.fontFamily] || "font-sans"
                }`}
              >
                {activeStatus.text}
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={activeStatus.image}
                alt="Status slide"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Bottom Bar: Photo Caption OR Viewer Drawer Trigger OR Reply Input */}
        <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center gap-2.5">
          {/* Photo Caption if present */}
          {activeStatus.type === "image" && activeStatus.caption && (
            <div className="w-full text-center px-4 py-1.5 rounded-2xl bg-black/40 backdrop-blur-md">
              <p className="text-white text-sm sm:text-base font-medium drop-shadow-md">
                {activeStatus.caption}
              </p>
            </div>
          )}

          {/* If viewing own status: Viewers Counter Pill Button */}
          {isMyStory ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(true);
                setIsViewersListOpen(true, activeStatus);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold shadow-lg active:scale-95 transition-all cursor-pointer border border-white/20"
              title="Viewers list"
            >
              <Eye size={15} />
              <span>
                {viewersCount} {viewersCount === 1 ? "view" : "views"}
              </span>
            </button>
          ) : (
            /* If viewing contact's status: Quick Reply to Story */
            <form
              onSubmit={handleSendReply}
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={`Reply to ${storyUser?.fullName?.split(" ")[0]}...`}
                value={replyText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-white/20 focus:bg-white/30 backdrop-blur-md border border-white/25 rounded-full px-4 py-2 text-xs sm:text-sm text-white placeholder:text-white/60 outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSendingReply}
                className="size-9 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-white flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 cursor-pointer shadow-md"
                title="Send reply"
              >
                <Send size={15} className="translate-x-0.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Embedded Viewers List Bottom Sheet */}
      <StatusViewersModal />
    </div>,
    document.body
  );
};

export default StatusViewerModal;
