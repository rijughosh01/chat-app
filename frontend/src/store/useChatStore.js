import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { playNotificationSound } from "../lib/sounds";
import {
  savePendingMessage,
  getPendingMessages,
  removePendingMessage,
} from "../lib/offlineQueue";

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
  isProcessingQueue: false,
  disappearingTimer: 0,
  markMessagesAsSeenTimeout: null,

  processPendingMessagesQueue: async () => {
    if (get().isProcessingQueue) return;
    const pending = await getPendingMessages();
    if (!pending || pending.length === 0) return;

    set({ isProcessingQueue: true });
    let sentCount = 0;

    for (const item of pending) {
      try {
        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === item.tempId ? { ...m, status: "sending" } : m
          ),
        }));

        const res = await axiosInstance.post(
          `/messages/send/${item.receiverId}`,
          item.payload
        );

        await removePendingMessage(item.tempId);
        sentCount++;

        set((state) => ({
          messages: state.messages.map((m) =>
            m._id === item.tempId ? res.data : m
          ),
          users: state.users.map((u) =>
            u._id === item.receiverId
              ? {
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
                }
              : u
          ),
        }));
      } catch (err) {
        console.warn("Could not send queued message, will retry when online:", err);
        break;
      }
    }

    set({ isProcessingQueue: false });
    if (sentCount > 0) {
      toast.success(`Online! ${sentCount} queued message${sentCount > 1 ? "s" : ""} sent 🚀`);
    }
  },

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

      const finalizeSentMessage = (confirmedMessage) => {
        set((state) => {
          const alreadyExists = state.messages.some((m) => m._id === confirmedMessage._id);
          let newMessages;
          if (alreadyExists) {
            newMessages = state.messages.filter((m) => m._id !== tempId);
          } else {
            newMessages = state.messages.map((m) =>
              m._id === tempId ? confirmedMessage : m
            );
          }

          const updatedUsers = state.users.map((u) => {
            if (u._id === selectedUser._id) {
              return {
                ...u,
                lastMessage: {
                  text: confirmedMessage.text,
                  image: confirmedMessage.image,
                  audio: confirmedMessage.audio,
                  audioDuration: confirmedMessage.audioDuration,
                  sticker: confirmedMessage.sticker,
                  createdAt: confirmedMessage.createdAt,
                  senderId: confirmedMessage.senderId,
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
      };

      const socket = useAuthStore.getState().socket;
      let sentViaSocket = false;

      // Fast-path: Send directly over open WebSocket (<30ms roundtrip)
      if (socket && socket.connected) {
        try {
          const socketMessage = await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Socket send timeout")), 3500);
            socket.emit(
              "sendMessage",
              { ...payload, receiverId: selectedUser._id },
              (res) => {
                clearTimeout(timer);
                if (res?.status === "ok" && res?.message) {
                  resolve(res.message);
                } else {
                  reject(new Error(res?.error || "Socket send error"));
                }
              }
            );
          });

          finalizeSentMessage(socketMessage);
          sentViaSocket = true;
        } catch (socketErr) {
          console.warn("Socket fast-path failed, falling back to HTTP REST:", socketErr.message);
        }
      }

      // Fallback path: HTTP REST API (for when socket is reconnecting or disconnected)
      if (!sentViaSocket) {
        const res = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
          payload
        );
        finalizeSentMessage(res.data);
      }
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

  setDisappearingTimer: async (timerSeconds) => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const duration = Math.max(0, parseInt(timerSeconds, 10) || 0);
    try {
      await axiosInstance.post(`/messages/settings/${selectedUser._id}`, {
        disappearingTimer: duration,
      });
      set({ disappearingTimer: duration });

      if (duration === 0) {
        toast.success("Disappearing messages turned off");
      } else if (duration < 3600) {
        toast.success(
          `Disappearing messages set to ${Math.round(duration / 60)} minute${
            Math.round(duration / 60) > 1 ? "s" : ""
          } ⏱️`
        );
      } else if (duration < 86400) {
        toast.success(
          `Disappearing messages set to ${Math.round(duration / 3600)} hour${
            Math.round(duration / 3600) > 1 ? "s" : ""
          } ⏱️`
        );
      } else {
        toast.success(
          `Disappearing messages set to ${Math.round(duration / 86400)} day${
            Math.round(duration / 86400) > 1 ? "s" : ""
          } ⏱️`
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update timer");
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
      const socket = useAuthStore.getState().socket;
      if (socket && socket.connected) {
        socket.emit("markMessagesAsSeen", { senderId: userId });
      }

      await axiosInstance.post("/messages/seen", { userId });
      set((state) => ({
        messages: state.messages.map((msg) => {
          const senderId = (msg.senderId?._id || msg.senderId)?.toString();
          return senderId === userId.toString() ? { ...msg, seen: true, delivered: true } : msg;
        }),
        users: state.users.map((u) =>
          u._id?.toString() === userId.toString() ? { ...u, unreadCount: 0 } : u
        ),
      }));
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  },

  syncLatestMessages: async (userId) => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=30`);
      const fetched = res.data.messages || (Array.isArray(res.data) ? res.data : []);
      if (!fetched || fetched.length === 0) return;

      set((state) => {
        if (state.selectedUser?._id?.toString() !== userId.toString()) return state;

        const currentMap = new Map();
        state.messages.forEach((m) => currentMap.set(m._id, m));

        let hasChange = false;
        fetched.forEach((fm) => {
          if (!currentMap.has(fm._id)) {
            // Check if there was an optimistic temp message matching this
            const tempMatch = Array.from(currentMap.values()).find(
              (m) =>
                m._id?.startsWith?.("temp-") &&
                (m.senderId?._id || m.senderId)?.toString() ===
                  (fm.senderId?._id || fm.senderId)?.toString() &&
                ((m.text && m.text === fm.text) ||
                  (m.image && m.image === fm.image) ||
                  (m.audio && m.audio === fm.audio) ||
                  (m.sticker && m.sticker === fm.sticker))
            );
            if (tempMatch) {
              currentMap.delete(tempMatch._id);
            }
            currentMap.set(fm._id, fm);
            hasChange = true;
          } else {
            // Update seen or delivered status if changed
            const existing = currentMap.get(fm._id);
            if (
              existing.seen !== fm.seen ||
              existing.delivered !== fm.delivered ||
              existing.reactions?.length !== fm.reactions?.length
            ) {
              currentMap.set(fm._id, { ...existing, ...fm });
              hasChange = true;
            }
          }
        });

        if (!hasChange) return state;

        const sorted = Array.from(currentMap.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return { messages: sorted };
      });
    } catch (err) {
      console.error("Error syncing latest messages:", err);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Clean up first to avoid duplicate listeners
    socket.off("connect");
    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDelivered");
    socket.off("messagesDelivered");
    socket.off("deleteMessage");
    socket.off("editMessage");
    socket.off("messagesSeen");
    socket.off("messageReaction");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("chatSettingUpdated");

    // Automatically sync messages on reconnect
    socket.on("connect", () => {
      const { selectedUser, syncLatestMessages, processPendingMessagesQueue } = get();
      if (selectedUser?._id) {
        syncLatestMessages(selectedUser._id);
      }
      processPendingMessagesQueue();
    });

    // Real-time listener for non-blocking asynchronous link preview updates
    socket.on("messageUpdated", ({ _id, linkPreview }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === _id ? { ...m, linkPreview } : m
        ),
      }));
    });

    socket.on("chatSettingUpdated", ({ otherUserId, disappearingTimer }) => {
      const { selectedUser } = get();
      if (selectedUser && selectedUser._id?.toString() === otherUserId?.toString()) {
        set({ disappearingTimer });
        if (disappearingTimer > 0) {
          toast("Disappearing messages updated for this chat ⏱️", {
            icon: "⏱️",
          });
        } else {
          toast("Disappearing messages turned off for this chat", {
            icon: "ℹ️",
          });
        }
      }
    });

    socket.on("newMessage", (newMessage) => {
      const authUser = useAuthStore.getState().authUser;
      const { selectedUser } = get();

      const senderId = (newMessage.senderId?._id || newMessage.senderId)?.toString();
      const receiverId = (newMessage.receiverId?._id || newMessage.receiverId)?.toString();
      const selectedUserId = selectedUser?._id?.toString();
      const authUserId = authUser?._id?.toString();

      const isFromSelectedUser = Boolean(selectedUserId && senderId === selectedUserId);
      const isSentByMeToSelectedUser = Boolean(
        selectedUserId && authUserId && senderId === authUserId && receiverId === selectedUserId
      );

      // Only play notification sound and ack delivery if message is from another user
      if (senderId !== authUserId) {
        playNotificationSound();
        if (socket && socket.connected) {
          socket.emit("ackDelivery", {
            messageId: newMessage._id,
            senderId: senderId,
          });
        }
      }

      if (isFromSelectedUser || isSentByMeToSelectedUser) {
        set((state) => {
          // Check if already in messages
          const alreadyExists = state.messages.some((m) => m._id === newMessage._id);
          if (alreadyExists) return state;

          // Check for matching optimistic temporary message
          const tempIndex = state.messages.findIndex(
            (m) =>
              m._id?.startsWith?.("temp-") &&
              (m.senderId?._id || m.senderId)?.toString() === senderId &&
              ((m.text && m.text === newMessage.text) ||
                (m.image && m.image === newMessage.image) ||
                (m.audio && m.audio === newMessage.audio) ||
                (m.sticker && m.sticker === newMessage.sticker))
          );

          let updatedMessages;
          if (tempIndex !== -1) {
            updatedMessages = [...state.messages];
            updatedMessages[tempIndex] = newMessage;
          } else {
            updatedMessages = [...state.messages, newMessage];
          }

          return { messages: updatedMessages };
        });

        if (isFromSelectedUser && !newMessage.seen) {
          get().debouncedMarkMessagesAsSeen(selectedUserId);
        }
      }

      // Update last message & unread badge in sidebar
      set((state) => {
        const otherUserId = senderId === authUserId ? receiverId : senderId;
        const updatedUsers = state.users.map((user) => {
          if (user._id?.toString() === otherUserId) {
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
                : senderId === authUserId
                ? user.unreadCount || 0
                : (user.unreadCount || 0) + 1,
            };
          }
          return user;
        });

        updatedUsers.sort((a, b) => {
          const timeA = a.lastMessage
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;
          const timeB = b.lastMessage
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;
          return timeB - timeA;
        });

        return { users: updatedUsers };
      });
    });

    socket.on("deleteMessage", (deleted) => {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== deleted._id),
      }));
    });

    socket.on("editMessage", (editedMessage) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === editedMessage._id ? editedMessage : msg
        ),
      }));
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions } : msg
        ),
      }));
    });

    // Real-time WhatsApp Delivery Receipt: single check flips to double grey check
    socket.on("messageDelivered", ({ messageId }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id?.toString() === messageId?.toString()
            ? { ...m, delivered: true }
            : m
        ),
      }));
    });

    // Real-time WhatsApp Catch-up Delivery: all pending offline messages flip to double grey check
    socket.on("messagesDelivered", ({ receiverId, messageIds }) => {
      const idSet = new Set((messageIds || []).map((id) => id.toString()));
      set((state) => ({
        messages: state.messages.map((m) => {
          const mReceiverId = (m.receiverId?._id || m.receiverId)?.toString();
          if (
            idSet.has(m._id?.toString()) ||
            (receiverId && mReceiverId === receiverId.toString())
          ) {
            return { ...m, delivered: true };
          }
          return m;
        }),
      }));
    });

    socket.on("messagesSeen", ({ by }) => {
      set((state) => ({
        messages: state.messages.map((msg) => {
          const receiverId = (msg.receiverId?._id || msg.receiverId)?.toString();
          return receiverId === by?.toString()
            ? { ...msg, seen: true, delivered: true }
            : msg;
        }),
      }));
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
    socket.off("connect");
    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDelivered");
    socket.off("messagesDelivered");
    socket.off("deleteMessage");
    socket.off("editMessage");
    socket.off("messageReaction");
    socket.off("messagesSeen");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("userStatusChanged");
    socket.off("userPrivacyChanged");
    socket.off("userProfileUpdated");
    socket.off("chatSettingUpdated");
  },

  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      disappearingTimer: 0,
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

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    const { selectedUser, syncLatestMessages, processPendingMessagesQueue } =
      useChatStore.getState();
    if (selectedUser?._id) {
      syncLatestMessages(selectedUser._id);
    }
    processPendingMessagesQueue();
  });

  window.addEventListener("focus", () => {
    const { selectedUser, syncLatestMessages } = useChatStore.getState();
    if (selectedUser?._id) {
      syncLatestMessages(selectedUser._id);
    }
  });

  // Check queue shortly after boot
  setTimeout(() => {
    useChatStore.getState().processPendingMessagesQueue();
  }, 1500);

  // Periodically clean expired ephemeral messages from active view
  setInterval(() => {
    useChatStore.getState().pruneExpiredMessages();
  }, 10000);
}

