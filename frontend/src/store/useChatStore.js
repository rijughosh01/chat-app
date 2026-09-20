import { create } from "zustand";
import { createMessageSlice } from "./slices/createMessageSlice";
import { createSocketSlice } from "./slices/createSocketSlice";
import { createSyncSlice } from "./slices/createSyncSlice";
import { createSettingsSlice } from "./slices/createSettingsSlice";

export const useChatStore = create((...a) => ({
  ...createSettingsSlice(...a),
  ...createMessageSlice(...a),
  ...createSocketSlice(...a),
  ...createSyncSlice(...a),
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
