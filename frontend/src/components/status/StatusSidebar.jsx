import { useEffect } from "react";
import {
  Plus,
  Camera,
  Pencil,
  Sparkles,
  Eye,
  Clock,
  CircleDashed,
} from "lucide-react";
import { useStatusStore } from "../../store/useStatusStore";
import { useAuthStore } from "../../store/useAuthStore";

function formatStatusSidebarTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${timeStr}`;
    }

    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
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

const StatusSidebar = () => {
  const {
    myStatuses,
    otherUserStatuses,
    isLoading,
    getStatuses,
    openStory,
    setIsTextModalOpen,
    setIsMediaModalOpen,
  } = useStatusStore();

  const { authUser } = useAuthStore();

  useEffect(() => {
    getStatuses();
  }, [getStatuses]);

  const hasMyStatus = myStatuses.length > 0;
  const latestMyStatus = hasMyStatus ? myStatuses[myStatuses.length - 1] : null;

  // Split other users into Recent (unviewed) and Viewed updates
  const recentUpdates = otherUserStatuses.filter((group) => group.hasUnviewed);
  const viewedUpdates = otherUserStatuses.filter((group) => !group.hasUnviewed);

  const totalMyViews = myStatuses.reduce(
    (acc, s) => acc + (s.viewers?.length || 0),
    0
  );

  return (
    <div className="flex-1 overflow-y-auto w-full py-2 px-2.5 space-y-4 no-scrollbar pb-24 md:pb-6">
      {/* 1. My Status Card */}
      <div className="bg-base-200/50 hover:bg-base-200/80 p-3 rounded-2xl border border-base-content/8 transition-all">
        <div className="flex items-center justify-between gap-2">
          {/* Avatar + Info (Clicking opens story viewer if active, or media picker if none) */}
          <div
            onClick={() => {
              if (hasMyStatus) {
                openStory("me", 0);
              } else {
                setIsMediaModalOpen(true);
              }
            }}
            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group select-none"
            title={hasMyStatus ? "View your status" : "Add status update"}
          >
            <div className="relative flex-shrink-0">
              <div
                className={`p-0.5 rounded-full transition-transform group-hover:scale-105 ${
                  hasMyStatus
                    ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-base-100"
                    : "ring-2 ring-dashed ring-base-content/30"
                }`}
              >
                {authUser?.profilePic ? (
                  <img
                    src={authUser.profilePic}
                    alt={authUser.fullName}
                    className="size-12 rounded-full object-cover bg-base-100"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
                    {getInitials(authUser?.fullName)}
                  </div>
                )}
              </div>

              {/* Plus badge if no status or to add more */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMediaModalOpen(true);
                }}
                className="absolute -bottom-0.5 -right-0.5 size-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-md ring-2 ring-base-100 transition-transform active:scale-90"
                title="Add photo status"
              >
                <Plus size={13} className="stroke-[3]" />
              </button>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-base-content group-hover:text-emerald-600 transition-colors">
                  My Status
                </span>
                {hasMyStatus && (
                  <span className="badge badge-xs bg-emerald-500 text-white font-bold px-1.5 py-0.5">
                    {myStatuses.length}
                  </span>
                )}
              </div>

              <span className="text-xs text-base-content/60 truncate flex items-center gap-1">
                {hasMyStatus ? (
                  <>
                    <span>{formatStatusSidebarTime(latestMyStatus?.createdAt)}</span>
                    <span className="opacity-40">•</span>
                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Eye size={12} /> {totalMyViews} {totalMyViews === 1 ? "view" : "views"}
                    </span>
                  </>
                ) : (
                  "Tap to add status update"
                )}
              </span>
            </div>
          </div>

          {/* Quick Creation Shortcut Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsTextModalOpen(true)}
              className="size-9 rounded-full bg-base-100 hover:bg-emerald-500/15 text-base-content/70 hover:text-emerald-600 border border-base-content/10 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
              title="Create text status"
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="size-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
              title="Create photo status"
            >
              <Camera size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Recent Updates (Unviewed statuses) */}
      {recentUpdates.length > 0 && (
        <div className="space-y-1.5">
          <div className="px-2 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Recent Updates
            </span>
            <span className="text-[10px] font-bold text-base-content/40">
              {recentUpdates.length}
            </span>
          </div>

          <div className="space-y-1">
            {recentUpdates.map((group) => {
              const contactUser = group.user;
              const count = group.statuses.length;

              return (
                <button
                  key={contactUser._id}
                  type="button"
                  onClick={() => openStory(group, 0)}
                  className="w-full p-2.5 rounded-2xl flex items-center gap-3 hover:bg-base-200/60 transition-all text-left cursor-pointer group active:scale-[0.98]"
                >
                  {/* Avatar with bright emerald status ring */}
                  <div className="relative flex-shrink-0">
                    <div className="p-0.5 rounded-full ring-2 ring-emerald-500 ring-offset-2 ring-offset-base-100 shadow-sm group-hover:scale-105 transition-transform">
                      {contactUser.profilePic ? (
                        <img
                          src={contactUser.profilePic}
                          alt={contactUser.fullName}
                          className="size-11 rounded-full object-cover bg-base-100"
                        />
                      ) : (
                        <div className="size-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs">
                          {getInitials(contactUser.fullName)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-base-content truncate group-hover:text-emerald-600 transition-colors">
                        {contactUser.fullName}
                      </span>
                      {count > 1 && (
                        <span className="badge badge-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-none px-1.5">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-base-content/60 truncate flex items-center gap-1 font-medium">
                      <Clock size={11} className="opacity-70 flex-shrink-0" />
                      <span>{formatStatusSidebarTime(group.lastUpdated)}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Viewed Updates (Already seen statuses) */}
      {viewedUpdates.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
              Viewed Updates
            </span>
          </div>

          <div className="space-y-1">
            {viewedUpdates.map((group) => {
              const contactUser = group.user;
              const count = group.statuses.length;

              return (
                <button
                  key={contactUser._id}
                  type="button"
                  onClick={() => openStory(group, 0)}
                  className="w-full p-2.5 rounded-2xl flex items-center gap-3 hover:bg-base-200/50 transition-all text-left cursor-pointer group active:scale-[0.98] opacity-80 hover:opacity-100"
                >
                  {/* Avatar with muted gray status ring */}
                  <div className="relative flex-shrink-0">
                    <div className="p-0.5 rounded-full ring-2 ring-base-content/25 ring-offset-2 ring-offset-base-100 group-hover:scale-105 transition-transform">
                      {contactUser.profilePic ? (
                        <img
                          src={contactUser.profilePic}
                          alt={contactUser.fullName}
                          className="size-11 rounded-full object-cover bg-base-100"
                        />
                      ) : (
                        <div className="size-11 rounded-full bg-base-300 text-base-content/70 flex items-center justify-center font-bold text-xs">
                          {getInitials(contactUser.fullName)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-sm text-base-content truncate">
                        {contactUser.fullName}
                      </span>
                      {count > 1 && (
                        <span className="badge badge-xs badge-ghost text-base-content/50 font-medium px-1.5">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-base-content/50 truncate flex items-center gap-1">
                      <Clock size={11} className="opacity-60 flex-shrink-0" />
                      <span>{formatStatusSidebarTime(group.lastUpdated)}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State when no contact updates exist */}
      {otherUserStatuses.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 text-base-content/50 space-y-2">
          <div className="size-12 rounded-2xl bg-base-200/70 flex items-center justify-center text-emerald-500">
            <CircleDashed className="size-6 animate-spin-slow" />
          </div>
          <p className="text-sm font-semibold text-base-content/70">
            No contact updates yet
          </p>
          <p className="text-xs text-base-content/40 max-w-[220px]">
            When your contacts share a 24-hour status update, it will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusSidebar;
