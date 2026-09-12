import { MessagesSquare, Lock } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

const NoChatSelected = () => {
  const { wallpaper, wallpaperDoodle } = useThemeStore();

  const wallpaperClass = `
    ${
      wallpaper === "whatsapp-midnight"
        ? "wa-wallpaper-midnight"
        : wallpaper === "theme-matched"
        ? "wa-wallpaper-theme"
        : wallpaper === "minimal"
        ? "wa-wallpaper-minimal"
        : "wa-wallpaper-classic"
    }
    ${!wallpaperDoodle ? "wa-no-doodle" : ""}
  `;

  return (
    <div
      className={`w-full flex flex-1 flex-col items-center justify-between p-8 sm:p-16 border-l border-base-300 select-none transition-all duration-300 ${wallpaperClass}`}
    >

      <div />

      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-xs">
            <MessagesSquare className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-base-content">
          NexChat for Web
        </h2>
        <p className="text-sm text-base-content/60 leading-relaxed max-w-sm mx-auto">
          Send and receive real-time messages, share photos, react with emojis, and connect with your friends anytime.
        </p>
        <p className="text-xs text-base-content/40">
          Select a chat from the left sidebar to start messaging.
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-base-content/40 font-medium">
        <Lock size={12} />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};

export default NoChatSelected;
