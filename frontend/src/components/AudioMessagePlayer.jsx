import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Pause, Mic } from "lucide-react";

// Generate organic, speech-like waveform heights deterministically based on message ID
function generateWaveformHeights(seedString = "", count = 28) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  const heights = [];
  for (let i = 0; i < count; i++) {
    // Generate pseudo-random value between 20% and 100%
    const pseudoRand = Math.abs(Math.sin(hash + i * 1.618)) * 0.8 + 0.2;
    heights.push(Math.round(pseudoRand * 100));
  }
  return heights;
}

function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

const AudioMessagePlayer = ({ message, isSender }) => {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.audioDuration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate 28 waveform bars with organic speech peaks
  const waveformBars = useMemo(
    () => generateWaveformHeights(message._id || message.createdAt || "audio", 28),
    [message._id, message.createdAt]
  );

  // Stop playback when another audio message starts
  useEffect(() => {
    const handleOtherAudioPlay = (e) => {
      if (e.detail?.id !== message._id && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("play-audio-message", handleOtherAudioPlay);
    return () => {
      window.removeEventListener("play-audio-message", handleOtherAudioPlay);
    };
  }, [message._id]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(
        new CustomEvent("play-audio-message", { detail: { id: message._id } })
      );
      audioRef.current.play().catch((err) => {
        console.error("Audio playback error:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      if (!isNaN(audioDuration) && audioDuration !== Infinity) {
        setDuration(audioDuration);
      }
      setIsLoaded(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Speed controls: 1x -> 1.5x -> 2x -> 1x
  const toggleSpeed = (e) => {
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Interactive scrubbing on waveform
  const handleWaveformClick = (e) => {
    if (!waveformRef.current || !audioRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * (duration || 1);

    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 py-1 px-0.5 select-none min-w-[210px] sm:min-w-[260px] max-w-[320px]">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={message.audio}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* WhatsApp Circular Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`
          size-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition-all transform active:scale-95 cursor-pointer
          ${
            isSender
              ? "bg-white text-emerald-700 hover:bg-white/90"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }
        `}
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="size-4 fill-current translate-x-0.5" />
        )}
      </button>

      {/* Waveform & Time Track */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Interactive Waveform Bar Visualizer */}
        <div
          ref={waveformRef}
          onClick={handleWaveformClick}
          className="h-7 flex items-center gap-[2.5px] cursor-pointer group py-1"
          title="Click to seek"
        >
          {waveformBars.map((heightPercent, index) => {
            const barProgress = (index / waveformBars.length) * 100;
            const isPassed = barProgress <= progressPercent;

            return (
              <div
                key={index}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  style={{ height: `${Math.max(18, heightPercent)}%` }}
                  className={`
                    w-full rounded-full transition-colors duration-100
                    ${
                      isPassed
                        ? isSender
                          ? "bg-white"
                          : "bg-emerald-500 dark:bg-emerald-400"
                        : isSender
                        ? "bg-white/40 group-hover:bg-white/50"
                        : "bg-base-content/25 group-hover:bg-base-content/40"
                    }
                  `}
                />
              </div>
            );
          })}
        </div>

        {/* Counter & Speed Control Row */}
        <div className="flex items-center justify-between text-[11px] font-medium leading-none mt-0.5">
          <span
            className={`font-mono ${
              isSender ? "text-white/80" : "text-base-content/60"
            }`}
          >
            {isPlaying
              ? formatAudioTime(currentTime)
              : formatAudioTime(duration || message.audioDuration || 0)}
          </span>

          {/* WhatsApp Playback Speed Control (1x / 1.5x / 2x) */}
          <button
            type="button"
            onClick={toggleSpeed}
            className={`
              px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight transition-all active:scale-90 cursor-pointer
              ${
                playbackSpeed !== 1
                  ? isSender
                    ? "bg-white text-emerald-700 font-extrabold shadow-xs"
                    : "bg-emerald-500 text-white font-extrabold shadow-xs"
                  : isSender
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-base-200 hover:bg-base-300 text-base-content/70"
              }
            `}
            title="Toggle playback speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* Mini Mic / Audio Icon indicator */}
      <div
        className={`size-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSender ? "bg-white/20 text-white" : "bg-base-200 text-base-content/60"
        }`}
      >
        <Mic className="size-3.5" />
      </div>
    </div>
  );
};

export default AudioMessagePlayer;
