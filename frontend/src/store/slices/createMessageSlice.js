import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { useAuthStore } from "../useAuthStore";
import { savePendingMessage } from "../../lib/offlineQueue";

export const createMessageSlice = (set, get) => ({
  messages: [],
  isMessagesLoading: false,
  replyingMessage: null,
  hasMoreMessages: false,
  isLoadingMoreMessages: false,
  nextCursor: null,
  isSearchOpen: false,
  searchQuery: "",
  activeSearchMatchIndex: 0,

  setIsSearchOpen: (isOpen) =>
    set((state) => ({
      isSearchOpen: isOpen,
      searchQuery: isOpen ? state.searchQuery : "",
      activeSearchMatchIndex: 0,
    })),
  setSearchQuery: (query) =>
    set({ searchQuery: query, activeSearchMatchIndex: 0 }),
  setActiveSearchMatchIndex: (index) =>
    set({ activeSearchMatchIndex: index }),

  setReplyingMessage: (message) => set({ replyingMessage: message }),

  getMessages: async (userId) => {
    set({
      isMessagesLoading: true,
      hasMoreMessages: false,
      nextCursor: null,
    });
    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=30`);
      const msgs = res.data.messages || (Array.isArray(res.data) ? res.data : []);
      const hasMore = Boolean(res.data.hasMore);
      const nextCursor = res.data.nextCursor || null;
      const disappearingTimer = res.data.disappearingTimer || 0;

      set({
        messages: msgs,
        hasMoreMessages: hasMore,
        nextCursor,
        disappearingTimer,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async (userId) => {
    const { hasMoreMessages, isLoadingMoreMessages, nextCursor, messages } =
      get();
    if (!hasMoreMessages || isLoadingMoreMessages || !nextCursor) return false;

    set({ isLoadingMoreMessages: true });
    try {
      const res = await axiosInstance.get(
        `/messages/${userId}?cursor=${encodeURIComponent(nextCursor)}&limit=30`
      );
      const olderMessages = res.data.messages || [];
      const hasMore = Boolean(res.data.hasMore);
      const newNextCursor = res.data.nextCursor || null;

      // Filter duplicates by _id
      const existingIds = new Set(messages.map((m) => m._id));
      const uniqueOlder = olderMessages.filter((m) => !existingIds.has(m._id));

      set({
        messages: [...uniqueOlder, ...messages],
        hasMoreMessages: hasMore,
        nextCursor: newNextCursor,
      });
      return true;
    } catch (error) {
      console.error("Failed to load older messages:", error);
      return false;
    } finally {
      set({ isLoadingMoreMessages: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, disappearingTimer } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!selectedUser || !authUser) return;

    // Generate a unique temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const expireAt =
      disappearingTimer > 0
        ? new Date(Date.now() + disappearingTimer * 1000).toISOString()
        : null;

    const replyingMessage = get().replyingMessage;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      audio: messageData.audio,
      audioDuration: messageData.audioDuration || 0,
      sticker: messageData.sticker,
      replyTo: replyingMessage ? { ...replyingMessage } : null,
      createdAt: nowIso,
      expireAt,
      delivered: false,
      seen: false,
      status: "sending",
    };

    // If client is currently offline, queue immediately in IndexedDB
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineMsg = { ...optimisticMessage, status: "queued" };
      set((state) => {
        const updatedUsers = state.users.map((u) => {
          if (u._id === selectedUser._id) {
            return {
              ...u,
              lastMessage: {
                text: messageData.text,
                image: messageData.image,
                audio: messageData.audio,
                audioDuration: messageData.audioDuration,
                sticker: messageData.sticker,
                createdAt: nowIso,
                senderId: authUser._id,
              },
            };
          }
          return u;
        });

        updatedUsers.sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        return {
          messages: [...state.messages, offlineMsg],
          users: updatedUsers,
          replyingMessage: null,
        };
      });

      await savePendingMessage({
        tempId,
        receiverId: selectedUser._id,
        payload: {
          ...messageData,
          replyTo: replyingMessage?._id || undefined,
        },
        createdAt: nowIso,
      });

      toast("Offline: Message queued! Will send when reconnected 📶", {
        icon: "⏳",
      });
      return;
    }

    // Immediately display the message in the chat and update sidebar (0ms latency!)
    set((state) => {
      const updatedUsers = state.users.map((u) => {
        if (u._id === selectedUser._id) {
          return {
            ...u,
            lastMessage: {
              text: messageData.text,
              image: messageData.image,
              audio: messageData.audio,
              audioDuration: messageData.audioDuration,
              sticker: messageData.sticker,
              createdAt: nowIso,
              senderId: authUser._id,
            },
          };
        }
        return u;
      });

      updatedUsers.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return {
        messages: [...state.messages, optimisticMessage],
        users: updatedUsers,
        replyingMessage: null,
      };
    });

    try {
      const payload = {
        ...messageData,
        replyTo: replyingMessage?._id || undefined,
      };

      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        payload
      );

      // Seamlessly replace optimistic message with the confirmed server message without duplicating
      set((state) => {
        const alreadyExists = state.messages.some((m) => m._id === res.data._id);
        let newMessages;
        if (alreadyExists) {
          newMessages = state.messages.filter((m) => m._id !== tempId);
        } else {
          newMessages = state.messages.map((m) =>
            m._id === tempId ? res.data : m
          );
        }

        const updatedUsers = state.users.map((u) => {
          if (u._id === selectedUser._id) {
            return {
              ...u,
              lastMessage: {
                text: res.data.text,
                image: res.data.image,
                audio: res.data.audio,
                audioDuration: res.data.audioDuration,
                sticker: res.data.sticker,
                createdAt: res.data.createdAt,
                senderId: res.data.senderId,
              },
            };
          }
          return u;
        });

        updatedUsers.sort((a, b) => {
          const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        return {
          messages: newMessages,
          users: updatedUsers,
        };
      });
    } catch (error) {
      console.error("Error sending message:", error);
      const isNetworkError =
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        !error.response ||
        error.code === "ERR_NETWORK";

      if (isNetworkError) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempId ? { ...m, status: "queued" } : m
          ),
        }));

        await savePendingMessage({
          tempId,
          receiverId: selectedUser._id,
          payload: {
            ...messageData,
            replyTo: replyingMessage?._id || undefined,
          },
          createdAt: nowIso,
        });

        toast("Connection lost. Message queued to auto-send 📶", {
          icon: "⏳",
        });
      } else {
        // Mark optimistic message as failed
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === tempId ? { ...m, status: "failed" } : m
          ),
        }));
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
      toast.success("Message deleted");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  editMessage: async (messageId, newData) => {
    try {
      const res = await axiosInstance.patch(
        `/messages/edit/${messageId}`,
        newData
      );
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      }));
      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to edit message");
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/messages/react/${messageId}`, {
        emoji,
      });
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      }));
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to react to message");
    }
  },

  debouncedMarkMessagesAsSeen: (userId) => {
    if (!userId) return;
    const { markMessagesAsSeenTimeout } = get();
    if (markMessagesAsSeenTimeout) {
      clearTimeout(markMessagesAsSeenTimeout);
    }
    const timeout = setTimeout(() => {
      get().markMessagesAsSeen(userId);
    }, 300);
    set({ markMessagesAsSeenTimeout: timeout });
  },

  markMessagesAsSeen: async (userId) => {
    if (!userId) return;
    try {
      await axiosInstance.post("/messages/seen", { userId });
      set((state) => ({
        messages: state.messages.map((msg) => {
          const senderId = (msg.senderId?._id || msg.senderId)?.toString();
          return senderId === userId.toString() ? { ...msg, seen: true } : msg;
        }),
        users: state.users.map((u) =>
          u._id?.toString() === userId.toString() ? { ...u, unreadCount: 0 } : u
        ),
      }));
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  },

  pruneExpiredMessages: () => {
    const now = new Date();
    const { messages } = get();
    if (!messages || messages.length === 0) return;
    const validMessages = messages.filter(
      (m) => !m.expireAt || new Date(m.expireAt) > now
    );
    if (validMessages.length !== messages.length) {
      set({ messages: validMessages });
    }
  },
});
