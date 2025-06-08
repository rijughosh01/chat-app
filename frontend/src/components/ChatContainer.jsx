import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Trash2, Pencil } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const bubbleColors = [
  "chat-bubble-primary",
  "chat-bubble-secondary",
  "chat-bubble-accent",
  "chat-bubble-neutral",
  "chat-bubble-info",
  "chat-bubble-success",
  "chat-bubble-warning",
  "chat-bubble-error",
];

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    editMessage,
    markMessagesAsSeen,
    typingUsers,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id);
    subscribeToMessages();

    markMessagesAsSeen(selectedUser._id);

    return () => unsubscribeFromMessages();
  }, [
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsSeen,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const isOtherUserTyping =
    selectedUser && typingUsers && typingUsers.includes(selectedUser._id);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={idx === messages.length - 1 ? messageEndRef : null}
            onClick={() =>
              setSelectedMessageId(
                selectedMessageId === message._id ? null : message._id
              )
            }
            style={{ cursor: "pointer" }}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
              {message.senderId === authUser._id &&
                selectedMessageId === message._id && (
                  <>
                    <button
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMessageId(message._id);
                        setEditValue(message.text || "");
                      }}
                      title="Edit message"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      className="ml-2 text-red-600 hover:text-red-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(message._id);
                        setSelectedMessageId(null);
                      }}
                      title="Delete message"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
            </div>
            <div
              className={`chat-bubble flex flex-col ${
                bubbleColors[idx % bubbleColors.length]
              }`}
            >
              {editingMessageId === message._id ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await editMessage(message._id, { text: editValue });
                    setEditingMessageId(null);
                  }}
                  className="flex flex-col gap-2"
                >
                  <input
                    className="border rounded px-2 py-1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="text-green-700 font-semibold px-3 py-1 rounded hover:bg-slate-300 transition"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-gray-700 font-semibold px-3 py-1 rounded hover:bg-slate-300 transition"
                      onClick={() => setEditingMessageId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {message.image && (
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="sm:max-w-[200px] rounded-md mb-2"
                    />
                  )}
                  {message.text && <p>{message.text}</p>}
                </>
              )}

              {message.senderId === authUser._id && (
                <div className="text-xs mt-1 flex items-center gap-1">
                  {message.seen ? (
                    <span className="text-blue-500">Seen</span>
                  ) : message.delivered ? (
                    <span className="text-gray-400">Delivered</span>
                  ) : (
                    <span className="text-gray-400">Sent</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isOtherUserTyping && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-200 text-base-content/70">
              <span>Typing...</span>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
