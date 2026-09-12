import { MessagesSquare, Lock, ShieldCheck, Zap, Mic, Sparkles } from "lucide-react";
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
      className={`w-full flex flex-1 flex-col items-center justify-between p-6 sm:p-12 border-l border-base-content/10 select-none transition-all duration-300 relative overflow-hidden ${wallpaperClass}`}
    >
      {/* Top subtle decorative element */}
      <div className="w-full flex justify-end">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-base-100/60 backdrop-blur-md border border-base-content/5 text-[11px] font-semibold text-base-content/60 shadow-xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time connected</span>
        </div>
      </div>

      {/* Main Content Hero */}
      <div className="max-w-lg text-center space-y-6 my-auto z-10">
        <div className="flex justify-center">
          <div className="relative group">
            {/* Glowing gradient blur behind icon */}
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-30 group-hover:opacity-60 blur-xl transition-all duration-500" />
            <div className="relative size-20 sm:size-24 rounded-3xl bg-base-100/90 backdrop-blur-xl border border-emerald-500/30 flex items-center justify-center shadow-xl">
              <MessagesSquare className="size-10 sm:size-12 text-emerald-500 transition-transform group-hover:scale-110 duration-300" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
            NexChat for Web
          </h2>
          <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-md mx-auto">
            Experience ultra-fast real-time messaging, crisp voice notes, instant media sharing, and rich emoji reactions.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto text-left pt-2">
          <div className="p-2.5 rounded-xl bg-base-100/70 backdrop-blur-md border border-base-content/5 shadow-xs flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
              <Zap className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-base-content">Instant Delivery</p>
              <p className="text-[10px] text-base-content/50">Zero-latency sync</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-base-100/70 backdrop-blur-md border border-base-content/5 shadow-xs flex items-center gap-2">
            <div className="size-7 rounded-lg bg-teal-500/15 flex items-center justify-center text-teal-500 shrink-0">
              <Mic className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-base-content">Voice Notes</p>
              <p className="text-[10px] text-base-content/50">Crystal audio</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-base-100/70 backdrop-blur-md border border-base-content/5 shadow-xs flex items-center gap-2">
            <div className="size-7 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-500 shrink-0">
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-base-content">Stickers & Reactions</p>
              <p className="text-[10px] text-base-content/50">Express freely</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-base-100/70 backdrop-blur-md border border-base-content/5 shadow-xs flex items-center gap-2">
            <div className="size-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-base-content">Private & Secure</p>
              <p className="text-[10px] text-base-content/50">Protected chats</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-base-content/50 pt-2 font-medium">
          👈 Select a contact from the sidebar to open a conversation.
        </p>
      </div>

      {/* End to End Encryption Footer */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-100/75 backdrop-blur-md border border-base-content/10 shadow-xs text-xs text-base-content/60 font-medium">
        <Lock className="size-3 text-emerald-500" />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
};

export default NoChatSelected;
