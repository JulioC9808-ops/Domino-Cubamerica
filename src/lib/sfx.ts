/**
 * Sonidos del juego generados con WebAudio (sin archivos externos).
 * "tok tok" de madera al colocar/pasar, fanfarrias al ganar/perder,
 * campanita al subir de nivel y clicks suaves de interfaz.
 */

let ctx: AudioContext | null = null;
let muted = false;

const KEY = "domino:muted";

export function initSfx() {
  if (typeof window === "undefined") return;
  muted = window.localStorage.getItem(KEY) === "1";
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, value ? "1" : "0");
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOpts = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
  sweepTo?: number;
};

function tone({ freq, dur, type = "sine", gain = 0.18, delay = 0, sweepTo }: ToneOpts) {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

/** Golpe seco de madera: ficha contra la mesa. */
function knock(delay = 0, pitch = 1) {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime + delay;
  const len = Math.floor(ac.sampleRate * 0.06);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 420 * pitch;
  bp.Q.value = 3.2;
  const g = ac.createGain();
  g.gain.value = 0.5;
  src.connect(bp).connect(g).connect(ac.destination);
  src.start(t0);
  tone({ freq: 180 * pitch, dur: 0.09, type: "triangle", gain: 0.12, delay, sweepTo: 90 * pitch });
}

export const sfx = {
  /** Colocar ficha en la mesa. */
  place() {
    knock(0, 1);
  },
  /** Pasar: tok tok tok, como tocar la puerta. */
  pass() {
    knock(0, 0.9);
    knock(0.14, 0.95);
    knock(0.28, 0.88);
  },
  /** Repartir fichas. */
  deal() {
    for (let i = 0; i < 5; i++) knock(i * 0.05, 1.2 + i * 0.05);
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.28, type: "triangle", gain: 0.16, delay: i * 0.1 }),
    );
  },
  lose() {
    [392, 329.63, 261.63].forEach((f, i) =>
      tone({ freq: f, dur: 0.34, type: "sawtooth", gain: 0.1, delay: i * 0.13 }),
    );
  },
  /** Tranque / tabla. */
  block() {
    knock(0, 0.7);
    tone({ freq: 220, dur: 0.5, type: "square", gain: 0.08, delay: 0.05, sweepTo: 130 });
  },
  levelUp() {
    [659.25, 830.61, 987.77, 1318.5].forEach((f, i) =>
      tone({ freq: f, dur: 0.22, type: "sine", gain: 0.14, delay: i * 0.07 }),
    );
  },
  /** Interacción de interfaz. */
  click() {
    tone({ freq: 660, dur: 0.05, type: "square", gain: 0.05 });
  },
  hover() {
    tone({ freq: 880, dur: 0.03, type: "sine", gain: 0.03 });
  },
  chat() {
    tone({ freq: 740, dur: 0.09, type: "sine", gain: 0.08 });
    tone({ freq: 980, dur: 0.09, type: "sine", gain: 0.06, delay: 0.07 });
  },
};
