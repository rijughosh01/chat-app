import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, subscribeToMessages, unsubscribeFromMessages } =
    useChatStore();
  const { socket } = useAuthStore();

  useEffect(() => {
    if (socket) {
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [socket, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div
      className={`h-[100dvh] bg-base-200/50 flex flex-col ${
        selectedUser ? "pt-0 md:pt-16" : "pt-16"
      } overflow-hidden`}
    >
      <div className="flex-1 flex items-center justify-center p-0 md:p-2 lg:p-4 overflow-hidden w-full h-full">
        <div className="bg-base-100 rounded-none md:rounded-2xl border-0 md:border border-base-300 shadow-none md:shadow-2xl w-full max-w-[1600px] h-full overflow-hidden flex">
          {/* Sidebar: full width on mobile when no chat selected; fixed width on desktop */}
          <div
            className={`
              ${selectedUser ? "hidden md:flex" : "flex"}
              w-full md:w-80 lg:w-[360px] flex-shrink-0 h-full
            `}
          >
            <Sidebar />
          </div>

          {/* Chat Container: full width on mobile when chat selected; flex-1 on desktop */}
          <div
            className={`
              ${!selectedUser ? "hidden md:flex" : "flex"}
              flex-1 h-full min-w-0
            `}
          >
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;