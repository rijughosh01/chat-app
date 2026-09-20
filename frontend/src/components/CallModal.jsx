import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Minimize2,
  Maximize2,
  Maximize,
  Minimize,
  RefreshCw,
  Lock,
  Wifi,
  ArrowLeftRight,
  Volume2,
  ChevronDown,
} from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

const CallModal = () => {
  const socket = useAuthStore((state) => state.socket);
  const {
    callStatus,
    callType,
    otherUser,
    isMuted,
    isVideoOff,
    isScreenSharing,
    isMinimized,
    callDuration,
    localStream,
    remoteStream,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    flipCamera,
    toggleMinimize,
    initSocketListeners,
  } = useCallStore();

  const primaryVideoRef = useRef(null);
  const secondaryVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const modalContainerRef = useRef(null);

  const [isPiPSwapped, setIsPiPSwapped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(16));
  const [isSpeakingWhileMuted, setIsSpeakingWhileMuted] = useState(false);

  useEffect(() => {
    if (socket) {
      initSocketListeners();
    }
  }, [socket, initSocketListeners]);

  // Fullscreen state listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Web Audio Analyser: real-time speech visualizer & speaking-while-muted alert
  useEffect(() => {
    if (callStatus !== "connected") {
      setRemoteAudioLevel(0);
      setFrequencyData(new Uint8Array(16));
      setIsSpeakingWhileMuted(false);
      return;
    }

    let audioCtx = null;
    let animFrameId = null;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      let remoteAnalyser = null;
      let localAnalyser = null;

      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        remoteAnalyser = audioCtx.createAnalyser();
        remoteAnalyser.fftSize = 64;
        remoteAnalyser.smoothingTimeConstant = 0.8;
        const remoteSource = audioCtx.createMediaStreamSource(remoteStream);
        remoteSource.connect(remoteAnalyser);
      }

      if (localStream && localStream.getAudioTracks().length > 0) {
        localAnalyser = audioCtx.createAnalyser();
        localAnalyser.fftSize = 64;
        localAnalyser.smoothingTimeConstant = 0.8;
        const localSource = audioCtx.createMediaStreamSource(localStream);
        localSource.connect(localAnalyser);
      }

      const remoteFreqArray = new Uint8Array(16);
      const localFreqArray = new Uint8Array(16);
      let mutedSpeakingCounter = 0;

      const updateLevels = () => {
        if (remoteAnalyser) {
          remoteAnalyser.getByteFrequencyData(remoteFreqArray);
          let sum = 0;
          for (let i = 0; i < 16; i++) sum += remoteFreqArray[i];
          const avg = Math.min(Math.round((sum / 16) * 1.5), 100);
          setRemoteAudioLevel(avg);
          setFrequencyData(new Uint8Array(remoteFreqArray));
        }

        if (localAnalyser) {
          localAnalyser.getByteFrequencyData(localFreqArray);
          let sum = 0;
          for (let i = 0; i < 16; i++) sum += localFreqArray[i];
          const avg = Math.min(Math.round((sum / 16) * 1.5), 100);

          const currentMuted = useCallStore.getState().isMuted;
          if (currentMuted && avg > 18) {
            mutedSpeakingCounter++;
            if (mutedSpeakingCounter > 6) {
              setIsSpeakingWhileMuted(true);
            }
          } else {
            mutedSpeakingCounter = 0;
            if (!currentMuted) {
              setIsSpeakingWhileMuted(false);
            }
          }
        }

        animFrameId = requestAnimationFrame(updateLevels);
      };

      updateLevels();
    } catch (err) {
      console.debug("Speech visualizer warning:", err);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (audioCtx) {
        try {
          audioCtx.close();
        } catch {}
      }
    };
  }, [remoteStream, localStream, callStatus]);

  // Video streams setup with click-to-swap PiP and complete loopback prevention
  useEffect(() => {
    // Primary video stream (large main container)
    const primaryEl = primaryVideoRef.current;
    if (primaryEl) {
      primaryEl.muted = true;
      primaryEl.volume = 0;
      const targetStream = isPiPSwapped ? localStream : remoteStream;
      if (targetStream) {
        const videoTracks = targetStream.getVideoTracks();
        if (videoTracks.length > 0) {
          primaryEl.srcObject = new MediaStream(videoTracks);
        } else {
          primaryEl.srcObject = null;
        }
      } else {
        primaryEl.srcObject = null;
      }
    }

    // Secondary video stream (small corner PiP container)
    const secondaryEl = secondaryVideoRef.current;
    if (secondaryEl) {
      secondaryEl.muted = true;
      secondaryEl.volume = 0;
      const targetStream = isPiPSwapped ? remoteStream : localStream;
      if (targetStream) {
        const videoTracks = targetStream.getVideoTracks();
        if (videoTracks.length > 0) {
          secondaryEl.srcObject = new MediaStream(videoTracks);
        } else {
          secondaryEl.srcObject = null;
        }
      } else {
        secondaryEl.srcObject = null;
      }
    }
  }, [localStream, remoteStream, callStatus, isMinimized, isPiPSwapped]);

  // Persistent audio playback strictly for connected call status
  useEffect(() => {
    if (callStatus === "connected" && remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current
        .play?.()
        .catch((e) => console.log("Remote audio auto-playback notification:", e));
    } else if (callStatus !== "connected" && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, [remoteStream, callStatus, isMinimized]);

  if (callStatus === "idle" || !otherUser) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* Hidden audio element ensuring crystal clear audio in voice calls and minimized widget */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {isMinimized && callStatus === "connected" ? (
        /* Minimized Floating Widget */
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[99999] bg-neutral-900/95 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl p-2.5 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="relative size-10 rounded-xl overflow-hidden bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
            {otherUser.profilePic ? (
              <img
                src={otherUser.profilePic}
                alt={otherUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              otherUser.fullName?.[0]?.toUpperCase() || "U"
            )}
            {remoteAudioLevel > 12 && (
              <span className="absolute inset-0 rounded-xl ring-2 ring-emerald-400 animate-ping pointer-events-none" />
            )}
            <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-neutral-900 animate-pulse" />
          </div>

          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-xs font-bold text-white truncate max-w-[120px]">
              {otherUser.fullName}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold font-mono">
              <span>{formatDuration(callDuration)}</span>
              {remoteAudioLevel > 15 && (
                <span className="flex items-center gap-0.5 text-emerald-300">
                  <Volume2 size={10} className="animate-pulse" />
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted
                  ? "bg-rose-500 text-white"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            <button
              type="button"
              onClick={toggleMinimize}
              className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Expand Call"
            >
              <Maximize2 size={14} />
            </button>

            <button
              type="button"
              onClick={endCall}
              className="size-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title="End Call"
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Full Screen Native Calling Canvas (WhatsApp / FaceTime Caliber) */
        <div
          ref={modalContainerRef}
          className="fixed inset-0 z-[99999] bg-gradient-to-b from-[#0f1b21] via-[#0b141a] to-[#070b0e] flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300 text-white"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-emerald-500/[0.08] blur-[140px] pointer-events-none" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 size-[500px] rounded-full bg-teal-500/[0.06] blur-[120px] pointer-events-none" />

          {/* Authentic Faint WhatsApp Doodle Texture (Overlay) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035]"
            style={{
              backgroundImage: 'url("/whatsapp-doodle-dark.svg")',
              backgroundSize: "380px 380px",
              backgroundRepeat: "repeat",
            }}
          />

          {/* Speaking While Muted Banner Alert */}
          {isSpeakingWhileMuted && isMuted && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 backdrop-blur-xl border border-rose-500/50 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
              <span className="size-2 rounded-full bg-rose-500 animate-ping" />
              <MicOff size={14} className="text-rose-400" />
              <span>Your microphone is muted</span>
              <button
                type="button"
                onClick={toggleMute}
                className="ml-1 text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
              >
                Unmute
              </button>
            </div>
          )}

          {/* Symmetrical Top Navigation Bar */}
          <header className="relative w-full max-w-3xl mx-auto px-5 sm:px-8 pt-5 sm:pt-7 pb-2 flex items-center justify-between z-20">
            {/* Left: Minimize Window */}
            <button
              type="button"
              onClick={toggleMinimize}
              className="size-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-sm"
              title="Minimize call"
            >
              <ChevronDown size={22} />
            </button>

            {/* Center: End-to-End Encryption Badge */}
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-emerald-400 text-xs font-medium shadow-sm">
              <Lock size={12} className="text-emerald-400" />
              <span>End-to-end encrypted</span>
            </div>

            {/* Right: Fullscreen & HD Voice Status */}
            <div className="flex items-center gap-2">
              {callStatus === "connected" && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-[11px] font-bold text-emerald-400">
                  <Wifi size={12} />
                  <span>HD Voice</span>
                </div>
              )}

              <button
                type="button"
                onClick={toggleFullscreen}
                className="size-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white/90 flex items-center justify-center transition-all cursor-pointer backdrop-blur-md border border-white/10 shadow-sm"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </header>

          {/* Center Stage: Video Display OR Voice Call Calling Avatar */}
          <main className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-6 py-4 z-10 relative">
            {callStatus === "connected" && callType === "video" && !isVideoOff && (localStream || remoteStream) ? (
              /* Video Stream Mode */
              <div className="relative w-full h-full max-h-[540px] rounded-2xl sm:rounded-3xl overflow-hidden bg-black/70 border border-white/15 flex items-center justify-center shadow-2xl">
                <video
                  ref={primaryVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
                />

                {/* Corner PiP Thumbnail (Secondary Feed) - Clickable to Swap */}
                {localStream && remoteStream && (
                  <div
                    onClick={() => setIsPiPSwapped((prev) => !prev)}
                    className="absolute top-4 right-4 w-28 sm:w-36 h-40 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black cursor-pointer group hover:scale-105 transition-transform"
                    title="Click to swap camera views 🔄"
                  >
                    <video
                      ref={secondaryVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <div className="size-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <ArrowLeftRight size={14} />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-[9px] font-semibold text-white/90">
                      {isPiPSwapped ? otherUser.fullName : "You"}
                    </div>
                  </div>
                )}

                {/* Speaker Status Pill on Video */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 border border-white/10 shadow-lg">
                  <span>{isPiPSwapped ? "You" : otherUser.fullName}</span>
                  {remoteAudioLevel > 15 && (
                    <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                      <Volume2 size={12} className="animate-pulse" />
                      Speaking
                    </span>
                  )}
                  {isMuted && <MicOff size={12} className="text-rose-400" />}
                </div>
              </div>
            ) : (
              /* Voice Call / Calling / Avatar Display */
              <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 my-auto">
                {/* Dynamic Glowing Avatar with Ripple Animations */}
                <div className="relative flex items-center justify-center">
                  {/* Soft Ambient Radial Halo */}
                  <div className="absolute size-52 sm:size-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

                  {/* Ripple Waves on Calling / Incoming */}
                  {(callStatus === "calling" || callStatus === "incoming") && (
                    <>
                      <div className="absolute size-36 sm:size-44 rounded-full border border-emerald-500/30 animate-call-ripple-1 pointer-events-none" />
                      <div className="absolute size-36 sm:size-44 rounded-full border border-emerald-400/25 animate-call-ripple-2 pointer-events-none" />
                      <div className="absolute size-36 sm:size-44 rounded-full border border-teal-400/20 animate-call-ripple-3 pointer-events-none" />
                    </>
                  )}

                  {/* Speech Glow on Connected */}
                  {callStatus === "connected" && remoteAudioLevel > 12 && (
                    <div
                      className="absolute size-36 sm:size-44 rounded-full bg-emerald-400/25 blur-xl pointer-events-none transition-transform duration-100"
                      style={{
                        transform: `scale(${1 + (remoteAudioLevel / 100) * 0.45})`,
                      }}
                    />
                  )}

                  {/* Avatar Circle */}
                  <div
                    className={`relative size-32 sm:size-40 rounded-full overflow-hidden transition-all duration-200 ${
                      callStatus === "connected" && remoteAudioLevel > 15
                        ? "ring-4 ring-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.5)]"
                        : "ring-4 ring-white/20 shadow-2xl shadow-black/80"
                    } bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold`}
                  >
                    {otherUser.profilePic ? (
                      <img
                        src={otherUser.profilePic}
                        alt={otherUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      otherUser.fullName?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                </div>

                {/* Name & Status */}
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow">
                    {otherUser.fullName}
                  </h2>

                  <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium">
                    {callStatus === "calling" && (
                      <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <span>Calling</span>
                        <span className="flex items-center gap-1 pt-1">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      </div>
                    )}

                    {callStatus === "incoming" && (
                      <div className="flex items-center gap-2 text-emerald-400 font-medium animate-pulse">
                        {callType === "video" ? <Video size={17} /> : <Phone size={17} />}
                        <span>Incoming {callType} call...</span>
                      </div>
                    )}

                    {callStatus === "connected" && (
                      <div className="flex flex-col items-center gap-2.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm sm:text-base font-semibold px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{formatDuration(callDuration)}</span>
                        </div>

                        {/* 16-Band Audio Frequency Spectrum */}
                        <div className="flex items-center gap-1 h-8 pt-1">
                          {Array.from({ length: 16 }).map((_, idx) => {
                            const freqVal = frequencyData[idx] || 0;
                            const heightPercent = isMuted
                              ? 10
                              : Math.max(12, Math.min(100, Math.round((freqVal / 255) * 100)));

                            return (
                              <div
                                key={idx}
                                className={`w-1 rounded-full transition-all duration-75 ${
                                  remoteAudioLevel > 12
                                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                    : "bg-white/20"
                                }`}
                                style={{ height: `${heightPercent}%` }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Bottom Action Controls Toolbar */}
          <footer className="w-full max-w-xl mx-auto px-6 pb-10 sm:pb-14 pt-4 z-20 flex items-center justify-center">
            {callStatus === "incoming" ? (
              /* Incoming Call Controls: Decline & Accept */
              <div className="flex items-center gap-16 sm:gap-24">
                {/* Decline Button */}
                <button
                  type="button"
                  onClick={() => rejectCall("declined")}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="size-16 sm:size-18 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 ring-4 ring-rose-500/25 group-hover:scale-105 active:scale-95 transition-all">
                    <PhoneOff size={26} />
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2.5">
                    Decline
                  </span>
                </button>

                {/* Accept Button */}
                <button
                  type="button"
                  onClick={acceptCall}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="size-16 sm:size-18 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-xl shadow-emerald-950/60 ring-4 ring-emerald-400/35 group-hover:scale-105 active:scale-95 transition-all animate-accept-glow ring-offset-2 ring-offset-[#0b141a]">
                    <Phone size={26} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 tracking-wide mt-2.5">
                    Accept
                  </span>
                </button>
              </div>
            ) : callStatus === "calling" ? (
              /* Calling (Outgoing) Controls */
              <div className="flex items-center gap-8 sm:gap-12">
                {/* Mic Mute / Unmute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`size-14 sm:size-16 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border backdrop-blur-md ${
                      isMuted
                        ? "bg-rose-500 text-white border-rose-500/50 shadow-lg shadow-rose-950/50 ring-4 ring-rose-500/20"
                        : "bg-white/10 hover:bg-white/15 text-white border-white/10"
                    }`}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2.5">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </button>

                {/* Flip Camera (for video call) */}
                {callType === "video" && (
                  <button
                    type="button"
                    onClick={flipCamera}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className="size-14 sm:size-16 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border border-white/10 backdrop-blur-md">
                      <RefreshCw size={20} />
                    </div>
                    <span className="text-xs font-semibold text-white/70 tracking-wide mt-2.5">
                      Flip
                    </span>
                  </button>
                )}

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="size-16 sm:size-18 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 ring-4 ring-rose-500/25 group-hover:scale-105 active:scale-95 transition-all">
                    <PhoneOff size={26} />
                  </div>
                  <span className="text-xs font-semibold text-rose-400 tracking-wide mt-2.5">
                    End Call
                  </span>
                </button>
              </div>
            ) : callType === "voice" ? (
              /* Connected Voice Call Controls */
              <div className="flex items-center justify-center gap-8 sm:gap-12">
                {/* Mic Mute / Unmute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`size-14 sm:size-16 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border backdrop-blur-md ${
                      isMuted
                        ? "bg-rose-500 text-white border-rose-500/50 shadow-lg shadow-rose-950/50 ring-4 ring-rose-500/20"
                        : "bg-white/10 hover:bg-white/15 text-white border-white/10"
                    }`}
                  >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2.5">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="size-16 sm:size-18 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 ring-4 ring-rose-500/25 group-hover:scale-105 active:scale-95 transition-all">
                    <PhoneOff size={26} />
                  </div>
                  <span className="text-xs font-semibold text-rose-400 tracking-wide mt-2.5">
                    End Call
                  </span>
                </button>
              </div>
            ) : (
              /* Connected Video Call Controls */
              <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
                {/* Mic Mute / Unmute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`size-13 sm:size-15 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border backdrop-blur-md ${
                      isMuted
                        ? "bg-rose-500 text-white border-rose-500/50 shadow-lg shadow-rose-950/50 ring-4 ring-rose-500/20"
                        : "bg-white/10 hover:bg-white/15 text-white border-white/10"
                    }`}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </button>

                {/* Camera Toggle */}
                <button
                  type="button"
                  onClick={toggleVideo}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`size-13 sm:size-15 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border backdrop-blur-md ${
                      isVideoOff
                        ? "bg-rose-500 text-white border-rose-500/50 shadow-lg shadow-rose-950/50 ring-4 ring-rose-500/20"
                        : "bg-white/10 hover:bg-white/15 text-white border-white/10"
                    }`}
                  >
                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2">
                    Camera
                  </span>
                </button>

                {/* Flip Camera */}
                <button
                  type="button"
                  onClick={flipCamera}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="size-13 sm:size-15 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border border-white/10 backdrop-blur-md">
                    <RefreshCw size={19} />
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2">
                    Flip
                  </span>
                </button>

                {/* Screen Share (Hidden on small mobile screens) */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className="hidden sm:flex flex-col items-center group cursor-pointer"
                >
                  <div
                    className={`size-13 sm:size-15 rounded-full flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 border backdrop-blur-md ${
                      isScreenSharing
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-950/50 ring-4 ring-emerald-400/20"
                        : "bg-white/10 hover:bg-white/15 text-white border-white/10"
                    }`}
                  >
                    <Monitor size={20} />
                  </div>
                  <span className="text-xs font-semibold text-white/70 tracking-wide mt-2">
                    Share
                  </span>
                </button>

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="size-15 sm:size-17 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-950/60 ring-4 ring-rose-500/25 group-hover:scale-105 active:scale-95 transition-all">
                    <PhoneOff size={24} />
                  </div>
                  <span className="text-xs font-semibold text-rose-400 tracking-wide mt-2">
                    End Call
                  </span>
                </button>
              </div>
            )}
          </footer>
        </div>
      )}
    </>,
    document.body
  );
};

export default CallModal;
