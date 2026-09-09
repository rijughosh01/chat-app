import { X, Download } from "lucide-react";
import { useEffect } from "react";

const ImageModal = ({ imageUrl, onClose, senderName, timestamp }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexchat-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent text-white z-10">
        <div>
          {senderName && <p className="font-medium text-sm">{senderName}</p>}
          {timestamp && <p className="text-xs text-white/60">{timestamp}</p>}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Download image"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Centered Image */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt="Full preview"
          className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default ImageModal;
