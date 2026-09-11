import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Star,
  Clock,
  Plus,
  Sparkles,
  Heart,
  Smile,
  X,
  Loader2,
  Package,
  Check,
  Palette,
  Trash2,
} from "lucide-react";
import {
  STICKER_PACKS,
  CURATED_STICKERS,
  searchLiveStickers,
} from "../constants/stickerPacks";
import toast from "react-hot-toast";

// WhatsApp Classic Peeling Sticker Icon
export const WhatsAppStickerIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9.5l6.5-6.5V5a2 2 0 0 0-2-2Z" />
    <path d="M14 21v-5a2 2 0 0 1 2-2h5" />
    <circle cx="8.5" cy="9.5" r="1" fill="currentColor" />
    <circle cx="14.5" cy="9.5" r="1" fill="currentColor" />
    <path d="M8.5 13.5c.8 1.2 2.2 1.2 3 0" />
  </svg>
);

export const LOCAL_STORAGE_CUSTOM = "wa_custom_stickers";
export const LOCAL_STORAGE_RECENTS = "wa_recent_stickers";
export const LOCAL_STORAGE_FAVORITES = "wa_favorite_stickers";

const StickerPicker = ({
  onSelectSticker,
  onClose,
  onSwitchToEmoji,
  activeMode = "sticker",
}) => {
  const [activeTab, setActiveTab] = useState("memes");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [showPackStore, setShowPackStore] = useState(false);

  const [customStickers, setCustomStickers] = useState([]);
  const [recents, setRecents] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Load all stickers from localStorage
  const loadAllStickers = () => {
    try {
      const storedCustom = localStorage.getItem(LOCAL_STORAGE_CUSTOM);
      if (storedCustom) setCustomStickers(JSON.parse(storedCustom));

      const storedRecents = localStorage.getItem(LOCAL_STORAGE_RECENTS);
      if (storedRecents) setRecents(JSON.parse(storedRecents));

      const storedFavs = localStorage.getItem(LOCAL_STORAGE_FAVORITES);
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      } else {
        const defaultFavs = CURATED_STICKERS.filter((s) => s.favorite);
        setFavorites(defaultFavs);
        localStorage.setItem(
          LOCAL_STORAGE_FAVORITES,
          JSON.stringify(defaultFavs)
        );
      }
    } catch (e) {
      console.error("Failed to load sticker storage", e);
    }
  };

  useEffect(() => {
    loadAllStickers();
    const handleStorageUpdate = () => loadAllStickers();
    window.addEventListener("wa_stickers_updated", handleStorageUpdate);
    return () =>
      window.removeEventListener("wa_stickers_updated", handleStorageUpdate);
  }, []);

  // Handle Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setLiveSearchResults([]);
      setIsLoadingLive(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      setIsLoadingLive(true);
      try {
        const live = await searchLiveStickers(searchQuery);
        setLiveSearchResults(live);
      } catch (err) {
        console.error("Live sticker search failed:", err);
      } finally {
        setIsLoadingLive(false);
      }
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Filter stickers based on active tab or search
  const displayedStickers = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const allLocal = [...customStickers, ...CURATED_STICKERS];
      return allLocal.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (activeTab === "recents") return recents;
    if (activeTab === "favorites") return favorites;
    if (activeTab === "custom") return customStickers;
    return CURATED_STICKERS.filter((s) => s.packId === activeTab);
  }, [activeTab, searchQuery, recents, favorites, customStickers]);

  // Handle sticker click (send)
  const handleStickerClick = (sticker) => {
    const url = typeof sticker === "string" ? sticker : sticker.url;
    if (!url) return;

    const stickerObj =
      typeof sticker === "string"
        ? { id: `custom-${Date.now()}`, name: "Sticker", url }
        : sticker;

    // Save to recents
    setRecents((prev) => {
      const filtered = prev.filter((s) => s.url !== url);
      const updated = [stickerObj, ...filtered].slice(0, 30);
      try {
        localStorage.setItem(LOCAL_STORAGE_RECENTS, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    onSelectSticker(url);
  };

  // Toggle Favorite
  const handleToggleFavorite = (e, sticker) => {
    e.stopPropagation();
    const url = typeof sticker === "string" ? sticker : sticker.url;
    const isFav = favorites.some((f) => f.url === url);

    let updated;
    if (isFav) {
      updated = favorites.filter((f) => f.url !== url);
      toast.success("Removed from Favorites");
    } else {
      const stickerObj =
        typeof sticker === "string"
          ? { id: `fav-${Date.now()}`, name: "Favorite", url }
          : sticker;
      updated = [stickerObj, ...favorites];
      toast.success("Added to Favorites");
    }

    setFavorites(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES, JSON.stringify(updated));
    } catch (e) {}
  };

  // Delete Custom Sticker
  const handleDeleteCustomSticker = (e, idOrUrl) => {
    e.stopPropagation();
    const updated = customStickers.filter(
      (s) => s.id !== idOrUrl && s.url !== idOrUrl
    );
    setCustomStickers(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM, JSON.stringify(updated));
    } catch (err) {}
    toast.success("Sticker removed");
  };

  // Custom Sticker Creator (+ Create) with Animated GIF & Canvas Support
  const handleCustomStickerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const isAnimated =
      file.type === "image/gif" ||
      file.name.toLowerCase().endsWith(".gif") ||
      file.type === "image/webp" ||
      file.name.toLowerCase().endsWith(".webp");

    const reader = new FileReader();

    if (isAnimated) {
      // PRESERVE ANIMATION: Do NOT pass animated GIFs/WebP through canvas!
      // Canvas only draws 1 static frame and strips all animation.
      reader.onload = () => {
        const animatedUrl = reader.result;

        const customSticker = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "") || "Animated Sticker",
          url: animatedUrl,
          isCustom: true,
          isAnimated: true,
        };

        // 1. Add to custom stickers collection
        setCustomStickers((prev) => {
          const next = [
            customSticker,
            ...prev.filter((s) => s.url !== animatedUrl),
          ].slice(0, 50);
          try {
            localStorage.setItem(LOCAL_STORAGE_CUSTOM, JSON.stringify(next));
          } catch (err) {
            console.error("Storage error:", err);
          }
          return next;
        });

        // 2. Add to favorites
        setFavorites((prev) => {
          const nextFavs = [
            customSticker,
            ...prev.filter((s) => s.url !== animatedUrl),
          ];
          try {
            localStorage.setItem(
              LOCAL_STORAGE_FAVORITES,
              JSON.stringify(nextFavs)
            );
          } catch (err) {}
          return nextFavs;
        });

        // 3. Notify app
        window.dispatchEvent(new Event("wa_stickers_updated"));

        // 4. Send sticker immediately
        handleStickerClick(customSticker);
        toast.success("Animated sticker created & sent! 🎉");
      };
      reader.readAsDataURL(file);
    } else {
      // Static image: resize through canvas for optimization
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const compactUrl =
            canvas.toDataURL("image/webp", 0.88) || canvas.toDataURL("image/png");

          const customSticker = {
            id: `custom-${Date.now()}`,
            name: "My Sticker",
            url: compactUrl,
            isCustom: true,
          };

          setCustomStickers((prev) => {
            const next = [
              customSticker,
              ...prev.filter((s) => s.url !== compactUrl),
            ].slice(0, 50);
            try {
              localStorage.setItem(LOCAL_STORAGE_CUSTOM, JSON.stringify(next));
            } catch (err) {
              console.error("Storage error:", err);
            }
            return next;
          });

          setFavorites((prev) => {
            const nextFavs = [
              customSticker,
              ...prev.filter((s) => s.url !== compactUrl),
            ];
            try {
              localStorage.setItem(
                LOCAL_STORAGE_FAVORITES,
                JSON.stringify(nextFavs)
              );
            } catch (err) {}
            return nextFavs;
          });

          window.dispatchEvent(new Event("wa_stickers_updated"));
          handleStickerClick(customSticker);
          toast.success("Sticker created & sent!");
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="
        w-full sm:w-[380px] max-w-[calc(100vw-20px)] h-[min(310px,46dvh)] sm:h-[430px]
        bg-base-100 dark:bg-[#202c33] border border-base-300 dark:border-base-700
        shadow-2xl rounded-2xl overflow-hidden flex flex-col z-50
        animate-in fade-in zoom-in-95 duration-150 select-none relative
      "
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Header: Search Bar & Navigation Tabs */}
      <div className="bg-base-200/80 dark:bg-[#111b21] border-b border-base-300 dark:border-base-700 p-2 flex flex-col gap-1.5 flex-shrink-0">
        {/* Search input */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-base-100 dark:bg-[#202c33] rounded-full px-3 py-1.5 border border-base-300 dark:border-base-600 focus-within:border-emerald-500 transition-colors">
            <Search size={16} className="text-base-content/50 flex-shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-transparent border-none outline-none text-xs text-base-content placeholder:text-base-content/40 focus:ring-0"
              placeholder="Search all stickers (popcat, love, meme, cat...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-base-content/50 hover:text-base-content p-0.5 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full hover:bg-base-300 dark:hover:bg-base-700 text-base-content/60 hover:text-base-content flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Top Navigation Tabs */}
        {!searchQuery && (
          <div className="flex items-center justify-between gap-1 py-1 px-1">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
              {/* Recents */}
              <button
                type="button"
                onClick={() => setActiveTab("recents")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                  activeTab === "recents"
                    ? "text-emerald-500 bg-emerald-500/15"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                }`}
                title="Recent stickers"
              >
                <Clock size={17} />
                {activeTab === "recents" && (
                  <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Favorites */}
              <button
                type="button"
                onClick={() => setActiveTab("favorites")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                  activeTab === "favorites"
                    ? "text-amber-500 bg-amber-500/15"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                }`}
                title="Starred favorites"
              >
                <Star size={17} />
                {activeTab === "favorites" && (
                  <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-amber-500 rounded-full" />
                )}
              </button>

              {/* My Custom Stickers Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                  activeTab === "custom"
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                }`}
                title="My Created & Saved Stickers"
              >
                <Palette size={17} />
                {customStickers.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-3.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {customStickers.length > 9 ? "9+" : customStickers.length}
                  </span>
                )}
                {activeTab === "custom" && (
                  <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Curated Pack Tabs */}
              {STICKER_PACKS.filter((p) => !p.isSpecial).map((pack) => {
                const isActive = activeTab === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setActiveTab(pack.id)}
                    className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer p-1 relative flex-shrink-0 ${
                      isActive
                        ? "ring-2 ring-emerald-500 bg-emerald-500/10"
                        : "hover:bg-base-300/50 opacity-80 hover:opacity-100"
                    }`}
                    title={pack.name}
                  >
                    <img
                      src={pack.avatar}
                      alt={pack.name}
                      referrerPolicy="no-referrer"
                      className="size-6 object-contain pointer-events-none"
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-2 right-2 h-0.5 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* WhatsApp '+' Add / Pack Store Button */}
            <button
              type="button"
              onClick={() => setShowPackStore(true)}
              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 transition-colors cursor-pointer flex-shrink-0"
              title="Sticker Store (Discover Packs)"
            >
              <Plus size={19} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Main Sticker Grid Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 overscroll-contain">
        {/* If Searching, show sections */}
        {searchQuery ? (
          <>
            {displayedStickers.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-base-content/60 uppercase tracking-wider mb-2 px-1">
                  Matching Stickers ({displayedStickers.length})
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {displayedStickers.map((sticker) => renderStickerTile(sticker))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Live Web Stickers
                </span>
                {isLoadingLive && (
                  <span className="text-[11px] text-base-content/50 flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" />
                    Searching...
                  </span>
                )}
              </div>

              {liveSearchResults.length > 0 ? (
                <div className="grid grid-cols-4 gap-2.5">
                  {liveSearchResults.map((sticker) => renderStickerTile(sticker))}
                </div>
              ) : (
                !isLoadingLive &&
                displayedStickers.length === 0 && (
                  <div className="text-center py-8 text-base-content/50 space-y-1">
                    <p className="text-sm font-medium">No stickers found</p>
                    <p className="text-xs">Try searching "popcat", "cat", "love", "heart", or "party"</p>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          /* Normal View */
          <div>
            <div className="grid grid-cols-4 gap-2.5">
              {/* First Tile: WhatsApp '+ Create' Custom Sticker Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  aspect-square rounded-xl border-2 border-dashed border-base-300 dark:border-base-600
                  hover:border-emerald-500 hover:bg-emerald-500/10
                  flex flex-col items-center justify-center p-2 text-center transition-all
                  cursor-pointer group
                "
                title="Create custom sticker from photo"
              >
                <div className="size-8 rounded-full bg-emerald-500/15 group-hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 group-hover:text-white flex items-center justify-center mb-1 transition-colors">
                  <Plus size={18} />
                </div>
                <span className="text-[10px] font-semibold text-base-content/70 group-hover:text-emerald-500">
                  Create
                </span>
              </button>

              {/* Hidden Custom Sticker File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCustomStickerUpload}
              />

              {/* User's Created/Saved Custom Stickers (Rendered immediately right after Create card!) */}
              {activeTab !== "favorites" &&
                activeTab !== "recents" &&
                activeTab !== "custom" &&
                customStickers.map((sticker) => (
                  <div
                    key={sticker.id || sticker.url}
                    onClick={() => handleStickerClick(sticker)}
                    className="
                      group relative aspect-square p-1.5 rounded-xl
                      hover:bg-base-200 dark:hover:bg-[#2a3942]
                      flex items-center justify-center cursor-pointer
                      transition-all active:scale-95 border border-emerald-500/30
                    "
                    title="Send your custom sticker"
                  >
                    <img
                      src={sticker.url}
                      alt="Custom Sticker"
                      referrerPolicy="no-referrer"
                      className="size-full object-contain filter drop-shadow-xs group-hover:scale-115 transition-transform duration-200 pointer-events-none"
                    />

                    {/* Delete custom sticker button on hover */}
                    <button
                      type="button"
                      onClick={(e) =>
                        handleDeleteCustomSticker(e, sticker.id || sticker.url)
                      }
                      className="
                        absolute top-1 right-1 p-1 rounded-full bg-base-100/90 hover:bg-red-500
                        text-base-content/60 hover:text-white opacity-0 group-hover:opacity-100
                        transition-all cursor-pointer shadow-xs
                      "
                      title="Delete sticker"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}

              {/* Pack or Tab Stickers */}
              {displayedStickers.map((sticker) => renderStickerTile(sticker))}
            </div>

            {/* Empty States */}
            {displayedStickers.length === 0 && activeTab === "recents" && (
              <div className="text-center py-10 text-base-content/50 space-y-1">
                <Clock size={28} className="mx-auto opacity-40 mb-2" />
                <p className="text-xs font-semibold">No recent stickers</p>
                <p className="text-[11px]">Send any sticker and it will appear here!</p>
              </div>
            )}

            {displayedStickers.length === 0 && activeTab === "favorites" && (
              <div className="text-center py-10 text-base-content/50 space-y-1">
                <Star size={28} className="mx-auto opacity-40 mb-2" />
                <p className="text-xs font-semibold">No favorite stickers</p>
                <p className="text-[11px]">Hover over any sticker and click the star to pin it here!</p>
              </div>
            )}

            {customStickers.length === 0 && activeTab === "custom" && (
              <div className="text-center py-10 text-base-content/50 space-y-1">
                <Palette size={28} className="mx-auto opacity-40 mb-2" />
                <p className="text-xs font-semibold">No custom stickers yet</p>
                <p className="text-[11px]">Click the "+ Create" button above to make your first sticker!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Mode Switcher Pill (WhatsApp Web Style: Emoji | Sticker) */}
      <div className="bg-base-200/90 dark:bg-[#111b21] border-t border-base-300 dark:border-base-700 py-1.5 px-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center bg-base-100 dark:bg-[#202c33] rounded-full p-0.5 border border-base-300 dark:border-base-600">
          <button
            type="button"
            onClick={onSwitchToEmoji}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-base-content/70 hover:text-base-content hover:bg-base-200/60 transition-colors cursor-pointer"
          >
            <Smile size={14} />
            <span>Emoji</span>
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-xs transition-colors cursor-default"
          >
            <WhatsAppStickerIcon size={14} />
            <span>Sticker</span>
          </button>
        </div>

        <span className="text-[11px] text-base-content/50 font-medium">
          {searchQuery
            ? "Search Results"
            : activeTab === "custom"
            ? `My Stickers (${customStickers.length})`
            : STICKER_PACKS.find((p) => p.id === activeTab)?.name || "WhatsApp"}
        </span>
      </div>

      {/* 4. WhatsApp Sticker Store Modal (Triggered by '+') */}
      {showPackStore && (
        <div className="absolute inset-0 bg-base-100 dark:bg-[#111b21] z-50 flex flex-col animate-in fade-in duration-150">
          <div className="p-3 border-b border-base-300 dark:border-base-700 flex items-center justify-between bg-base-200/50">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-emerald-500" />
              <h3 className="text-sm font-bold text-base-content">Sticker Packs</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPackStore(false)}
              className="p-1 rounded-full hover:bg-base-300 text-base-content/70 hover:text-base-content cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 divide-y divide-base-300/60 dark:divide-base-700/60">
            {STICKER_PACKS.filter((p) => !p.isSpecial).map((pack) => {
              const packStickers = CURATED_STICKERS.filter(
                (s) => s.packId === pack.id
              );
              return (
                <div key={pack.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={pack.avatar}
                      alt={pack.name}
                      referrerPolicy="no-referrer"
                      className="size-10 object-contain p-1 rounded-lg bg-base-200 dark:bg-base-800 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-base-content truncate">
                        {pack.name}
                      </p>
                      <p className="text-[10px] text-base-content/50">
                        {packStickers.length} stickers • High Quality
                      </p>
                      <div className="flex gap-1 mt-1 overflow-hidden">
                        {packStickers.slice(0, 4).map((s) => (
                          <img
                            key={s.id}
                            src={s.url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="size-5 object-contain"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(pack.id);
                      setShowPackStore(false);
                    }}
                    className="btn btn-xs btn-outline btn-success flex items-center gap-1 rounded-full px-2.5"
                  >
                    <Check size={12} />
                    <span>View</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for each sticker item
  function renderStickerTile(sticker) {
    const isFav = favorites.some((f) => f.url === sticker.url);

    return (
      <div
        key={sticker.id || sticker.url}
        onClick={() => handleStickerClick(sticker)}
        className="
          group relative aspect-square p-1.5 rounded-xl
          hover:bg-base-200 dark:hover:bg-[#2a3942]
          flex items-center justify-center cursor-pointer
          transition-all active:scale-95
        "
        title={sticker.name || "Send sticker"}
      >
        <img
          src={sticker.url}
          alt={sticker.name || "Sticker"}
          referrerPolicy="no-referrer"
          className="size-full object-contain filter drop-shadow-xs group-hover:scale-115 transition-transform duration-200 pointer-events-none"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.opacity = "0.3";
          }}
        />

        {/* Favorite Star Button (Only shown on hover or in favorites tab) */}
        <button
          type="button"
          onClick={(e) => handleToggleFavorite(e, sticker)}
          className={`
            absolute top-1 right-1 p-1 rounded-full
            transition-all duration-150 cursor-pointer shadow-xs
            ${
              activeTab === "favorites"
                ? "bg-amber-500 text-white opacity-90 hover:opacity-100 scale-100"
                : isFav
                ? "bg-amber-500 text-white opacity-0 group-hover:opacity-100 scale-100"
                : "bg-base-100/90 text-base-content/60 opacity-0 group-hover:opacity-100 hover:text-amber-500"
            }
          `}
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star size={11} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
    );
  }
};

export default StickerPicker;
