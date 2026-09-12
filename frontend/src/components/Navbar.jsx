import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { usePwaStore } from "../store/usePwaStore";
import {
  LogOut,
  MessagesSquare,
  Palette,
  Download,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { selectedUser } = useChatStore();
  const { isStandalone, installApp } = usePwaStore();
  const location = useLocation();

  const isChatOpenOnMobile = location.pathname === "/" && Boolean(selectedUser);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 border-b border-base-content/10 backdrop-blur-xl bg-base-100/80 ${
        isChatOpenOnMobile ? "hidden md:block" : "block"
      }`}
    >
      <div className="container mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 group active:scale-95 transition-all"
          >
            <div className="relative size-9 sm:size-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-[1.5px] shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <div className="w-full h-full bg-base-100 rounded-[10px] flex items-center justify-center">
                <MessagesSquare className="size-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  NexChat
                </span>
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="size-2.5" /> Pro
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {!isStandalone && (
            <button
              type="button"
              onClick={installApp}
              className="btn btn-xs sm:btn-sm btn-ghost gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-full font-medium active:scale-95 transition-all"
              title="Install NexChat PWA App"
            >
              <Download className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {authUser ? (
            <Link
              to="/"
              className="btn btn-xs sm:btn-sm btn-ghost gap-1.5 text-xs text-base-content/80 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-full font-medium transition-all"
              title="Chats"
            >
              <MessagesSquare className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline">Chats</span>
            </Link>
          ) : (
            <Link
              to="/landing"
              className="btn btn-xs sm:btn-sm btn-ghost gap-1.5 text-xs text-base-content/80 hover:text-base-content rounded-full font-medium"
              title="Overview"
            >
              <span>Overview</span>
            </Link>
          )}

          <Link
            to="/settings"
            className="btn btn-xs sm:btn-sm btn-ghost gap-1.5 text-xs text-base-content/80 hover:text-base-content hover:bg-base-200/70 rounded-full font-medium transition-all"
            title="Themes & Wallpapers"
          >
            <Palette className="size-3.5 sm:size-4 text-emerald-500" />
            <span className="hidden sm:inline">Themes</span>
          </Link>

          {authUser ? (
            <div className="flex items-center gap-1 sm:gap-2 bg-base-200/70 hover:bg-base-200 border border-base-content/10 rounded-full pl-1 pr-1.5 sm:pr-2 py-0.5 transition-all shadow-xs">
              <Link
                to="/profile"
                className="flex items-center gap-2 active:scale-95 transition-transform"
                title="View & Edit Profile"
              >
                <div className="relative">
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt={authUser.fullName}
                    className="size-7 sm:size-8 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 size-2 sm:size-2.5 bg-emerald-500 rounded-full ring-2 ring-base-100" />
                </div>
                <span className="text-xs sm:text-sm font-semibold max-w-[90px] truncate hidden sm:inline text-base-content">
                  {authUser.fullName}
                </span>
              </Link>

              <div className="h-4 w-px bg-base-content/15 mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={logout}
                className="btn btn-xs btn-circle btn-ghost text-base-content/60 hover:text-error hover:bg-error/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="btn btn-xs sm:btn-sm btn-ghost text-xs text-base-content/80 hover:text-base-content rounded-full"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn btn-xs sm:btn-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none rounded-full text-xs shadow-md shadow-emerald-600/20 px-3.5 gap-1.5 transition-all active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
