import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const { sendMessage, selectedUser } = useChatStore();
  const { authUser, socket } = useAuthStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    if (!isTyping && socket && selectedUser) {
      socket.emit("typing", { to: selectedUser._id, from: authUser._id });
      setIsTyping(true);
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      if (socket && selectedUser) {
        socket.emit("stopTyping", { to: selectedUser._id, from: authUser._id });
      }
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (socket && selectedUser) {
        socket.emit("stopTyping", { to: selectedUser._id, from: authUser._id });
      }
      setIsTyping(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  return (
    <div className="p-4 w-full relative">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative">
          <button
            type="button"
            className="btn btn-circle"
            onClick={() => setShowEmojiPicker((v) => !v)}
            tabIndex={-1}
          >
            <span role="img" aria-label="emoji">
              😊
            </span>
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50">
              <Picker
                data={data}
                onEmojiSelect={(emoji) => {
                  setText((prev) => prev + emoji.native);
                  setShowEmojiPicker(false);
                }}
                theme="auto"
              />
            </div>
          )}
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleTyping}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};
export default MessageInput;
