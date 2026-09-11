import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { playNotificationSound } from "../lib/sounds";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: [],
  replyingMessage: null,
  hasMoreMessages: false,
  isLoadingMoreMessages: false,
  nextCursor: null,

  setReplyingMessage: (message) => set({ replyingMessage: message }),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

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

      set({
        messages: msgs,
        hasMoreMessages: hasMore,
        nextCursor,
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
    const { selectedUser, messages, users, replyingMessage } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!selectedUser || !authUser) return;

    // Generate a unique temporary ID
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

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
      delivered: false,
      seen: false,
      status: "sending",
    };

    // Immediately display the message in the chat and update sidebar (0ms latency!)
    const currentUsers = users.map((u) => {
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

    currentUsers.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    set({
      messages: [...messages, optimisticMessage],
      users: currentUsers,
      replyingMessage: null,
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

      // Seamlessly replace optimistic message with the confirmed server message
      set({
        messages: get().messages.map((m) =>
          m._id === tempId ? res.data : m
        ),
      });

      // Update sidebar with confirmed server data
      const updatedUsers = get().users.map((u) => {
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

      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error sending message:", error);
      // Mark optimistic message as failed
      set({
        messages: get().messages.map((m) =>
          m._id === tempId ? { ...m, status: "failed" } : m
        ),
      });
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/delete/${messageId}`);
      set({
        messages: get().messages.filter((msg) => msg._id !== messageId),
      });
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
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      });
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
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to react to message");
    }
  },

  markMessagesAsSeen: async (userId) => {
    try {
      await axiosInstance.post("/messages/seen", { userId });
      set({
        messages: get().messages.map((msg) =>
          msg.senderId === userId ? { ...msg, seen: true } : msg
        ),
        users: get().users.map((u) =>
          u._id === userId ? { ...u, unreadCount: 0 } : u
        ),
      });
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Clean up first to avoid duplicate listeners
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("editMessage");
    socket.off("messagesSeen");
    socket.off("messageReaction");
    socket.off("typing");
    socket.off("stopTyping");

    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages, users } = get();
      playNotificationSound();

      const isFromSelectedUser =
        selectedUser && newMessage.senderId === selectedUser._id;

      if (isFromSelectedUser) {
        set({
          messages: [...messages, newMessage],
        });
        if (!newMessage.seen) {
          get().markMessagesAsSeen(selectedUser._id);
        }
      }

      // Update last message & unread badge in sidebar
      const updatedUsers = users.map((user) => {
        if (user._id === newMessage.senderId) {
          return {
            ...user,
            lastMessage: {
              text: newMessage.text,
              image: newMessage.image,
              audio: newMessage.audio,
              audioDuration: newMessage.audioDuration,
              sticker: newMessage.sticker,
              createdAt: newMessage.createdAt,
              senderId: newMessage.senderId,
            },
            unreadCount: isFromSelectedUser
              ? 0
              : (user.unreadCount || 0) + 1,
          };
        }
        return user;
      });

      // Move latest conversation to top
      updatedUsers.sort((a, b) => {
        const timeA = a.lastMessage
          ? new Date(a.lastMessage.createdAt).getTime()
          : 0;
        const timeB = b.lastMessage
          ? new Date(b.lastMessage.createdAt).getTime()
          : 0;
        return timeB - timeA;
      });

      set({ users: updatedUsers });
    });

    socket.on("deleteMessage", (deleted) => {
      set({
        messages: get().messages.filter((msg) => msg._id !== deleted._id),
      });
    });

    socket.on("editMessage", (editedMessage) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === editedMessage._id ? editedMessage : msg
        ),
      });
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      });
    });

    socket.on("messagesSeen", ({ by }) => {
      set({
        messages: get().messages.map((msg) =>
          msg.receiverId === by ? { ...msg, seen: true } : msg
        ),
      });
    });

    socket.on("typing", ({ from }) => {
      set((state) => ({
        typingUsers: state.typingUsers.includes(from)
          ? state.typingUsers
          : [...state.typingUsers, from],
      }));
    });

    socket.on("stopTyping", ({ from }) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter((id) => id !== from),
      }));
    });

    socket.on(
      "userStatusChanged",
      ({ userId, isOnline, lastSeen, showOnlineStatus }) => {
        const { users, selectedUser } = get();

        const updatedUsers = users.map((u) => {
          if (u._id === userId) {
            return {
              ...u,
              lastSeen: lastSeen || u.lastSeen,
              showOnlineStatus:
                showOnlineStatus !== undefined
                  ? showOnlineStatus
                  : u.showOnlineStatus,
            };
          }
          return u;
        });

        const updatedSelected =
          selectedUser?._id === userId
            ? {
                ...selectedUser,
                lastSeen: lastSeen || selectedUser.lastSeen,
                showOnlineStatus:
                  showOnlineStatus !== undefined
                    ? showOnlineStatus
                    : selectedUser.showOnlineStatus,
              }
            : selectedUser;

        set({ users: updatedUsers, selectedUser: updatedSelected });
      }
    );

    socket.on("userPrivacyChanged", ({ userId, showOnlineStatus }) => {
      const { users, selectedUser } = get();
      const updatedUsers = users.map((u) =>
        u._id === userId ? { ...u, showOnlineStatus } : u
      );
      const updatedSelected =
        selectedUser?._id === userId
          ? { ...selectedUser, showOnlineStatus }
          : selectedUser;

      set({ users: updatedUsers, selectedUser: updatedSelected });
    });

    socket.on("userProfileUpdated", ({ userId, profilePic, user }) => {
      const { users, selectedUser } = get();
      const updatedUsers = users.map((u) => {
        if (u._id === userId) {
          return {
            ...u,
            profilePic: profilePic || u.profilePic,
            ...(user || {}),
          };
        }
        return u;
      });

      const updatedSelected =
        selectedUser?._id === userId
          ? {
              ...selectedUser,
              profilePic: profilePic || selectedUser.profilePic,
              ...(user || {}),
            }
          : selectedUser;

      set({ users: updatedUsers, selectedUser: updatedSelected });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("editMessage");
    socket.off("messageReaction");
    socket.off("messagesSeen");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("userStatusChanged");
    socket.off("userPrivacyChanged");
    socket.off("userProfileUpdated");
  },

  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      replyingMessage: null,
      hasMoreMessages: false,
      isLoadingMoreMessages: false,
      nextCursor: null,
    });
    if (selectedUser) {
      set((state) => ({
        users: state.users.map((u) =>
          u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
        ),
      }));
    }
  },
}));
