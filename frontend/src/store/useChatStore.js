import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
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

  markMessagesAsSeen: async (userId) => {
    try {
      await axiosInstance.post("/messages/seen", { userId });
      set({
        messages: get().messages.map((msg) =>
          msg.senderId === userId ? { ...msg, seen: true } : msg
        ),
      });
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to mark messages as seen"
      );
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, markMessagesAsSeen } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
      if (!newMessage.seen) {
        markMessagesAsSeen(selectedUser._id);
      }
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

    socket.on("messagesSeen", ({ by }) => {
      set({
        messages: get().messages.map((msg) =>
          msg.receiverId === by ? { ...msg, seen: true } : msg
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("deleteMessage");
    socket.off("editMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
