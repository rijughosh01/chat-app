import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";

export const createSettingsSlice = (set, get) => ({
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  disappearingTimer: 0,

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

  setSelectedUser: (selectedUser) => {
    set({
      selectedUser,
      disappearingTimer: 0,
      replyingMessage: null,
      hasMoreMessages: false,
      isLoadingMoreMessages: false,
      nextCursor: null,
      isSearchOpen: false,
      searchQuery: "",
      activeSearchMatchIndex: 0,
    });
    if (selectedUser) {
      set((state) => ({
        users: state.users.map((u) =>
          u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
        ),
      }));
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
});
