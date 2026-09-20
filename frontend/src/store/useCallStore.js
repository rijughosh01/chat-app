import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import {
  startRingtone,
  stopRingtone,
  playCallConnectedTone,
  playCallEndTone,
} from "../lib/callSounds";

let durationTimer = null;
let callTimeoutTimer = null;
let peerConnection = null;
let pendingIceCandidates = [];

// Redundant multi-STUN server list for reliable NAT traversal across mobile & Wi-Fi networks
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
};

const clearCallTimeout = () => {
  if (callTimeoutTimer) {
    clearTimeout(callTimeoutTimer);
    callTimeoutTimer = null;
  }
};

const flushPendingIceCandidates = async (pc) => {
  if (!pc || !pc.remoteDescription) return;
  while (pendingIceCandidates.length > 0) {
    const candidate = pendingIceCandidates.shift();
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn("Error adding queued ICE candidate:", err);
    }
  }
};

export const useCallStore = create((set, get) => ({
  callStatus: "idle", // 'idle' | 'calling' | 'incoming' | 'connected'
  callType: "voice", // 'voice' | 'video'
  otherUser: null,
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  isMinimized: false,
  isFrontCamera: true,
  callDuration: 0,
  localStream: null,
  remoteStream: null,

  createPeerConnection: (targetUserId) => {
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.close();
      peerConnection = null;
    }

    const socket = useAuthStore.getState().socket;
    peerConnection = new RTCPeerConnection(RTC_CONFIG);

    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          peerConnection.addTrack(track, localStream);
        } catch (e) {
          console.warn("Could not add track to peer connection:", e);
        }
      });
    }

    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        set({ remoteStream: event.streams[0] });
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserId) {
        socket.emit("call:signal", {
          to: targetUserId,
          signal: { candidate: event.candidate },
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      if (
        peerConnection?.connectionState === "failed" ||
        peerConnection?.connectionState === "disconnected"
      ) {
        console.warn("WebRTC connection state:", peerConnection.connectionState);
      }
    };

    return peerConnection;
  },

  initSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("call:incoming");
    socket.off("call:accepted");
    socket.off("call:rejected");
    socket.off("call:ended");
    socket.off("call:signal");
    socket.off("call:handled");

    socket.on("call:incoming", (data) => {
      const { callStatus } = get();
      if (callStatus !== "idle") {
        socket.emit("call:reject", { to: data.from, reason: "busy" });
        return;
      }
      get().receiveIncomingCall(data);
    });

    socket.on("call:accepted", async () => {
      clearCallTimeout();
      stopRingtone();
      playCallConnectedTone();
      if (durationTimer) clearInterval(durationTimer);
      durationTimer = setInterval(() => {
        set((state) => ({ callDuration: state.callDuration + 1 }));
      }, 1000);

      set({
        callStatus: "connected",
        callDuration: 0,
      });

      // Caller creates WebRTC offer
      const { otherUser } = get();
      if (otherUser?._id) {
        const pc = get().createPeerConnection(otherUser._id);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("call:signal", {
            to: otherUser._id,
            signal: { sdp: offer },
          });
        } catch (err) {
          console.warn("WebRTC offer creation error:", err);
        }
      }

      toast.success("Call connected 📞");
    });

    socket.on("call:signal", async ({ from, signal }) => {
      const { otherUser } = get();
      const targetId = otherUser?._id || from;

      if (signal.sdp) {
        let pc = peerConnection;
        if (!pc) {
          pc = get().createPeerConnection(targetId);
        }

        try {
          if (signal.sdp.type === "offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await flushPendingIceCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("call:signal", {
              to: targetId,
              signal: { sdp: answer },
            });
          } else if (signal.sdp.type === "answer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            await flushPendingIceCandidates(pc);
          }
        } catch (err) {
          console.warn("WebRTC SDP signaling error:", err);
        }
      }

      if (signal.candidate) {
        if (!peerConnection || !peerConnection.remoteDescription) {
          pendingIceCandidates.push(signal.candidate);
        } else {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(signal.candidate)
            );
          } catch (err) {
            console.warn("WebRTC ICE candidate error:", err);
          }
        }
      }
    });

    socket.on("call:rejected", ({ reason }) => {
      clearCallTimeout();
      stopRingtone();
      playCallEndTone();
      get().cleanupStream();
      if (durationTimer) {
        clearInterval(durationTimer);
        durationTimer = null;
      }
      set({
        callStatus: "idle",
        otherUser: null,
        callDuration: 0,
        isMinimized: false,
      });

      const message =
        reason === "busy"
          ? "User is on another call 📵"
          : reason === "no_answer"
          ? "User did not answer 📵"
          : "Call declined 📵";

      toast(message, { icon: "ℹ️" });
    });

    socket.on("call:ended", ({ reason }) => {
      clearCallTimeout();
      stopRingtone();
      playCallEndTone();
      get().cleanupStream();
      if (durationTimer) {
        clearInterval(durationTimer);
        durationTimer = null;
      }
      set({
        callStatus: "idle",
        otherUser: null,
        callDuration: 0,
        isMinimized: false,
      });

      if (reason === "disconnected") {
        toast("Call ended (user disconnected) 📞", { icon: "ℹ️" });
      } else {
        toast("Call ended 📞", { icon: "ℹ️" });
      }
    });

    // Dismiss incoming ringing if call was answered/declined in another tab
    socket.on("call:handled", () => {
      const { callStatus } = get();
      if (callStatus === "incoming") {
        stopRingtone();
        clearCallTimeout();
        set({
          callStatus: "idle",
          otherUser: null,
          callDuration: 0,
          isMinimized: false,
        });
      }
    });
  },

  cleanupStream: () => {
    clearCallTimeout();
    pendingIceCandidates = [];
    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.close();
      peerConnection = null;
    }
    const { localStream } = get();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    set({ localStream: null, remoteStream: null });
  },

  startCall: async ({ user, callType = "voice" }) => {
    if (!user) return;
    const authUser = useAuthStore.getState().authUser;
    const socket = useAuthStore.getState().socket;
    const onlineUsers = useAuthStore.getState().onlineUsers || [];

    if (!socket) {
      toast.error("Connecting to network, please wait...");
      return;
    }

    const isOnline = onlineUsers.includes(user._id);
    if (!isOnline) {
      toast(`${user.fullName} is offline. You can leave a voice note instead 🎙️`, {
        icon: "ℹ️",
      });
    }

    let stream = null;
    let effectiveCallType = callType;
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video" ? { facingMode: "user" } : false,
          });
        } catch (camErr) {
          if (callType === "video") {
            console.warn("Webcam access failed, falling back to voice call:", camErr);
            toast("Camera unavailable, switched to voice call 🎙️", { icon: "⚠️" });
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            effectiveCallType = "voice";
          } else {
            throw camErr;
          }
        }
      }
    } catch (err) {
      console.warn("Media devices not accessible:", err);
      toast.error("Microphone permission denied or device not found");
    }

    set({
      callStatus: "calling",
      callType: effectiveCallType,
      otherUser: user,
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      isMinimized: false,
      isFrontCamera: true,
      callDuration: 0,
      localStream: stream,
    });

    startRingtone();

    // 45-second call timeout (WhatsApp style)
    clearCallTimeout();
    callTimeoutTimer = setTimeout(() => {
      const { callStatus } = get();
      if (callStatus === "calling") {
        toast("No answer from user 📵", { icon: "ℹ️" });
        get().endCall();
      }
    }, 45000);

    socket.emit("call:initiate", {
      to: user._id,
      callType: effectiveCallType,
      callerName: authUser?.fullName || "A Contact",
      callerPic: authUser?.profilePic || "",
    });
  },

  receiveIncomingCall: ({ from, callType, callerName, callerPic }) => {
    startRingtone();
    clearCallTimeout();
    callTimeoutTimer = setTimeout(() => {
      const { callStatus } = get();
      if (callStatus === "incoming") {
        get().rejectCall("no_answer");
      }
    }, 45000);

    set({
      callStatus: "incoming",
      callType: callType || "voice",
      otherUser: {
        _id: from,
        fullName: callerName || "Incoming Caller",
        profilePic: callerPic || "",
      },
      callDuration: 0,
      isMinimized: false,
    });
  },

  acceptCall: async () => {
    const { otherUser, callType } = get();
    const socket = useAuthStore.getState().socket;
    clearCallTimeout();
    stopRingtone();

    let stream = null;
    let effectiveCallType = callType;
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video" ? { facingMode: "user" } : false,
          });
        } catch (camErr) {
          if (callType === "video") {
            console.warn("Webcam access failed on accept, switching to voice:", camErr);
            toast("Camera unavailable, connected as voice call 🎙️", { icon: "⚠️" });
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            effectiveCallType = "voice";
          } else {
            throw camErr;
          }
        }
      }
    } catch (err) {
      console.warn("Microphone/Camera unavailable:", err);
    }

    set({
      callStatus: "connected",
      callType: effectiveCallType,
      localStream: stream,
      callDuration: 0,
    });

    if (otherUser?._id) {
      get().createPeerConnection(otherUser._id);
    }

    if (socket && otherUser?._id) {
      socket.emit("call:accept", { to: otherUser._id });
    }

    playCallConnectedTone();

    if (durationTimer) clearInterval(durationTimer);
    durationTimer = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
  },

  rejectCall: (reason = "declined") => {
    const { otherUser } = get();
    const socket = useAuthStore.getState().socket;
    clearCallTimeout();
    stopRingtone();
    get().cleanupStream();

    if (socket && otherUser?._id) {
      socket.emit("call:reject", { to: otherUser._id, reason });
    }

    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }

    set({
      callStatus: "idle",
      otherUser: null,
      callDuration: 0,
      isMinimized: false,
    });
  },

  endCall: () => {
    const { otherUser, callDuration } = get();
    const socket = useAuthStore.getState().socket;
    clearCallTimeout();
    stopRingtone();
    playCallEndTone();
    get().cleanupStream();

    if (socket && otherUser?._id) {
      socket.emit("call:end", { to: otherUser._id });
    }

    if (durationTimer) {
      clearInterval(durationTimer);
      durationTimer = null;
    }

    const minutes = Math.floor(callDuration / 60);
    const seconds = callDuration % 60;
    const timeStr = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    set({
      callStatus: "idle",
      otherUser: null,
      callDuration: 0,
      isMinimized: false,
    });

    toast(`Call ended (${timeStr})`, { icon: "📞" });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    const nextMuted = !isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    set({ isMuted: nextMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    const nextVideoOff = !isVideoOff;
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });
    }
    set({ isVideoOff: nextVideoOff });
  },

  flipCamera: async () => {
    const { localStream, isFrontCamera, callType } = get();
    if (!localStream || callType !== "video") return;
    const nextFacing = !isFrontCamera;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing ? "user" : "environment" },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = localStream.getVideoTracks()[0];

      if (peerConnection) {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      if (oldVideoTrack) {
        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStream.addTrack(newVideoTrack);

      set({
        localStream: new MediaStream(localStream.getTracks()),
        isFrontCamera: nextFacing,
      });
      toast("Camera switched 📷", { icon: "🔄" });
    } catch (err) {
      console.warn("Could not switch camera:", err);
      toast("Could not switch camera", { icon: "⚠️" });
    }
  },

  toggleScreenShare: async () => {
    const { isScreenSharing, localStream } = get();
    if (isScreenSharing) {
      set({ isScreenSharing: false });
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenVideoTrack = screenStream.getVideoTracks()[0];

        if (peerConnection) {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(screenVideoTrack);
          }
        }

        screenVideoTrack.onended = () => {
          set({ isScreenSharing: false });
        };
        set({ isScreenSharing: true, localStream: screenStream });
      } else {
        toast("Screen sharing is not supported in this browser", { icon: "⚠️" });
      }
    } catch {
      // User cancelled screen share
    }
  },

  toggleMinimize: () => {
    set((state) => ({ isMinimized: !state.isMinimized }));
  },
}));
