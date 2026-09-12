import { create } from "zustand";

export const WALLPAPER_OPTIONS = [
  { id: "whatsapp-classic", name: "WhatsApp Classic", description: "Iconic warm cream in light & deep dark in dark with authentic doodle pattern" },
  { id: "whatsapp-midnight", name: "Midnight Dark", description: "Deep WhatsApp dark (#0b141a) with crisp vector doodles" },
  { id: "theme-matched", name: "Theme Matched", description: "Matches your active app theme color with doodle texture" },
  { id: "minimal", name: "Clean Minimal", description: "Solid background color without doodles" },
];

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("chat-theme") || "coffee",
  wallpaper: localStorage.getItem("chat-wallpaper") || "whatsapp-classic",
  wallpaperDoodle: localStorage.getItem("chat-wallpaper-doodle") !== "false",

  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
  },

  setWallpaper: (wallpaper) => {
    localStorage.setItem("chat-wallpaper", wallpaper);
    set({ wallpaper });
  },

  toggleWallpaperDoodle: (enabled) => {
    localStorage.setItem("chat-wallpaper-doodle", String(enabled));
    set({ wallpaperDoodle: enabled });
  },
}));