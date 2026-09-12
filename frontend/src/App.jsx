import Navbar from "./components/Navbar";
import OfflineBanner from "./components/OfflineBanner";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useNotificationStore } from "./store/useNotificationStore";
import { usePwaStore } from "./store/usePwaStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();
  const { init: initNotifications } = useNotificationStore();

  console.log({ onlineUsers });

  useEffect(() => {
    usePwaStore.getState().init();
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      initNotifications();
    }
  }, [authUser, initNotifications]);


  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme} className="min-h-[100dvh] bg-base-100 text-base-content flex flex-col">
      <Navbar />
      <OfflineBanner />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;