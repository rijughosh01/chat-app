import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Trash2, Pencil, Smile, Check, CheckCheck, Copy, Lock, Reply, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import ImageModal from "./ImageModal";
import AudioMessagePlayer from "./AudioMessagePlayer";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, formatDateDivider } from "../lib/utils";

const QUICK_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

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
    reactToMessage,
    markMessagesAsSeen,
    typingUsers,
    setReplyingMessage,
    hasMoreMessages,
    isLoadingMoreMessages,
    loadMoreMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const lastMessageIdRef = useRef(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null);
  const [modalImage, setModalImage] = useState(null);

  useEffect(() => {
    if (!selectedUser?._id) return;
    isInitialLoadRef.current = true;
    lastMessageIdRef.current = null;
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
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isNewMessageAtBottom =
      lastMessage && lastMessage._id !== lastMessageIdRef.current;

    if (isInitialLoadRef.current || isNewMessageAtBottom) {
      messageEndRef.current?.scrollIntoView({
        behavior: isInitialLoadRef.current ? "auto" : "smooth",
      });
      isInitialLoadRef.current = false;
      lastMessageIdRef.current = lastMessage?._id;
    }
  }, [messages]);

  const handleScroll = async () => {
    const container = chatScrollContainerRef.current;
    if (!container) return;

    if (
      container.scrollTop < 60 &&
      hasMoreMessages &&
      !isLoadingMoreMessages &&
      selectedUser?._id
    ) {
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      await loadMoreMessages(selectedUser._id);

      requestAnimationFrame(() => {
        if (chatScrollContainerRef.current) {
          const newScrollHeight = chatScrollContainerRef.current.scrollHeight;
          chatScrollContainerRef.current.scrollTop =
            newScrollHeight - prevScrollHeight + prevScrollTop;
        }
      });
    }
  };

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

  const getAggregatedReactions = (reactions) => {
    if (!reactions || reactions.length === 0) return [];
    const map = {};
    reactions.forEach((r) => {
      if (!map[r.emoji]) {
        map[r.emoji] = { emoji: r.emoji, count: 0, hasReacted: false };
      }
      map[r.emoji].count += 1;
      const rUserId =
        typeof r.userId === "object" ? r.userId._id || r.userId : r.userId;
      if (rUserId?.toString() === authUser?._id?.toString()) {
        map[r.emoji].hasReacted = true;
      }
    });
    return Object.values(map);
  };

  const handleCopyMessage = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard");
  };

  const scrollToMessage = (msgId) => {
    if (!msgId) return;
    const targetId = typeof msgId === "object" ? msgId._id : msgId;
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-emerald-500", "rounded-2xl", "bg-emerald-500/20");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-emerald-500", "rounded-2xl", "bg-emerald-500/20");
      }, 1600);
    } else {
      toast("Original message is further up in chat history");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100 min-w-0">
      <ChatHeader />

      {/* WhatsApp Chat Wall with Custom Wallpaper Texture */}
      <div
        ref={chatScrollContainerRef}
        onScroll={handleScroll}
        onClick={(e) => {
          if (e.target === chatScrollContainerRef.current) {
            setActiveMenuMsgId(null);
            setReactionPickerMsgId(null);
          }
        }}
        className="flex-1 overflow-y-auto px-2.5 sm:px-4 py-2.5 sm:py-3 space-y-2 wa-wallpaper overscroll-contain"
      >
        {/* Top Loading Spinner for Infinite Scroll */}
        {isLoadingMoreMessages && (
          <div className="flex justify-center py-2 animate-in fade-in duration-150">
            <div className="bg-base-100/90 dark:bg-base-300/80 px-3 py-1 rounded-full shadow-xs flex items-center gap-2 text-xs text-base-content/70 border border-base-300">
              <span className="loading loading-spinner loading-xs text-emerald-500"></span>
              <span>Loading earlier messages...</span>
            </div>
          </div>
        )}

        {!hasMoreMessages && messages.length >= 30 && (
          <div className="flex justify-center my-2">
            <span className="bg-base-200/80 text-base-content/50 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
              Beginning of chat history
            </span>
          </div>
        )}

        {/* End-to-End Encryption Notice Banner */}
        <div className="flex justify-center my-2">
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 max-w-md text-center shadow-xs">
            <Lock size={13} className="flex-shrink-0" />
            <span>Messages are secured and private. Chat securely with your contacts.</span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-base-content/40 text-xs text-center space-y-2">
            <div className="size-10 rounded-full bg-base-300/40 flex items-center justify-center text-base-content/50">
              👋
            </div>
            <p>No messages yet. Say hello to {selectedUser.fullName}!</p>
          </div>
        )}

        {messages.map((message, idx) => {
          const isSender = message.senderId === authUser._id;
          const currentDate = formatDateDivider(message.createdAt);
          const prevDate =
            idx > 0 ? formatDateDivider(messages[idx - 1].createdAt) : null;
          const showDateDivider = idx === 0 || currentDate !== prevDate;
          const aggregatedReactions = getAggregatedReactions(message.reactions);
          const hasReactions = aggregatedReactions.length > 0;

          const isSticker = Boolean(message.sticker && !message.text);

          return (
            <div key={message._id} className="space-y-1.5 animate-message-in">
              {/* WhatsApp Date Divider Pill */}
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="bg-base-300/80 backdrop-blur-xs text-base-content/75 px-3 py-0.5 rounded-lg text-[11px] font-semibold tracking-wide uppercase shadow-xs">
                    {currentDate}
                  </span>
                </div>
              )}

              {/* Message Row */}
              <div
                id={`msg-${message._id}`}
                className={`flex w-full transition-all duration-300 ${
                  isSender ? "justify-end" : "justify-start"
                } ${hasReactions ? "mb-3.5" : ""}`}
                ref={idx === messages.length - 1 ? messageEndRef : null}
              >
                {/* Bubble Container */}
                <div
                  onClick={() =>
                    setActiveMenuMsgId((prev) =>
                      prev === message._id ? null : message._id
                    )
                  }
                  className={`
                    relative group transition-all cursor-pointer
                    ${
                      isSticker
                        ? "p-1 bg-transparent border-none shadow-none"
                        : `max-w-[88%] sm:max-w-[65%] px-3 pt-2 pb-1.5 ${
                            isSender
                              ? "wa-bubble-outgoing rounded-2xl rounded-tr-xs"
                              : "wa-bubble-incoming rounded-2xl rounded-tl-xs"
                          }`
                    }
                  `}
                >
                  {/* Floating Action Menu on Hover or Tap */}
                  <div
                    className={`
                      absolute -top-7 ${isSender ? "right-1" : "left-1"}
                      transition-all duration-150
                      bg-base-100 dark:bg-[#111b21] border border-base-300 shadow-md rounded-full px-1.5 py-0.5
                      flex items-center gap-0.5 z-20
                      ${
                        activeMenuMsgId === message._id
                          ? "opacity-100 scale-100 pointer-events-auto"
                          : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
                      }
                    `}
                  >
                    {/* Reply action */}
                    <button
                      type="button"
                      className="p-1 hover:bg-base-200 rounded-full text-base-content/70 hover:text-base-content"
                      onClick={() => setReplyingMessage(message)}
                      title="Reply"
                    >
                      <Reply size={13} />
                    </button>

                    {/* Reaction trigger */}
                    <button
                      type="button"
                      className="p-1 hover:bg-base-200 rounded-full text-base-content/70 hover:text-base-content"
                      onClick={() =>
                        setReactionPickerMsgId(
                          reactionPickerMsgId === message._id ? null : message._id
                        )
                      }
                      title="React"
                    >
                      <Smile size={13} />
                    </button>

                    {/* Copy text action */}
                    {message.text && (
                      <button
                        type="button"
                        className="p-1 hover:bg-base-200 rounded-full text-base-content/70 hover:text-base-content"
                        onClick={() => handleCopyMessage(message.text)}
                        title="Copy text"
                      >
                        <Copy size={13} />
                      </button>
                    )}

                    {/* Sender Edit/Delete */}
                    {isSender && !message._id?.startsWith("temp-") && (
                      <>
                        <button
                          type="button"
                          className="p-1 hover:bg-base-200 rounded-full text-blue-500 hover:text-blue-600"
                          onClick={() => {
                            setEditingMessageId(message._id);
                            setEditValue(message.text || "");
                          }}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="p-1 hover:bg-base-200 rounded-full text-red-500 hover:text-red-600"
                          onClick={() => deleteMessage(message._id)}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Quick Reaction Palette */}
                  {reactionPickerMsgId === message._id && (
                    <div
                      className={`
                        absolute z-30 -top-9 ${isSender ? "right-2" : "left-2"}
                        bg-base-100 dark:bg-[#202c33] border border-base-300 shadow-xl rounded-full px-2 py-1
                        flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150
                      `}
                    >
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            reactToMessage(message._id, emoji);
                            setReactionPickerMsgId(null);
                          }}
                          className="hover:scale-130 transition-transform text-sm cursor-pointer p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quoted Message Preview Card (WhatsApp Style) */}
                  {message.replyTo && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        scrollToMessage(
                          message.replyTo._id || message.replyTo
                        );
                      }}
                      className="mb-1.5 p-2 rounded-xl bg-black/5 dark:bg-black/25 border-l-4 border-emerald-500 cursor-pointer hover:bg-black/10 dark:hover:bg-black/40 transition-colors text-left flex items-center justify-between gap-2 select-none overflow-hidden"
                      title="Click to jump to quoted message"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {typeof message.replyTo === "object" &&
                          message.replyTo.senderId
                            ? typeof message.replyTo.senderId === "object"
                              ? message.replyTo.senderId._id === authUser._id
                                ? "You"
                                : message.replyTo.senderId.fullName ||
                                  selectedUser.fullName
                              : message.replyTo.senderId === authUser._id
                              ? "You"
                              : selectedUser.fullName
                            : "Quoted message"}
                        </p>
                        <p className="text-xs opacity-75 truncate">
                          {typeof message.replyTo === "object" &&
                          message.replyTo.text
                            ? message.replyTo.text
                            : typeof message.replyTo === "object" &&
                              message.replyTo.image
                            ? "📷 Photo"
                            : typeof message.replyTo === "object" &&
                              message.replyTo.audio
                            ? "🎙️ Voice message"
                            : typeof message.replyTo === "object" &&
                              message.replyTo.sticker
                            ? "💟 Sticker"
                            : "Message"}
                        </p>
                      </div>
                      {typeof message.replyTo === "object" &&
                        message.replyTo.image && (
                          <img
                            src={message.replyTo.image}
                            alt="Quoted thumb"
                            className="size-8 object-cover rounded-md border border-base-300 flex-shrink-0"
                          />
                        )}
                      {typeof message.replyTo === "object" &&
                        message.replyTo.sticker && (
                          <img
                            src={message.replyTo.sticker}
                            alt="Quoted sticker"
                            className="size-8 object-contain flex-shrink-0"
                          />
                        )}
                    </div>
                  )}

                  {/* Inline Message Edit Form */}
                  {editingMessageId === message._id ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (editValue.trim()) {
                          await editMessage(message._id, { text: editValue });
                        }
                        setEditingMessageId(null);
                      }}
                      className="flex flex-col gap-2 min-w-[200px] py-1"
                    >
                      <input
                        className="input input-xs input-bordered w-full bg-base-100 text-base-content"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="submit"
                          className="btn btn-xs btn-success text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost"
                          onClick={() => setEditingMessageId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Attached Image with Lightbox Trigger */}
                      {message.image && (
                        <div
                          className="mb-1.5 rounded-lg overflow-hidden border border-black/10 cursor-pointer group/img relative"
                          onClick={() =>
                            setModalImage({
                              url: message.image,
                              sender: isSender ? "You" : selectedUser.fullName,
                              time: formatMessageTime(message.createdAt),
                            })
                          }
                          title="Click to view full image"
                        >
                          <img
                            src={message.image}
                            alt="Attachment"
                            className="max-h-[300px] w-full object-cover rounded-lg group-hover/img:scale-102 transition-transform duration-200"
                          />
                        </div>
                      )}

                      {/* Audio Voice Note Player */}
                      {message.audio && (
                        <div className="mb-1">
                          <AudioMessagePlayer
                            message={message}
                            isSender={isSender}
                          />
                        </div>
                      )}

                      {/* Sticker Content (WhatsApp Style) */}
                      {message.sticker && (
                        <div className="relative group/sticker inline-block select-none my-0.5">
                          <img
                            src={message.sticker}
                            alt="Sticker"
                            className="w-32 h-32 sm:w-36 sm:h-36 object-contain filter drop-shadow-md hover:scale-105 transition-transform duration-200 pointer-events-none"
                            loading="lazy"
                          />

                          {/* Floating WhatsApp Translucent Time & Status Pill for Stickers */}
                          {isSticker && (
                            <div className="absolute bottom-1 right-1 bg-black/55 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 select-none shadow-sm">
                              <span>{formatMessageTime(message.createdAt)}</span>
                              {isSender && (
                                <span className="inline-flex items-center">
                                  {message.status === "sending" || (typeof message._id === "string" && message._id.startsWith("temp-")) ? (
                                    <Clock className="size-2.5 opacity-80 animate-pulse" title="Sending..." />
                                  ) : message.status === "failed" ? (
                                    <AlertCircle className="size-2.5 text-red-400" title="Failed to send" />
                                  ) : message.seen ? (
                                    <CheckCheck className="size-3 text-[#53bdeb] stroke-[2.5]" title="Read" />
                                  ) : message.delivered ? (
                                    <CheckCheck className="size-3 opacity-85 stroke-[2]" title="Delivered" />
                                  ) : (
                                    <Check className="size-3 opacity-75 stroke-[2]" title="Sent" />
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* WhatsApp Text Content + Inline Time & Checkmark */}
                      {!isSticker && (
                        <div className="flex flex-wrap items-end justify-end gap-x-2 gap-y-1">
                          {message.text && (
                            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words flex-1 min-w-[60px] font-normal">
                              {message.text}
                            </p>
                          )}

                          {/* Inline Time & WhatsApp Checkmarks */}
                          <div className="inline-flex items-center gap-1 text-[11px] opacity-70 select-none pb-0.5 flex-shrink-0 self-end ml-auto">
                            <span>{formatMessageTime(message.createdAt)}</span>

                            {isSender && (
                              <span className="inline-flex items-center">
                                {message.status === "sending" || (typeof message._id === "string" && message._id.startsWith("temp-")) ? (
                                  <Clock
                                    className="size-3 opacity-60 animate-pulse"
                                    title="Sending..."
                                  />
                                ) : message.status === "failed" ? (
                                  <AlertCircle
                                    className="size-3 text-red-500"
                                    title="Failed to send"
                                  />
                                ) : message.seen ? (
                                  <CheckCheck
                                    className="size-3.5 text-[#53bdeb] stroke-[2.5]"
                                    title="Read"
                                  />
                                ) : message.delivered ? (
                                  <CheckCheck
                                    className="size-3.5 opacity-60 stroke-[2]"
                                    title="Delivered"
                                  />
                                ) : (
                                  <Check
                                    className="size-3.5 opacity-50 stroke-[2]"
                                    title="Sent"
                                  />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* WhatsApp Reaction Pill Badge (Overlapping Bottom Edge) */}
                  {hasReactions && (
                    <div
                      className={`
                        absolute -bottom-2.5 ${isSender ? "right-2" : "left-2"}
                        bg-base-100 dark:bg-[#202c33] border border-base-300 rounded-full px-1.5 py-0.5
                        shadow-xs text-xs flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform z-10
                      `}
                    >
                      {aggregatedReactions.map(({ emoji, count, hasReacted }) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => reactToMessage(message._id, emoji)}
                          className={`flex items-center gap-0.5 ${
                            hasReacted ? "font-bold text-emerald-500" : ""
                          }`}
                          title="Toggle reaction"
                        >
                          <span className="text-[11px]">{emoji}</span>
                          {count > 1 && (
                            <span className="text-[10px] font-bold text-base-content/70">
                              {count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Typing Indicator */}
        {isOtherUserTyping && (
          <div className="flex justify-start animate-message-in">
            <div className="wa-bubble-incoming rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-xs text-xs flex items-center gap-1.5">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {selectedUser?.fullName}
              </span>
              <span className="opacity-70">is typing</span>
              <span className="loading loading-dots loading-xs text-emerald-500"></span>
            </div>
          </div>
        )}
      </div>

      <MessageInput />

      {/* Full Screen Image Lightbox Modal */}
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          senderName={modalImage.sender}
          timestamp={modalImage.time}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  );
};

export default ChatContainer;
