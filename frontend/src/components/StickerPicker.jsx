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
  Globe,
} from "lucide-react";
import {
  STICKER_PACKS,
  CURATED_STICKERS,
  UNLIMITED_CATEGORIES,
  fetchLiveStickers,
  searchLiveStickers,
} from "../constants/stickerPacks";
import { useChatStore } from "../store/useChatStore";
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

export const LOCAL_STORAGE_RECENTS = "wa_recent_stickers";
export const LOCAL_STORAGE_FAVORITES = "wa_favorite_stickers";

// Synchronous helper to guarantee any sent/clicked sticker is saved to recents
export const addStickerToRecents = (stickerOrUrl) => {
  if (!stickerOrUrl) return [];
  const url = typeof stickerOrUrl === "string" ? stickerOrUrl : stickerOrUrl.url;
  if (!url) return [];

  const stickerObj =
    typeof stickerOrUrl === "string"
      ? { id: `recent-${Date.now()}`, name: "Recent Sticker", url }
      : stickerOrUrl;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECENTS);
    const existing = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((s) => (typeof s === "string" ? s : s.url) !== url);
    const updated = [stickerObj, ...filtered].slice(0, 35);
    localStorage.setItem(LOCAL_STORAGE_RECENTS, JSON.stringify(updated));
    window.dispatchEvent(new Event("wa_stickers_updated"));
    return updated;
  } catch (e) {
    console.error("Failed to update recent stickers:", e);
    return [];
  }
};

const StickerPicker = ({
  onSelectSticker,
  onClose,
  onSwitchToEmoji,
  activeMode = "sticker",
}) => {
  const [activeTab, setActiveTab] = useState("animated");
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [showPackStore, setShowPackStore] = useState(false);

  const [recents, setRecents] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Unlimited Live Stickers State (Infinite Scroll & Category Feeds)
  const [unlimitedCategory, setUnlimitedCategory] = useState("trending");
  const [unlimitedStickers, setUnlimitedStickers] = useState([]);
  const [unlimitedOffset, setUnlimitedOffset] = useState(0);
  const [isLoadingUnlimited, setIsLoadingUnlimited] = useState(false);
  const [hasMoreUnlimited, setHasMoreUnlimited] = useState(true);

  const searchInputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Load all stickers from localStorage
  const loadAllStickers = () => {
    try {
      try {
        localStorage.removeItem("wa_custom_stickers");
      } catch (e) {}

      let parsedRecents = [];
      const storedRecents = localStorage.getItem(LOCAL_STORAGE_RECENTS);
      if (storedRecents) {
        try {
          parsedRecents = JSON.parse(storedRecents);
        } catch (e) {}
      }

      // If recents in localStorage is empty, automatically harvest from active chat history!
      if (!parsedRecents || parsedRecents.length === 0) {
        const chatMessages = useChatStore.getState()?.messages || [];
        const foundStickers = [];
        for (let i = chatMessages.length - 1; i >= 0; i--) {
          const m = chatMessages[i];
          if (m?.sticker && !foundStickers.some((s) => s.url === m.sticker)) {
            foundStickers.push({
              id: `chat-recent-${m._id || i}`,
              name: "Recent Sticker",
              url: m.sticker,
            });
          }
        }

        if (foundStickers.length > 0) {
          parsedRecents = foundStickers;
        } else {
          // If brand new conversation with 0 stickers, show top animated meme stickers so Recents is never blank
          parsedRecents = CURATED_STICKERS.slice(0, 8);
        }

        try {
          localStorage.setItem(
            LOCAL_STORAGE_RECENTS,
            JSON.stringify(parsedRecents)
          );
        } catch (e) {}
      }

      // Reconcile recents with CURATED_STICKERS to ensure valid URLs and metadata
      if (parsedRecents && parsedRecents.length > 0) {
        parsedRecents = parsedRecents
          .map((item) => {
            const rawUrl = typeof item === "string" ? item : item?.url;
            const canonical = CURATED_STICKERS.find(
              (c) => c.id === item?.id || c.url === rawUrl
            );
            if (canonical) {
              return { ...canonical, ...item, url: canonical.url };
            }
            return typeof item === "string"
              ? { id: `recent-${rawUrl}`, url: rawUrl, name: "Recent Sticker" }
              : item;
          })
          .filter((item) => Boolean(item?.url));
      }

      setRecents(parsedRecents);

      // Reconcile and load favorites
      const defaultFavs = CURATED_STICKERS.filter((s) => s.favorite);
      let favList = defaultFavs;

      const storedFavs = localStorage.getItem(LOCAL_STORAGE_FAVORITES);
      if (storedFavs) {
        try {
          const parsed = JSON.parse(storedFavs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            favList = parsed
              .filter(
                (item) => !item?.isCustom && !item?.id?.startsWith("custom-")
              )
              .map((item) => {
                const rawUrl = typeof item === "string" ? item : item?.url;
                const canonical = CURATED_STICKERS.find(
                  (c) => c.id === item?.id || c.url === rawUrl
                );
                if (canonical) {
                  return { ...canonical, ...item, url: canonical.url };
                }
                return typeof item === "string"
                  ? { id: `fav-${rawUrl}`, url: rawUrl, name: "Favorite" }
                  : item;
              })
              .filter((item) => Boolean(item?.url));

            // Ensure all curated default favorites are present
            defaultFavs.forEach((df) => {
              if (!favList.some((f) => f.id === df.id || f.url === df.url)) {
                favList.push(df);
              }
            });
          }
        } catch (e) {
          favList = defaultFavs;
        }
      }

      setFavorites(favList);
      try {
        localStorage.setItem(
          LOCAL_STORAGE_FAVORITES,
          JSON.stringify(favList)
        );
      } catch (e) {}
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

  // Infinite Scroll & Unlimited Feed Loader
  useEffect(() => {
    if (activeTab !== "unlimited") return;

    let isMounted = true;
    const loadInitialUnlimited = async () => {
      setIsLoadingUnlimited(true);
      const catObj = UNLIMITED_CATEGORIES.find((c) => c.id === unlimitedCategory);
      const q = catObj?.query || "";
      const initialStickers = await fetchLiveStickers({ query: q, offset: 0, limit: 28 });
      if (isMounted) {
        setUnlimitedStickers(initialStickers);
        setUnlimitedOffset(28);
        setHasMoreUnlimited(initialStickers.length >= 20);
        setIsLoadingUnlimited(false);
      }
    };

    loadInitialUnlimited();
    return () => {
      isMounted = false;
    };
  }, [activeTab, unlimitedCategory]);

  const handleLoadMoreUnlimited = async () => {
    if (isLoadingUnlimited || !hasMoreUnlimited) return;
    setIsLoadingUnlimited(true);
    const catObj = UNLIMITED_CATEGORIES.find((c) => c.id === unlimitedCategory);
    const q = catObj?.query || "";
    const nextBatch = await fetchLiveStickers({
      query: q,
      offset: unlimitedOffset,
      limit: 28,
    });
    if (nextBatch.length === 0) {
      setHasMoreUnlimited(false);
    } else {
      setUnlimitedStickers((prev) => [...prev, ...nextBatch]);
      setUnlimitedOffset((prev) => prev + 28);
      if (nextBatch.length < 15) setHasMoreUnlimited(false);
    }
    setIsLoadingUnlimited(false);
  };

  const handleContainerScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 180) {
      if (activeTab === "unlimited" && !isLoadingUnlimited && hasMoreUnlimited && !searchQuery) {
        handleLoadMoreUnlimited();
      }
    }
  };

  // Filter stickers based on active tab or search
  const displayedStickers = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return CURATED_STICKERS.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    if (activeTab === "recents") return recents;
    if (activeTab === "favorites") return favorites;
    if (activeTab === "unlimited") return unlimitedStickers;
    return CURATED_STICKERS.filter(
      (s) => s.packId === activeTab || s.packIds?.includes(activeTab)
    );
  }, [activeTab, searchQuery, recents, favorites, unlimitedStickers]);

  // Handle sticker click (send)
  const handleStickerClick = (sticker) => {
    const rawUrl = typeof sticker === "string" ? sticker : sticker?.url;
    const canonical = CURATED_STICKERS.find(
      (c) => c.id === sticker?.id || c.url === rawUrl
    );
    const url = canonical?.url || rawUrl;
    if (!url) return;

    // Synchronously save to recents storage before sending
    const updated = addStickerToRecents(canonical || sticker);
    if (updated && updated.length > 0) {
      setRecents(updated);
    }

    onSelectSticker(url);
  };

  // Toggle Favorite
  const handleToggleFavorite = (e, sticker) => {
    e.stopPropagation();
    const rawUrl = typeof sticker === "string" ? sticker : sticker?.url;
    const canonical = CURATED_STICKERS.find(
      (c) => c.id === sticker?.id || c.url === rawUrl
    );
    const url = canonical?.url || rawUrl;
    if (!url) return;

    const isFav = favorites.some((f) => {
      const fUrl = typeof f === "string" ? f : f?.url;
      return fUrl === url || (canonical && f?.id === canonical.id);
    });

    let updated;
    if (isFav) {
      updated = favorites.filter((f) => {
        const fUrl = typeof f === "string" ? f : f?.url;
        return fUrl !== url && (!canonical || f?.id !== canonical.id);
      });
      toast.success("Removed from Favorites");
    } else {
      const stickerObj =
        canonical ||
        (typeof sticker === "string"
          ? { id: `fav-${Date.now()}`, name: "Favorite", url }
          : sticker);
      updated = [stickerObj, ...favorites];
      toast.success("Added to Favorites");
    }

    setFavorites(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES, JSON.stringify(updated));
    } catch (e) {}
  };

  const tabsScrollRef = useRef(null);

  return (
    <div
      className="
        w-full sm:w-[385px] max-w-[calc(100vw-16px)] h-[min(380px,62dvh)] sm:h-[460px]
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
          <div className="flex items-center justify-between gap-1 py-1 px-0.5">
            <div
              ref={tabsScrollRef}
              className="flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar flex-1 py-0.5 scroll-smooth touch-pan-x"
            >
              {/* Recents */}
              <button
                type="button"
                onClick={() => setActiveTab("recents")}
                className={`size-8 sm:size-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative flex-shrink-0 ${
                  activeTab === "recents"
                    ? "text-emerald-500 bg-emerald-500/15"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                }`}
                title="Recent stickers"
              >
                <Clock size={17} />
                {activeTab === "recents" && (
                  <span className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 bg-emerald-500 rounded-full" />
                )}
              </button>

              {/* Favorites */}
              <button
                type="button"
                onClick={() => setActiveTab("favorites")}
                className={`size-8 sm:size-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative flex-shrink-0 ${
                  activeTab === "favorites"
                    ? "text-amber-500 bg-amber-500/15"
                    : "text-base-content/60 hover:text-base-content hover:bg-base-300/50"
                }`}
                title="Starred favorites"
              >
                <Star size={17} />
                {activeTab === "favorites" && (
                  <span className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 bg-amber-500 rounded-full" />
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
                    className={`size-8 sm:size-8.5 rounded-lg flex items-center justify-center transition-all cursor-pointer p-1 relative flex-shrink-0 ${
                      isActive
                        ? "ring-2 ring-emerald-500 bg-emerald-500/10"
                        : "hover:bg-base-300/50 opacity-85 hover:opacity-100"
                    }`}
                    title={pack.name}
                  >
                    <img
                      src={pack.avatar}
                      alt={pack.name}
                      referrerPolicy="no-referrer"
                      className="size-5.5 sm:size-6 object-contain pointer-events-none drop-shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fb = e.currentTarget.parentElement?.querySelector(".pack-fallback");
                        if (fb) fb.classList.remove("hidden");
                      }}
                    />
                    <span className="pack-fallback hidden flex items-center justify-center text-emerald-500">
                      {pack.id === "unlimited" ? <Globe size={18} /> :
                       pack.id === "animated" ? <Sparkles size={18} /> :
                       pack.id === "love" ? <Heart size={18} /> :
                       <Smile size={18} />}
                    </span>
                    {isActive && (
                      <span className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 bg-emerald-500 rounded-full" />
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

      {/* 2. Main Sticker Grid Area with Infinite Scroll */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-3 overscroll-contain"
        onScroll={handleContainerScroll}
      >
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
            {/* Category Quick Chips for Unlimited Live Stickers */}
            {activeTab === "unlimited" && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar pb-1.5 mb-2 -mx-1 px-1 touch-pan-x scroll-smooth">
                {UNLIMITED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (unlimitedCategory !== cat.id) {
                        setUnlimitedCategory(cat.id);
                        setUnlimitedOffset(0);
                        setHasMoreUnlimited(true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
                      unlimitedCategory === cat.id
                        ? "bg-emerald-600 text-white shadow-xs scale-102"
                        : "bg-base-200 dark:bg-[#202c33] text-base-content/70 hover:text-base-content hover:bg-base-300"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
              {displayedStickers.map((sticker) => renderStickerTile(sticker))}
            </div>

            {/* Unlimited Load More & Infinite Scroll Spinner */}
            {activeTab === "unlimited" && (
              <div className="pt-3 pb-2 text-center">
                {isLoadingUnlimited ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs text-base-content/60">
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                    <span>Loading endless stickers...</span>
                  </div>
                ) : hasMoreUnlimited && unlimitedStickers.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleLoadMoreUnlimited}
                    className="btn btn-xs btn-outline btn-success rounded-full px-5 text-[11px] hover:scale-105 transition-transform"
                  >
                    Load More Endless Stickers ↓
                  </button>
                ) : (
                  unlimitedStickers.length > 0 && (
                    <p className="text-[11px] text-base-content/40 py-2">
                      ✨ You're viewing millions of live stickers! Scroll or search anytime.
                    </p>
                  )
                )}
              </div>
            )}

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
            : activeTab === "unlimited"
            ? `Unlimited Live (${unlimitedStickers.length}+)`
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
                (s) => s.packId === pack.id || s.packIds?.includes(pack.id)
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
    const rawUrl = typeof sticker === "string" ? sticker : sticker?.url || "";
    const canonical = CURATED_STICKERS.find(
      (c) => c.id === sticker?.id || c.url === rawUrl
    );
    const stickerUrl = canonical?.url || rawUrl;
    const stickerName = sticker?.name || canonical?.name || "Sticker";
    const isAnimated = Boolean(
      sticker?.isAnimated ||
      canonical?.isAnimated ||
      stickerUrl.endsWith(".svg") ||
      stickerUrl.endsWith(".gif")
    );
    const isFav = favorites.some((f) => {
      const favUrl = typeof f === "string" ? f : f?.url;
      return favUrl === stickerUrl || (canonical && f?.id === canonical.id);
    });

    return (
      <div
        key={sticker.id || stickerUrl}
        onClick={() => handleStickerClick(canonical || sticker)}
        className="
          group relative aspect-square p-2 rounded-xl
          bg-base-200/35 dark:bg-[#1a252c]/50 hover:bg-base-200 dark:hover:bg-[#2a3942]
          flex items-center justify-center cursor-pointer
          transition-all active:scale-95 overflow-hidden
        "
        title={stickerName}
      >
        <img
          src={stickerUrl}
          alt={stickerName}
          referrerPolicy="no-referrer"
          decoding="async"
          className="w-full h-full max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-200 pointer-events-none select-none"
          onError={(e) => {
            console.warn("Failed to load sticker:", stickerUrl);
          }}
        />

        {/* Animated Badge */}
        {isAnimated && (
          <span
            className="absolute bottom-1 right-1 px-1 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center gap-0.5 pointer-events-none shadow-xs border border-white/10 z-10"
            title="Animated Sticker"
          >
            ⚡
          </span>
        )}

        {/* Favorite Star Button (Only shown on hover or in favorites tab) */}
        <button
          type="button"
          onClick={(e) => handleToggleFavorite(e, canonical || sticker)}
          className={`
            absolute top-1 right-1 p-1 rounded-full z-10
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
