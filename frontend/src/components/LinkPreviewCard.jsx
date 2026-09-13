import { ExternalLink, Globe } from "lucide-react";

const LinkPreviewCard = ({ preview, isSender }) => {
  if (!preview || (!preview.title && !preview.image && !preview.url)) {
    return null;
  }

  let domain = preview.domain || "";
  if (!domain && preview.url) {
    try {
      domain = new URL(preview.url).hostname.replace(/^www\./, "");
    } catch {
      domain = preview.url;
    }
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`
        block my-1.5 rounded-xl overflow-hidden
        ${isSender ? "bg-black/8 hover:bg-black/12" : "bg-base-200/70 hover:bg-base-200"}
        border border-base-content/10 shadow-xs
        transition-all duration-200 group/card text-left max-w-full select-none
      `}
      title={`Open ${preview.url}`}
    >
      {/* Hero Preview Artwork */}
      {preview.image && (
        <div className="w-full relative aspect-video max-h-40 overflow-hidden bg-black/10">
          <img
            src={preview.image}
            alt={preview.title || domain || "Preview"}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover/card:scale-103 transition-transform duration-300 pointer-events-none"
            onError={(e) => {
              // Hide image container if broken or blocked by external CDN
              const parent = e.currentTarget.parentElement;
              if (parent) parent.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Card Content Details */}
      <div className="p-2 sm:p-2.5 flex flex-col gap-0.5">
        {/* Domain Badge */}
        <div className="flex items-center gap-1 text-[10px] sm:text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          <Globe size={11} className="stroke-[2.5] flex-shrink-0" />
          <span className="truncate">{domain || preview.siteName || "Web Link"}</span>
          <ExternalLink size={9} className="stroke-[2] opacity-60 ml-auto flex-shrink-0" />
        </div>

        {/* Title */}
        {preview.title && (
          <h4 className="text-[12px] sm:text-[12.5px] font-bold text-base-content line-clamp-2 leading-snug group-hover/card:text-emerald-500 transition-colors mt-0.5">
            {preview.title}
          </h4>
        )}

        {/* Description */}
        {preview.description && (
          <p className="text-[11px] text-base-content/70 line-clamp-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
};

export default LinkPreviewCard;
