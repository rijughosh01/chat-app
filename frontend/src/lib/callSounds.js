// Web Audio API Ringtone & Call Tone Synthesizer
let audioCtx = null;
let ringtoneInterval = null;
let currentOscillators = [];

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Starts generating a realistic dual-frequency phone ring tone
 * Cadence: 1.5s tone, 2s pause
 */
export function startRingtone() {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  function playToneBurst() {
    try {
      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
      gainNode.gain.setValueAtTime(0.12, now + 1.4);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
      gainNode.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(440, now); // Standard A4

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(480, now); // US / UK standard ring pair

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.55);
      osc2.stop(now + 1.55);

      currentOscillators = [osc1, osc2];
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  playToneBurst();
  ringtoneInterval = setInterval(playToneBurst, 3500);
}

export function stopRingtone() {
  if (ringtoneInterval) {
    clearInterval(ringtoneInterval);
    ringtoneInterval = null;
  }
  currentOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {}
  });
  currentOscillators = [];
}

/**
 * Plays a pleasant ascending chime when call connects
 */
export function playCallConnectedTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.4); // G5
    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {}
}

/**
 * Plays a short descending beep when call ends
 */
export function playCallEndTone() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
    osc.connect(gain);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch {}
}
