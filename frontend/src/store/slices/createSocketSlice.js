import toast from "react-hot-toast";
import { useAuthStore } from "../useAuthStore";
import { playNotificationSound } from "../../lib/sounds";

export const createSocketSlice = (set, get) => ({
  typingUsers: [],

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Clean up first to avoid duplicate listeners
    socket.off("connect");
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("editMessage");
    socket.off("messagesSeen");
    socket.off("messageReaction");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("chatSettingUpdated");
    socket.off("userStatusChanged");
    socket.off("userPrivacyChanged");
    socket.off("userProfileUpdated");

    // Automatically sync messages on reconnect
    socket.on("connect", () => {
      const { selectedUser, syncLatestMessages, processPendingMessagesQueue } =
        get();
      if (selectedUser?._id) {
        syncLatestMessages(selectedUser._id);
      }
      processPendingMessagesQueue();
    });

    socket.on("chatSettingUpdated", ({ otherUserId, disappearingTimer }) => {
      const { selectedUser } = get();
      if (
        selectedUser &&
        selectedUser._id?.toString() === otherUserId?.toString()
      ) {
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

      const senderId = (
        newMessage.senderId?._id || newMessage.senderId
      )?.toString();
      const receiverId = (
        newMessage.receiverId?._id || newMessage.receiverId
      )?.toString();
      const selectedUserId = selectedUser?._id?.toString();
      const authUserId = authUser?._id?.toString();

      const isFromSelectedUser = Boolean(
        selectedUserId && senderId === selectedUserId
      );
      const isSentByMeToSelectedUser = Boolean(
        selectedUserId &&
          authUserId &&
          senderId === authUserId &&
          receiverId === selectedUserId
      );

      // Only play notification sound if message is from another user
      if (senderId !== authUserId) {
        playNotificationSound();
      }

      if (isFromSelectedUser || isSentByMeToSelectedUser) {
        set((state) => {
          // Check if already in messages
          const alreadyExists = state.messages.some(
            (m) => m._id === newMessage._id
          );
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

    socket.on("messagesSeen", ({ by }) => {
      set((state) => ({
        messages: state.messages.map((msg) => {
          const receiverId = (
            msg.receiverId?._id || msg.receiverId
          )?.toString();
          return receiverId === by?.toString() ? { ...msg, seen: true } : msg;
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
});
