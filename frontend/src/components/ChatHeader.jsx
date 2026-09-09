import { X, Phone, Video, Search, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatLastSeen } from "../lib/utils";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const canShowStatus = selectedUser?.showOnlineStatus !== false;
  const isOnline = canShowStatus && onlineUsers.includes(selectedUser?._id);

  return (
    <div className="px-3 sm:px-4 py-2.5 border-b border-base-300/80 bg-base-100/90 backdrop-blur-md flex items-center justify-between z-10 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="md:hidden btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-base-content mr-0.5"
          title="Back to chats"
        >
          <ArrowLeft size={19} />
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

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
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
