import { useEffect, useRef } from "react";
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
  RefreshCw,
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

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (socket) {
      initSocketListeners();
    }
  }, [socket, initSocketListeners]);

  // Local video preview: ALWAYS strip audio tracks and hard-mute to prevent self-microphone feedback loops
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.muted = true;
      localVideoRef.current.volume = 0;
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
          localVideoRef.current.srcObject = new MediaStream(videoTracks);
        } else {
          localVideoRef.current.srcObject = null;
        }
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream, callStatus, isMinimized]);

  // Remote video element: hard-mute so it only renders video frames without duplicate audio echo
  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = true;
      remoteVideoRef.current.volume = 0;
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else {
        remoteVideoRef.current.srcObject = null;
      }
    }
  }, [remoteStream, callStatus, isMinimized]);

  // Persistent audio playback for voice calls, video calls, and minimized mode
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
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[99999] bg-base-100/95 backdrop-blur-xl border border-base-content/15 shadow-2xl rounded-2xl p-2.5 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="relative size-10 rounded-xl overflow-hidden bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            {otherUser.profilePic ? (
              <img
                src={otherUser.profilePic}
                alt={otherUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              otherUser.fullName?.[0]?.toUpperCase() || "U"
            )}
            <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-base-100 animate-pulse" />
          </div>

          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-xs font-bold text-base-content truncate max-w-[120px]">
              {otherUser.fullName}
            </span>
            <span className="text-[10px] text-emerald-500 font-semibold tracking-wider font-mono">
              {formatDuration(callDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className={`size-8 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? "bg-rose-500 text-white"
                  : "bg-base-200 text-base-content/80 hover:bg-base-300"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
            </button>

            <button
              type="button"
              onClick={toggleMinimize}
              className="size-8 rounded-full bg-base-200 hover:bg-base-300 text-base-content/80 flex items-center justify-center transition-all"
              title="Expand Call"
            >
              <Maximize2 size={14} />
            </button>

            <button
              type="button"
              onClick={endCall}
              className="size-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
              title="End Call"
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </div>
      ) : (
        /* Full Screen / Modal View */
        <div className="fixed inset-0 z-[99999] bg-neutral-950/90 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-300">
          {/* Background Decorative Ambient Glows */}
          <div className="absolute top-1/4 left-1/4 size-80 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 size-80 rounded-full bg-teal-600/15 blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-lg md:max-w-xl h-[85vh] max-h-[640px] bg-neutral-900/90 border border-white/10 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden p-6 text-white">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
                  {callType === "video" ? "Video Call" : "Voice Call"}
                </span>
              </div>

              {callStatus === "connected" && (
                <button
                  type="button"
                  onClick={toggleMinimize}
                  className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Minimize call"
                >
                  <Minimize2 size={16} />
                </button>
              )}
            </div>

            {/* Center Content Section */}
            <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full relative">
              {/* Video Stream Display */}
              {callStatus === "connected" && callType === "video" && !isVideoOff && (localStream || remoteStream) ? (
                <div className="relative w-full h-full max-h-[380px] rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  )}

                  {/* Local PiP thumbnail when remote stream is active */}
                  {remoteStream && localStream && (
                    <div className="absolute top-3 right-3 w-24 sm:w-28 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5">
                    <span>{otherUser.fullName}</span>
                    {isMuted && <MicOff size={12} className="text-rose-400" />}
                  </div>
                </div>
              ) : (
                /* Voice / Calling / Avatar Display */
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Pulsing Avatar with Waves */}
                  <div className="relative">
                    {callStatus === "calling" || callStatus === "incoming" ? (
                      <>
                        <div className="absolute inset-0 size-32 sm:size-36 rounded-full bg-emerald-500/20 animate-ping" />
                        <div className="absolute -inset-3 size-38 sm:size-42 rounded-full border border-emerald-500/30 animate-pulse" />
                      </>
                    ) : null}

                    <div className="relative size-28 sm:size-32 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-bold">
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

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {otherUser.fullName}
                    </h2>
                    <div className="text-sm font-medium text-white/70 flex items-center justify-center gap-1.5">
                      {callStatus === "calling" && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          Calling
                          <span className="flex gap-0.5 pt-1">
                            <span className="size-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="size-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="size-1 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        </span>
                      )}
                      {callStatus === "incoming" && (
                        <span className="text-emerald-400 animate-pulse font-semibold">
                          Incoming {callType} call...
                        </span>
                      )}
                      {callStatus === "connected" && (
                        <span className="text-emerald-400 font-mono tracking-wider font-semibold">
                          {formatDuration(callDuration)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Sound Wave Bars for Connected Voice Call */}
                  {callStatus === "connected" && (
                    <div className="flex items-center gap-1.5 pt-2 h-8">
                      {[40, 75, 100, 60, 90, 45, 80, 50, 70, 30].map((height, idx) => (
                        <div
                          key={idx}
                          className="w-1 bg-emerald-400 rounded-full animate-pulse"
                          style={{
                            height: isMuted ? "4px" : `${height}%`,
                            animationDuration: `${0.6 + (idx % 3) * 0.2}s`,
                            animationDelay: `${idx * 80}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Call Controls */}
            <div className="z-10 pt-4 flex items-center justify-center gap-4 sm:gap-6">
              {callStatus === "incoming" ? (
                /* Incoming call Accept / Decline buttons */
                <div className="flex items-center gap-12 sm:gap-16">
                  <button
                    type="button"
                    onClick={() => rejectCall("declined")}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="size-14 sm:size-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-all">
                      <PhoneOff size={24} />
                    </div>
                    <span className="text-xs font-semibold text-white/80">Decline</span>
                  </button>

                  <button
                    type="button"
                    onClick={acceptCall}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="size-14 sm:size-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-all animate-bounce">
                      <Phone size={24} />
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">Accept</span>
                  </button>
                </div>
              ) : (
                /* Outgoing & Connected Call Controls */
                <div className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md px-4 sm:px-6 py-3 rounded-full border border-white/10 shadow-xl">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`size-11 sm:size-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isMuted
                        ? "bg-rose-500 text-white"
                        : "bg-white/15 hover:bg-white/25 text-white"
                    }`}
                    title={isMuted ? "Unmute microphone" : "Mute microphone"}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  {callType === "video" && (
                    <button
                      type="button"
                      onClick={toggleVideo}
                      className={`size-11 sm:size-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isVideoOff
                          ? "bg-rose-500 text-white"
                          : "bg-white/15 hover:bg-white/25 text-white"
                      }`}
                      title={isVideoOff ? "Turn on camera" : "Turn off camera"}
                    >
                      {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                    </button>
                  )}

                  {callType === "video" && (
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      className={`size-11 sm:size-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isScreenSharing
                          ? "bg-indigo-500 text-white"
                          : "bg-white/15 hover:bg-white/25 text-white"
                      }`}
                      title="Share Screen"
                    >
                      <Monitor size={20} />
                    </button>
                  )}

                  {callType === "video" && (
                    <button
                      type="button"
                      onClick={flipCamera}
                      className="size-11 sm:size-12 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Flip Camera"
                    >
                      <RefreshCw size={19} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={endCall}
                    className="size-11 sm:size-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
                    title="End Call"
                  >
                    <PhoneOff size={22} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default CallModal;
