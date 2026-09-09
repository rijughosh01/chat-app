import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Smile, Paperclip, Reply, Mic, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

function formatRecordTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSendingAudio, setIsSendingAudio] = useState(false);

  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const typingTimeout = useRef(null);
  const emojiPickerRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const { sendMessage, selectedUser, replyingMessage, setReplyingMessage } =
    useChatStore();
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
    const currentText = text.trim();
    const currentImage = imagePreview;
    if (!currentText && !currentImage) return;

    // Instantly clear inputs for 0ms UI response
    setText("");
    setImagePreview(null);
    setShowEmojiPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (socket && selectedUser) {
      socket.emit("stopTyping", { to: selectedUser._id, from: authUser._id });
    }
    setIsTyping(false);

    try {
      await sendMessage({
        text: currentText,
        image: currentImage,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // --- Voice Note Recording Handlers ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Voice recording is not supported on this device/browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      let mimeType = "";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access error:", error);
      toast.error("Microphone access denied or unavailable");
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const sendVoiceNote = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    const finalDuration = recordingDuration;
    setIsSendingAudio(true);

    mediaRecorderRef.current.onstop = async () => {
      const rawMimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const cleanMimeType = rawMimeType.split(";")[0] || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: cleanMimeType });

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioBlob.size === 0) {
        setIsSendingAudio(false);
        setIsRecording(false);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result;

        // Reset recorder states immediately
        setIsSendingAudio(false);
        setIsRecording(false);
        setRecordingDuration(0);
        audioChunksRef.current = [];

        try {
          await sendMessage({
            audio: base64Audio,
            audioDuration: Math.max(1, finalDuration),
          });
        } catch (error) {
          console.error("Error sending voice note:", error);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target) &&
        !e.target.closest("#emoji-trigger-btn")
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Auto-focus input when replying
  useEffect(() => {
    if (replyingMessage && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [replyingMessage]);

  return (
    <div className="p-2.5 sm:p-3 bg-base-100/90 backdrop-blur-md border-t border-base-300/80 relative flex-shrink-0">
      {/* WhatsApp-Style Reply Quoting Banner */}
      {replyingMessage && (
        <div className="mb-2 flex items-center justify-between p-2 sm:px-3 bg-base-200/90 rounded-xl border-l-4 border-emerald-500 border border-base-300 shadow-sm animate-message-in">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Reply className="size-4 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                Replying to{" "}
                {replyingMessage.senderId === authUser?._id
                  ? "You"
                  : selectedUser?.fullName || "Message"}
              </p>
              <p className="text-xs text-base-content/70 truncate">
                {replyingMessage.text ||
                  (replyingMessage.image
                    ? "📷 Photo"
                    : replyingMessage.audio
                    ? "🎙️ Voice message"
                    : "Message")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {replyingMessage.image && (
              <img
                src={replyingMessage.image}
                alt="Reply preview"
                className="size-9 object-cover rounded-md border border-base-300"
              />
            )}
            <button
              type="button"
              onClick={() => setReplyingMessage(null)}
              className="size-6 rounded-full hover:bg-base-300 text-base-content/60 hover:text-base-content flex items-center justify-center transition-colors cursor-pointer"
              title="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-16 left-3 z-50 shadow-2xl rounded-2xl overflow-hidden border border-base-300"
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji) => {
              setText((prev) => prev + emoji.native);
            }}
            theme="auto"
          />
        </div>
      )}

      {/* Image Preview Banner */}
      {imagePreview && (
        <div className="mb-2.5 flex items-center gap-2 p-2 bg-base-200/80 rounded-xl border border-base-300 w-fit">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg shadow-xs"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 hover:bg-error hover:text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
          <span className="text-xs text-base-content/60 pr-2">Image attached</span>
        </div>
      )}

      {/* WhatsApp Input Bar OR Active Voice Recording Bar */}
      {isRecording ? (
        <div className="flex items-center gap-2 sm:gap-3 w-full py-0.5 animate-in fade-in duration-200">
          {/* Cancel / Trash Button */}
          <button
            type="button"
            onClick={cancelRecording}
            className="size-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
            title="Cancel recording"
          >
            <Trash2 size={18} />
          </button>

          {/* Recording Status & Waveform Container */}
          <div className="flex-1 flex items-center justify-between bg-base-200/90 border border-base-300/80 rounded-full px-4 py-2 shadow-inner min-w-0">
            {/* Blinking Red Dot & REC Duration */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-mono font-semibold text-red-500">
                {formatRecordTime(recordingDuration)}
              </span>
            </div>

            {/* Sound Waveform Animation */}
            <div className="flex items-center gap-1 h-5 px-2 overflow-hidden">
              {[40, 75, 100, 60, 90, 45, 80, 55, 95, 35, 70, 85].map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: `${h}%`,
                    animation: `pulse 0.8s ease-in-out infinite alternate ${i * 0.07}s`,
                  }}
                  className="w-1 bg-emerald-500 rounded-full flex-shrink-0"
                />
              ))}
            </div>

            <span className="text-xs text-base-content/50 hidden md:inline truncate ml-2">
              Recording voice note...
            </span>
          </div>

          {/* Send Voice Note Button */}
          <button
            type="button"
            onClick={sendVoiceNote}
            disabled={isSendingAudio}
            className="size-10 sm:size-11 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 cursor-pointer disabled:opacity-50"
            title="Send voice note"
          >
            {isSendingAudio ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Send size={18} className="translate-x-0.5" />
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-base-200/90 border border-base-300/80 rounded-full px-3 py-1 shadow-inner focus-within:border-emerald-500/60 focus-within:bg-base-100 transition-all">
            {/* Emoji Toggle Button */}
            <button
              id="emoji-trigger-btn"
              type="button"
              className="p-1.5 text-base-content/50 hover:text-base-content transition-colors rounded-full hover:bg-base-300/50 cursor-pointer"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              title="Emojis"
            >
              <Smile size={21} />
            </button>

            {/* Text input */}
            <input
              ref={textInputRef}
              type="text"
              className="w-full bg-transparent border-none outline-none px-2 py-1.5 text-sm text-base-content placeholder:text-base-content/40 focus:ring-0"
              placeholder="Type a message..."
              value={text}
              onChange={handleTyping}
              autoComplete="off"
            />

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />

            {/* Attachment Paperclip Button */}
            <button
              type="button"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                imagePreview
                  ? "text-emerald-500 bg-emerald-500/10"
                  : "text-base-content/50 hover:text-base-content hover:bg-base-300/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
            >
              <Paperclip size={20} />
            </button>
          </div>

          {/* Dynamic WhatsApp Action: Send Button when typing/image, or Mic button when empty */}
          {text.trim() || imagePreview ? (
            <button
              type="submit"
              className="size-10 sm:size-11 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 cursor-pointer"
              title="Send"
            >
              <Send size={18} className="translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              className="size-10 sm:size-11 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 cursor-pointer"
              title="Record voice note"
            >
              <Mic size={20} />
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default MessageInput;
