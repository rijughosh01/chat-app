import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { usePwaStore } from "../store/usePwaStore";
import { CircleUser, LogOut, MessagesSquare, Settings, Download } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { selectedUser } = useChatStore();
  const { isStandalone, canInstall, installApp } = usePwaStore();
  const location = useLocation();

  const isChatOpenOnMobile = location.pathname === "/" && Boolean(selectedUser);

  return (
    <header
      className={`bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80 transition-all ${
        isChatOpenOnMobile ? "hidden md:block" : "block"
      }`}
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessagesSquare className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-lg font-bold">NexChat</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                type="button"
                onClick={installApp}
                className="btn btn-sm btn-ghost gap-1.5 text-xs text-primary hover:bg-primary/10 font-medium"
                title="Install NexChat Desktop / Mobile App"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {authUser ? (
              <Link
                to="/"
                className="btn btn-sm btn-ghost gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"
                title="Open Chat"
              >
                <MessagesSquare className="size-4" />
                <span className="hidden sm:inline">Chat</span>
              </Link>
            ) : (
              <Link
                to="/landing"
                className="btn btn-sm btn-ghost gap-1.5 text-xs text-base-content/80 font-medium"
                title="Product Overview"
              >
                <span className="hidden sm:inline">Overview</span>
              </Link>
            )}

            <Link
              to="/settings"
              className="btn btn-sm btn-ghost gap-1.5 text-xs text-base-content/80"
              title="Themes & Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Themes</span>
            </Link>

            {authUser ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1.5 hover:bg-base-200 rounded-lg transition-colors"
                  title="Your Profile"
                >
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt="Profile"
                    className="size-7 rounded-full object-cover border border-base-300 ring-1 ring-emerald-500/30"
                  />
                  <span className="text-sm font-medium hidden sm:inline">
                    {authUser.fullName}
                  </span>
                </Link>

                <button
                  className="btn btn-sm btn-ghost btn-circle text-error/80 hover:text-error hover:bg-error/10 transition-colors"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-sm btn-ghost text-xs text-base-content/80 hover:text-base-content"
                >
                  Sign In
                </Link>

                <Link
                  to="/signup"
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-full text-xs shadow-xs px-3.5 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
