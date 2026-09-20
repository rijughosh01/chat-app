import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import {
  getPendingMessages,
  removePendingMessage,
} from "../../lib/offlineQueue";

export const createSyncSlice = (set, get) => ({
  isProcessingQueue: false,

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
        console.warn(
          "Could not send queued message, will retry when online:",
          err
        );
        break;
      }
    }

    set({ isProcessingQueue: false });
    if (sentCount > 0) {
      toast.success(
        `Online! ${sentCount} queued message${sentCount > 1 ? "s" : ""} sent 🚀`
      );
    }
  },

  syncLatestMessages: async (userId) => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/messages/${userId}?limit=30`);
      const fetched =
        res.data.messages || (Array.isArray(res.data) ? res.data : []);
      if (!fetched || fetched.length === 0) return;

      set((state) => {
        if (state.selectedUser?._id?.toString() !== userId.toString())
          return state;

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
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return { messages: sorted };
      });
    } catch (err) {
      console.error("Error syncing latest messages:", err);
    }
  },
});
