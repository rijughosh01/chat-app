import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { CircleUser, LogOut, MessagesSquare, Settings } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { selectedUser } = useChatStore();
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
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link
                  to={"/profile"}
                  className="flex items-center gap-2 p-1.5 hover:bg-base-200 rounded-lg transition-colors"
                  title="Your Profile"
                >
                  <img
                    src={authUser.profilePic || "/avatar.png"}
                    alt="Profile"
                    className="size-7 rounded-full object-cover border border-base-300"
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
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
