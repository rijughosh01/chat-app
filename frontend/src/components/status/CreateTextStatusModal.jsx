import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Palette, Type, Smile, Loader2 } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useStatusStore } from "../../store/useStatusStore";

const BG_COLORS = [
  { id: "#005c4b", name: "WhatsApp Green" },
  { id: "#1e3a8a", name: "Royal Navy" },
  { id: "#881337", name: "Wine Red" },
  { id: "#581c87", name: "Deep Purple" },
  { id: "#c2410c", name: "Burnt Orange" },
  { id: "#18181b", name: "Charcoal Black" },
  { id: "#0f766e", name: "Rich Teal" },
  { id: "#be185d", name: "Sunset Pink" },
  { id: "#78350f", name: "Cocoa Brown" },
];

const FONTS = [
  { id: "sans", name: "Sans", fontClass: "font-sans" },
  { id: "serif", name: "Serif", fontClass: "font-serif" },
  { id: "mono", name: "Mono", fontClass: "font-mono" },
  { id: "cursive", name: "Handwriting", fontClass: "italic font-serif" },
  { id: "display", name: "Bold", fontClass: "font-black tracking-tight" },
];

const CreateTextStatusModal = () => {
  const { isTextModalOpen, setIsTextModalOpen, createStatus, isPosting } =
    useStatusStore();

  const [text, setText] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [fontIndex, setFontIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    if (isTextModalOpen) {
      setText("");
      setColorIndex(0);
      setFontIndex(0);
      setShowEmojiPicker(false);
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isTextModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isTextModalOpen) {
        setIsTextModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTextModalOpen, setIsTextModalOpen]);

  // Click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest("#text-status-emoji-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isTextModalOpen) return null;

  const currentColor = BG_COLORS[colorIndex].id;
  const currentFont = FONTS[fontIndex];

  const handleCycleColor = () => {
    setColorIndex((prev) => (prev + 1) % BG_COLORS.length);
  };

  const handleCycleFont = () => {
    setFontIndex((prev) => (prev + 1) % FONTS.length);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || isPosting) return;

    await createStatus({
      type: "text",
      text: text.trim(),
      backgroundColor: currentColor,
      fontFamily: currentFont.id,
    });
  };

  return createPortal(
    <div
      style={{ backgroundColor: currentColor }}
      className="fixed inset-0 z-[10000] flex flex-col justify-between p-4 sm:p-6 text-white transition-colors duration-300 animate-in fade-in select-none safe-pb safe-pt"
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between z-20">
        <button
          type="button"
          onClick={() => setIsTextModalOpen(false)}
          className="size-11 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md active:scale-90 transition-all cursor-pointer shadow-md"
          title="Discard status"
        >
          <X size={22} className="stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2">
          {/* Font Toggle */}
          <button
            type="button"
            onClick={handleCycleFont}
            className="h-10 px-3.5 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-all text-xs font-bold cursor-pointer shadow-md"
            title="Change font"
          >
            <Type size={16} />
            <span>{currentFont.name}</span>
          </button>

          {/* Color Palette Toggle */}
          <button
            type="button"
            onClick={handleCycleColor}
            className="size-10 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-md active:scale-90 transition-all cursor-pointer shadow-md"
            title="Change background color"
          >
            <Palette size={18} />
          </button>

          {/* Emoji Picker Toggle */}
          <button
            id="text-status-emoji-btn"
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`size-10 rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-all cursor-pointer shadow-md ${
              showEmojiPicker
                ? "bg-white text-emerald-800"
                : "bg-black/25 hover:bg-black/40 text-white"
            }`}
            title="Add emojis"
          >
            <Smile size={19} />
          </button>
        </div>
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute top-20 right-4 sm:right-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-150"
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              setText((prev) => prev + emoji.native);
              textareaRef.current?.focus();
            }}
            theme="dark"
            previewPosition="none"
            skinTonePosition="search"
          />
        </div>
      )}

      {/* Center Typography Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4 my-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={700}
          rows={5}
          placeholder="Type a status update..."
          className={`w-full bg-transparent text-center border-none outline-none resize-none placeholder:text-white/40 text-white drop-shadow-md leading-relaxed ${
            currentFont.fontClass
          } ${
            text.length > 200
              ? "text-xl sm:text-2xl"
              : text.length > 80
              ? "text-2xl sm:text-3xl"
              : "text-3xl sm:text-4xl md:text-5xl"
          }`}
        />
        <span className="text-xs text-white/50 font-medium tracking-wide mt-2">
          {text.length}/700
        </span>
      </div>

      {/* Bottom Floating Send Button */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full z-20">
        <span className="text-xs text-white/75 font-medium bg-black/30 px-3.5 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
          ⏱️ Disappears after 24 hours
        </span>

        <button
          type="button"
          disabled={!text.trim() || isPosting}
          onClick={handleSubmit}
          className="size-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-black/30 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          title="Post status"
        >
          {isPosting ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Send size={24} className="translate-x-0.5" />
          )}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default CreateTextStatusModal;
