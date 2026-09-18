import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useStatusStore = create((set, get) => ({
  myStatuses: [],
  otherUserStatuses: [],
  isLoading: false,
  isPosting: false,

  // Story Viewer Modal State
  activeStoryUser: null, // null | 'me' | { _id, fullName, profilePic }
  activeStoryIndex: 0,
  isViewerOpen: false,

  // Create Modals State
  isTextModalOpen: false,
  isMediaModalOpen: false,

  // Viewers Drawer State (for viewing own status viewers)
  isViewersListOpen: false,
  activeStatusForViewers: null,

  setIsTextModalOpen: (isOpen) => set({ isTextModalOpen: isOpen }),
  setIsMediaModalOpen: (isOpen) => set({ isMediaModalOpen: isOpen }),
  setIsViewersListOpen: (isOpen, status = null) =>
    set({ isViewersListOpen: isOpen, activeStatusForViewers: status }),

  getStatuses: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/status");
      set({
        myStatuses: res.data.myStatuses || [],
        otherUserStatuses: res.data.otherUserStatuses || [],
      });
    } catch (error) {
      console.error("Error fetching statuses:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  createStatus: async (statusData) => {
    set({ isPosting: true });
    try {
      const res = await axiosInstance.post("/status", statusData);
      set((state) => {
        const alreadyExists = state.myStatuses.some((s) => s._id === res.data._id);
        return {
          myStatuses: alreadyExists ? state.myStatuses : [...state.myStatuses, res.data],
          isTextModalOpen: false,
          isMediaModalOpen: false,
        };
      });
      toast.success("Status posted successfully! ✨");
    } catch (error) {
      console.error("Error posting status:", error);
      toast.error(error.response?.data?.message || "Failed to post status");
    } finally {
      set({ isPosting: false });
    }
  },

  markStatusAsViewed: async (statusId) => {
    if (!statusId) return;
    const authUser = useAuthStore.getState().authUser;
    if (!authUser) return;

    try {
      await axiosInstance.post(`/status/view/${statusId}`);

      set((state) => {
        // Optimistically update otherUserStatuses to mark viewed
        const updatedOtherUsers = state.otherUserStatuses.map((group) => {
          let allViewed = true;
          const updatedStatuses = group.statuses.map((s) => {
            if (s._id === statusId) {
              const alreadyViewed = s.viewers?.some(
                (v) => (v.userId?._id || v.userId)?.toString() === authUser._id.toString()
              );
              if (!alreadyViewed) {
                return {
                  ...s,
                  viewers: [
                    ...(s.viewers || []),
                    {
                      userId: {
                        _id: authUser._id,
                        fullName: authUser.fullName,
                        profilePic: authUser.profilePic,
                      },
                      viewedAt: new Date().toISOString(),
                    },
                  ],
                };
              }
            }
            return s;
          });

          allViewed = updatedStatuses.every((s) =>
            s.viewers?.some(
              (v) => (v.userId?._id || v.userId)?.toString() === authUser._id.toString()
            )
          );

          return {
            ...group,
            statuses: updatedStatuses,
            hasUnviewed: !allViewed,
          };
        });

        return { otherUserStatuses: updatedOtherUsers };
      });
    } catch (error) {
      console.error("Error marking status viewed:", error);
    }
  },

  deleteStatus: async (statusId) => {
    try {
      await axiosInstance.delete(`/status/${statusId}`);
      set((state) => {
        const remaining = state.myStatuses.filter((s) => s._id !== statusId);
        const { activeStoryUser, activeStoryIndex, closeStory } = state;

        let nextIndex = activeStoryIndex;
        if (activeStoryUser === "me") {
          if (remaining.length === 0) {
            closeStory();
          } else if (activeStoryIndex >= remaining.length) {
            nextIndex = Math.max(0, remaining.length - 1);
          }
        }

        return {
          myStatuses: remaining,
          activeStoryIndex: nextIndex,
          activeStatusForViewers:
            state.activeStatusForViewers?._id === statusId
              ? null
              : state.activeStatusForViewers,
        };
      });

      toast.success("Status deleted");
    } catch (error) {
      console.error("Error deleting status:", error);
      toast.error(error.response?.data?.message || "Failed to delete status");
    }
  },

  openStory: (userTypeOrUser, startIndex = 0) => {
    set({
      activeStoryUser: userTypeOrUser,
      activeStoryIndex: startIndex,
      isViewerOpen: true,
      isViewersListOpen: false,
    });
  },

  closeStory: () => {
    set({
      isViewerOpen: false,
      activeStoryUser: null,
      activeStoryIndex: 0,
      isViewersListOpen: false,
      activeStatusForViewers: null,
    });
  },

  nextSlide: () => {
    const { activeStoryUser, activeStoryIndex, myStatuses, otherUserStatuses, closeStory } =
      get();

    const currentStatuses =
      activeStoryUser === "me"
        ? myStatuses
        : activeStoryUser?.statuses || [];

    if (activeStoryIndex < currentStatuses.length - 1) {
      set({ activeStoryIndex: activeStoryIndex + 1 });
    } else {
      // Reached the end of this user's story
      if (activeStoryUser === "me") {
        // Automatically transition to the first friend's story if available
        if (otherUserStatuses.length > 0) {
          set({
            activeStoryUser: otherUserStatuses[0],
            activeStoryIndex: 0,
          });
        } else {
          closeStory();
        }
      } else {
        // Find next friend's story
        const currentIndex = otherUserStatuses.findIndex(
          (g) => g.user._id === activeStoryUser?.user?._id
        );
        if (currentIndex !== -1 && currentIndex < otherUserStatuses.length - 1) {
          set({
            activeStoryUser: otherUserStatuses[currentIndex + 1],
            activeStoryIndex: 0,
          });
        } else {
          closeStory();
        }
      }
    }
  },

  prevSlide: () => {
    const { activeStoryUser, activeStoryIndex, otherUserStatuses, closeStory } = get();

    if (activeStoryIndex > 0) {
      set({ activeStoryIndex: activeStoryIndex - 1 });
    } else {
      // If at first slide of friend's story, move to previous friend's story
      if (activeStoryUser !== "me") {
        const currentIndex = otherUserStatuses.findIndex(
          (g) => g.user._id === activeStoryUser?.user?._id
        );
        if (currentIndex > 0) {
          const prevUserGroup = otherUserStatuses[currentIndex - 1];
          set({
            activeStoryUser: prevUserGroup,
            activeStoryIndex: prevUserGroup.statuses.length - 1,
          });
        } else {
          closeStory();
        }
      }
    }
  },

  subscribeToStatusEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newStatus");
    socket.off("statusViewed");
    socket.off("statusDeleted");

    socket.on("newStatus", (newStatus) => {
      const authUser = useAuthStore.getState().authUser;
      if (!authUser) return;

      const authorId = (newStatus.userId?._id || newStatus.userId)?.toString();
      const isMyStatus = authorId === authUser._id?.toString();

      if (isMyStatus) {
        set((state) => {
          const exists = state.myStatuses.some((s) => s._id === newStatus._id);
          if (exists) return state;
          return { myStatuses: [...state.myStatuses, newStatus] };
        });
      } else {
        set((state) => {
          const authorUser = newStatus.userId;
          let userFound = false;

          const updatedOthers = state.otherUserStatuses.map((group) => {
            if (group.user._id?.toString() === authorId) {
              userFound = true;
              const exists = group.statuses.some((s) => s._id === newStatus._id);
              if (exists) return group;
              return {
                ...group,
                statuses: [...group.statuses, newStatus],
                hasUnviewed: true,
                lastUpdated: newStatus.createdAt,
              };
            }
            return group;
          });

          if (!userFound) {
            updatedOthers.unshift({
              user: authorUser,
              statuses: [newStatus],
              hasUnviewed: true,
              lastUpdated: newStatus.createdAt,
            });
          }

          // Sort so unviewed updates are first
          updatedOthers.sort((a, b) => {
            if (a.hasUnviewed !== b.hasUnviewed) {
              return a.hasUnviewed ? -1 : 1;
            }
            return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
          });

          return { otherUserStatuses: updatedOthers };
        });
      }
    });

    socket.on("statusViewed", ({ statusId, viewer, authorId }) => {
      const authUser = useAuthStore.getState().authUser;
      if (!authUser) return;

      // If it's my status that was viewed, update viewer list live!
      if (authorId === authUser._id?.toString()) {
        set((state) => {
          let updatedActiveForViewers = state.activeStatusForViewers;

          const updatedMyStatuses = state.myStatuses.map((s) => {
            if (s._id === statusId) {
              const alreadyInList = s.viewers?.some(
                (v) =>
                  (v.userId?._id || v.userId)?.toString() ===
                  (viewer.userId?._id || viewer.userId)?.toString()
              );
              if (alreadyInList) return s;
              const updatedS = {
                ...s,
                viewers: [...(s.viewers || []), viewer],
              };
              if (state.activeStatusForViewers?._id === statusId) {
                updatedActiveForViewers = updatedS;
              }
              return updatedS;
            }
            return s;
          });

          return {
            myStatuses: updatedMyStatuses,
            activeStatusForViewers: updatedActiveForViewers,
          };
        });
      }
    });

    socket.on("statusDeleted", ({ statusId, userId }) => {
      set((state) => {
        const updatedMy = state.myStatuses.filter((s) => s._id !== statusId);
        const updatedOthers = state.otherUserStatuses
          .map((group) => {
            if (group.user._id?.toString() === userId) {
              const remaining = group.statuses.filter((s) => s._id !== statusId);
              return { ...group, statuses: remaining };
            }
            return group;
          })
          .filter((group) => group.statuses.length > 0);

        const { activeStoryUser, activeStoryIndex, closeStory } = state;
        if (activeStoryUser === "me" && updatedMy.length === 0) {
          closeStory();
        } else if (
          activeStoryUser?.user?._id?.toString() === userId &&
          !updatedOthers.some((g) => g.user._id?.toString() === userId)
        ) {
          closeStory();
        }

        return {
          myStatuses: updatedMy,
          otherUserStatuses: updatedOthers,
          activeStatusForViewers:
            state.activeStatusForViewers?._id === statusId
              ? null
              : state.activeStatusForViewers,
        };
      });
    });
  },

  unsubscribeFromStatusEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newStatus");
    socket.off("statusViewed");
    socket.off("statusDeleted");
  },
}));
