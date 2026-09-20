// Web Audio API Ringtone & Call Tone System
// Uses pre-computed AudioBuffers to eliminate live oscillator scheduling bugs, ghost tones, and audio leaks

let audioCtx = null;
let currentRingtoneSource = null;
let cachedBuffers = {
  incoming: null,
  outgoing: null,
  connected: null,
  ended: null,
};

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
 * Creates an incoming ringtone buffer: a pleasant, melodic WhatsApp-style marimba chime
 */
function createIncomingBuffer(ctx) {
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 3.0;
  const totalSamples = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = audioBuffer.getChannelData(0);

  // Pentatonic notes: E5, G#5, B5, E6, C#6, B5, G#5, E5
  const notes = [
    { freq: 659.25, start: 0.00, dur: 0.25, gain: 0.22 },
    { freq: 830.61, start: 0.18, dur: 0.25, gain: 0.22 },
    { freq: 987.77, start: 0.36, dur: 0.25, gain: 0.24 },
    { freq: 1318.51, start: 0.54, dur: 0.38, gain: 0.26 },
    { freq: 1108.73, start: 0.78, dur: 0.25, gain: 0.22 },
    { freq: 987.77, start: 0.96, dur: 0.25, gain: 0.22 },
    { freq: 830.61, start: 1.14, dur: 0.28, gain: 0.20 },
    { freq: 659.25, start: 1.34, dur: 0.45, gain: 0.22 },
  ];

  notes.forEach((note) => {
    const startSample = Math.floor(note.start * sampleRate);
    const noteSamples = Math.floor(note.dur * sampleRate);
    for (let i = 0; i < noteSamples && startSample + i < totalSamples; i++) {
      const t = i / sampleRate;
      // Exponential acoustic decay
      const envelope = Math.exp(-t * 9.5);
      // Sine fundamental + gentle octave harmonic
      const val =
        (Math.sin(2 * Math.PI * note.freq * t) +
          0.14 * Math.sin(2 * Math.PI * note.freq * 2 * t)) *
        envelope *
        note.gain;
      data[startSample + i] += val;
    }
  });

  return audioBuffer;
}

/**
 * Creates an outgoing dial tone buffer: a soft, gentle 425Hz pulse with smooth attack & release
 */
function createOutgoingBuffer(ctx) {
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 3.2; // 1s tone, 2.2s silence
  const totalSamples = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = audioBuffer.getChannelData(0);

  const toneDuration = 0.9;
  const toneSamples = Math.floor(toneDuration * sampleRate);
  const freq = 425.0; // European / cellular standard gentle dial frequency

  for (let i = 0; i < toneSamples && i < totalSamples; i++) {
    const t = i / sampleRate;
    // Smooth cosine envelope for zero clicks or harshness
    let env = 1.0;
    if (t < 0.08) {
      env = 0.5 * (1 - Math.cos((Math.PI * t) / 0.08));
    } else if (t > toneDuration - 0.08) {
      env = 0.5 * (1 + Math.cos((Math.PI * (t - (toneDuration - 0.08))) / 0.08));
    }
    data[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.12;
  }

  return audioBuffer;
}

/**
 * Creates call connected chime buffer (C5 -> G5 ascending)
 */
function createConnectedBuffer(ctx) {
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 0.6;
  const totalSamples = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = audioBuffer.getChannelData(0);

  const notes = [
    { freq: 523.25, start: 0.00, dur: 0.25, gain: 0.16 }, // C5
    { freq: 783.99, start: 0.14, dur: 0.40, gain: 0.20 }, // G5
  ];

  notes.forEach((note) => {
    const startSample = Math.floor(note.start * sampleRate);
    const noteSamples = Math.floor(note.dur * sampleRate);
    for (let i = 0; i < noteSamples && startSample + i < totalSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 8);
      data[startSample + i] += Math.sin(2 * Math.PI * note.freq * t) * envelope * note.gain;
    }
  });

  return audioBuffer;
}

/**
 * Creates call ended tone buffer (G4 -> C4 descending)
 */
function createEndedBuffer(ctx) {
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 0.5;
  const totalSamples = Math.floor(sampleRate * duration);
  const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = audioBuffer.getChannelData(0);

  const notes = [
    { freq: 659.25, start: 0.00, dur: 0.18, gain: 0.14 }, // E5
    { freq: 440.00, start: 0.12, dur: 0.30, gain: 0.16 }, // A4
  ];

  notes.forEach((note) => {
    const startSample = Math.floor(note.start * sampleRate);
    const noteSamples = Math.floor(note.dur * sampleRate);
    for (let i = 0; i < noteSamples && startSample + i < totalSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 9);
      data[startSample + i] += Math.sin(2 * Math.PI * note.freq * t) * envelope * note.gain;
    }
  });

  return audioBuffer;
}

function getBuffer(ctx, type) {
  if (!cachedBuffers[type]) {
    switch (type) {
      case "incoming":
        cachedBuffers.incoming = createIncomingBuffer(ctx);
        break;
      case "outgoing":
        cachedBuffers.outgoing = createOutgoingBuffer(ctx);
        break;
      case "connected":
        cachedBuffers.connected = createConnectedBuffer(ctx);
        break;
      case "ended":
        cachedBuffers.ended = createEndedBuffer(ctx);
        break;
      default:
        break;
    }
  }
  return cachedBuffers[type];
}

/**
 * Instantly stops any playing ringtone with zero chance of sound leaking into connected calls
 */
export function stopRingtone() {
  if (currentRingtoneSource) {
    try {
      currentRingtoneSource.stop(0);
      currentRingtoneSource.disconnect();
    } catch {}
    currentRingtoneSource = null;
  }
}

/**
 * Starts playing either the incoming melodic chime or outgoing soft dial pulse
 * @param {'incoming' | 'outgoing'} mode
 */
export function startRingtone(mode = "incoming") {
  stopRingtone();
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = getBuffer(ctx, mode === "outgoing" ? "outgoing" : "incoming");
  if (!buffer) return;

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(mode === "outgoing" ? 0.35 : 0.55, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
    currentRingtoneSource = source;
  } catch (err) {
    console.debug("Could not start ringtone source:", err);
  }
}

/**
 * Plays a pleasant ascending chime when call connects
 */
export function playCallConnectedTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = getBuffer(ctx, "connected");
  if (!buffer) return;

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = false;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch {}
}

/**
 * Plays a short, soft descending chime when call ends
 */
export function playCallEndTone() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const buffer = getBuffer(ctx, "ended");
  if (!buffer) return;

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = false;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
  } catch {}
}
