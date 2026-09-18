import { createPortal } from "react-dom";
import { X, Eye, Trash2, Clock } from "lucide-react";
import { useStatusStore } from "../../store/useStatusStore";

function formatViewTime(dateStr) {
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

const StatusViewersModal = () => {
  const {
    isViewersListOpen,
    activeStatusForViewers,
    setIsViewersListOpen,
    deleteStatus,
  } = useStatusStore();

  if (!isViewersListOpen || !activeStatusForViewers) return null;

  const viewers = activeStatusForViewers.viewers || [];
  const count = viewers.length;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div
        className="fixed inset-0"
        onClick={() => setIsViewersListOpen(false)}
      />

      <div className="relative w-full sm:max-w-md bg-base-100 rounded-t-3xl sm:rounded-3xl border border-base-content/10 shadow-2xl flex flex-col max-h-[85vh] z-10 animate-in slide-in-from-bottom duration-300 safe-pb overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-content/10 flex items-center justify-between flex-shrink-0 bg-base-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Eye size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-base-content">
                Viewed by {count} {count === 1 ? "person" : "people"}
              </h3>
              <p className="text-xs text-base-content/50">
                {count > 0 ? "Anyone who sees this status will appear here" : "No views yet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={async () => {
                if (window.confirm("Delete this status update?")) {
                  await deleteStatus(activeStatusForViewers._id);
                  setIsViewersListOpen(false);
                }
              }}
              className="size-9 rounded-full flex items-center justify-center hover:bg-error/15 text-base-content/60 hover:text-error transition-colors"
              title="Delete this status"
            >
              <Trash2 size={17} />
            </button>
            <button
              type="button"
              onClick={() => setIsViewersListOpen(false)}
              className="size-9 rounded-full flex items-center justify-center hover:bg-base-200 text-base-content/70 hover:text-base-content transition-colors"
              title="Close"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Viewers List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 no-scrollbar">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-2.5 text-base-content/50">
              <div className="size-14 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40">
                <Eye size={26} />
              </div>
              <p className="text-sm font-semibold text-base-content/70">
                No views yet
              </p>
              <p className="text-xs max-w-xs text-base-content/45">
                When your contacts watch this status update, their name and view time will show up here.
              </p>
            </div>
          ) : (
            viewers.map((item, idx) => {
              const viewerUser = item.userId || {};
              return (
                <div
                  key={item._id || idx}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-base-200/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {viewerUser.profilePic ? (
                      <img
                        src={viewerUser.profilePic}
                        alt={viewerUser.fullName || "Viewer"}
                        className="size-10 rounded-full object-cover ring-1 ring-base-content/10 flex-shrink-0"
                      />
                    ) : (
                      <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {getInitials(viewerUser.fullName)}
                      </div>
                    )}
                    <div className="min-w-0 flex flex-col">
                      <span className="font-semibold text-sm text-base-content truncate">
                        {viewerUser.fullName || "NexChat User"}
                      </span>
                      <span className="text-[11px] text-base-content/50 flex items-center gap-1 font-medium">
                        <Clock size={11} className="flex-shrink-0 opacity-70" />
                        <span>{formatViewTime(item.viewedAt)}</span>
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-none px-2 py-0.5">
                    Seen
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StatusViewersModal;
