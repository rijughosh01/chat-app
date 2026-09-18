import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send, Image as ImageIcon, Smile, Loader2, RefreshCw } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import toast from "react-hot-toast";
import { useStatusStore } from "../../store/useStatusStore";

const CreateMediaStatusModal = () => {
  const { isMediaModalOpen, setIsMediaModalOpen, createStatus, isPosting } =
    useStatusStore();

  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const captionInputRef = useRef(null);

  useEffect(() => {
    if (isMediaModalOpen) {
      setImagePreview(null);
      setCaption("");
      setShowEmojiPicker(false);
      // Auto open file picker if no image is present
      setTimeout(() => fileInputRef.current?.click(), 100);
    }
  }, [isMediaModalOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isMediaModalOpen) {
        setIsMediaModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMediaModalOpen, setIsMediaModalOpen]);

  // Click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest("#media-status-emoji-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size should be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setTimeout(() => captionInputRef.current?.focus(), 150);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!imagePreview || isPosting) return;

    await createStatus({
      type: "image",
      image: imagePreview,
      caption: caption.trim(),
    });
  };

  if (!isMediaModalOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col justify-between p-3 sm:p-5 text-white animate-in fade-in select-none safe-pb safe-pt">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Top Action Bar */}
      <div className="flex items-center justify-between z-20">
        <button
          type="button"
          onClick={() => setIsMediaModalOpen(false)}
          className="size-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md active:scale-90 transition-all cursor-pointer shadow-md"
          title="Discard"
        >
          <X size={22} className="stroke-[2.5]" />
        </button>

        {imagePreview && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-4 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center gap-2 backdrop-blur-md active:scale-95 transition-all text-xs font-semibold cursor-pointer shadow-md"
            title="Change image"
          >
            <RefreshCw size={15} />
            <span>Change Photo</span>
          </button>
        )}
      </div>

      {/* Center Image Canvas */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden my-2">
        {imagePreview ? (
          <div className="relative max-h-full max-w-full flex items-center justify-center">
            <img
              src={imagePreview}
              alt="Status preview"
              className="max-h-[calc(100dvh-180px)] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 hover:border-emerald-500 rounded-3xl max-w-sm cursor-pointer transition-colors text-center space-y-3"
          >
            <div className="size-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ImageIcon size={32} />
            </div>
            <p className="font-bold text-base text-white">Select a photo</p>
            <p className="text-xs text-white/50">
              Tap anywhere to choose a photo for your 24-hour status update
            </p>
          </div>
        )}
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-24 left-4 sm:left-auto sm:right-6 z-50 shadow-2xl rounded-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in-95 duration-150"
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              setCaption((prev) => prev + emoji.native);
              captionInputRef.current?.focus();
            }}
            theme="dark"
            previewPosition="none"
            skinTonePosition="search"
          />
        </div>
      )}

      {/* Bottom Caption Bar */}
      {imagePreview && (
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto w-full flex items-center gap-2 z-20"
        >
          <div className="flex-1 flex items-center bg-white/15 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500 transition-all shadow-lg">
            <button
              id="media-status-emoji-btn"
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="p-1.5 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Add emojis"
            >
              <Smile size={20} />
            </button>

            <input
              ref={captionInputRef}
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={300}
              placeholder="Add a caption..."
              className="w-full bg-transparent border-none outline-none px-2 text-sm text-white placeholder:text-white/40"
            />
          </div>

          <button
            type="submit"
            disabled={isPosting}
            className="size-12 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-emerald-900/40 transition-all cursor-pointer flex-shrink-0 disabled:opacity-40"
            title="Post photo status"
          >
            {isPosting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} className="translate-x-0.5" />
            )}
          </button>
        </form>
      )}
    </div>,
    document.body
  );
};

export default CreateMediaStatusModal;
