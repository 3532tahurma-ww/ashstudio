import { state } from './state.js';
import { eventsAt, totalSteps } from './sequence.js';

let ctx = null, live = null;

export function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    live = createGraph(ctx);
    syncMix(live);
  }
  return ctx;
}
export const liveGraph = () => live;
export async function resume() {
  const c = getCtx();
  if (c.state !== 'running') await c.resume();
  return c;
}
export const decode = (ab) => getCtx().decodeAudioData(ab);

// ---------- mix graph ----------
function impulse(c, seconds, decay) {
  const len = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

export function createGraph(c, offline = false) {
  const g = { ctx: c, offline, strips: new Map() };
  g.master = c.createGain();
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -8; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  g.analyser = c.createAnalyser();
  g.analyser.fftSize = 512;
  g.master.connect(comp);
  comp.connect(c.destination);
  comp.connect(g.analyser);

  g.reverbIn = c.createGain();
  const conv = c.createConvolver();
  conv.buffer = impulse(c, 2.6, 3);
  const ret = c.createGain();
  ret.gain.value = 0.7;
  g.reverbIn.connect(conv).connect(ret).connect(g.master);

  g.delayIn = c.createGain();
  g.delay = c.createDelay(2);
  const fb = c.createGain();
  fb.gain.value = 0.38;
  const dlp = c.createBiquadFilter();
  dlp.type = 'lowpass';
  dlp.frequency.value = 3500;
  g.delayIn.connect(g.delay);
  g.delay.connect(dlp).connect(fb).connect(g.delay);
  dlp.connect(g.master);
  return g;
}

function ensureStrip(g, ch) {
  let s = g.strips.get(ch.id);
  if (s) return s;
  const c = g.ctx;
  s = {
    input: c.createGain(), vol: c.createGain(), pan: c.createStereoPanner(), mute: c.createGain(),
    rev: c.createGain(), dly: c.createGain(), analyser: c.createAnalyser(),
  };
  s.analyser.fftSize = 512;
  s.rev.gain.value = 0;
  s.dly.gain.value = 0;
  s.input.connect(s.vol).connect(s.pan).connect(s.mute);
  s.mute.connect(g.master);
  s.mute.connect(s.analyser);
  s.mute.connect(s.rev).connect(g.reverbIn);
  s.mute.connect(s.dly).connect(g.delayIn);
  g.strips.set(ch.id, s);
  return s;
}

export function syncMix(g = live, P = state.project) {
  if (!g || !P) return;
  const set = g.offline ? (prm, v) => { prm.value = v; } : (prm, v) => prm.setTargetAtTime(v, g.ctx.currentTime, 0.012);
  const anySolo = P.channels.some((c) => c.solo);
  const ids = new Set();
  for (const ch of P.channels) {
    ids.add(ch.id);
    const s = ensureStrip(g, ch);
    set(s.vol.gain, ch.vol * ch.vol);
    set(s.pan.pan, ch.pan);
    set(s.mute.gain, ch.mute || (anySolo && !ch.solo) ? 0 : 1);
    set(s.rev.gain, ch.rev);
    set(s.dly.gain, ch.dly * 0.8);
  }
  for (const [id, s] of g.strips) {
    if (ids.has(id)) continue;
    s.input.disconnect();
    s.mute.disconnect();
    g.strips.delete(id);
  }
  set(g.master.gain, P.master * P.master);
  set(g.delay.delayTime, Math.min(1.9, (60 / P.bpm) * 0.75));
}

function stripInput(g, ch) {
  if (!g.strips.has(ch.id)) syncMix(g);
  return ensureStrip(g, ch).input;
}

// ---------- instruments ----------
const noiseCache = new WeakMap();
function noiseBuf(c) {
  let b = noiseCache.get(c);
  if (!b) {
    b = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(c, b);
  }
  return b;
}
function noise(c, t, dur) {
  const s = c.createBufferSource();
  s.buffer = noiseBuf(c);
  s.loop = true;
  s.start(t, Math.random() * 0.8);
  s.stop(t + dur + 0.02);
  return s;
}
function env(c, t, peak, dur, attack = 0.001) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  return g;
}
function filter(c, type, freq, q = 0.7) {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = Math.min(freq, c.sampleRate / 2 - 100);
  f.Q.value = q;
  return f;
}
function osc(c, type, freq, t, stop) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.start(t);
  o.stop(stop);
  return o;
}

function drum(c, dest, ch, t, midi, vel) {
  const p = ch.params, k = Math.pow(2, ((p.tune || 0) + (midi - 60)) / 12), d = p.decay || 1;
  switch (ch.drum) {
    case 'kick': {
      const o = osc(c, 'sine', 170 * k, t, t + 0.5 * d + 0.05);
      o.frequency.exponentialRampToValueAtTime(48 * k, t + 0.09 * d);
      o.connect(env(c, t, vel, 0.5 * d)).connect(dest);
      noise(c, t, 0.02).connect(filter(c, 'highpass', 2000)).connect(env(c, t, vel * 0.25, 0.02)).connect(dest);
      break;
    }
    case 'snare': {
      osc(c, 'triangle', 185 * k, t, t + 0.2 * d).connect(env(c, t, vel * 0.5, 0.12 * d)).connect(dest);
      noise(c, t, 0.25 * d).connect(filter(c, 'highpass', 1500)).connect(env(c, t, vel * 0.7, 0.22 * d)).connect(dest);
      break;
    }
    case 'clap': {
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      for (const o of [0, 0.012, 0.024]) {
        g.gain.setValueAtTime(vel * 0.9, t + o);
        g.gain.exponentialRampToValueAtTime(vel * 0.05, t + o + 0.01);
      }
      g.gain.setValueAtTime(vel * 0.8, t + 0.036);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.036 + 0.2 * d);
      noise(c, t, 0.3 * d).connect(filter(c, 'bandpass', 1100 * k, 1.2)).connect(g).connect(dest);
      break;
    }
    case 'hat':
    case 'ohat': {
      const len = (ch.drum === 'hat' ? 0.06 : 0.4) * d;
      noise(c, t, len).connect(filter(c, 'highpass', 7000 * k)).connect(env(c, t, vel * (ch.drum === 'hat' ? 0.35 : 0.3), len)).connect(dest);
      break;
    }
    case 'tom': {
      const o = osc(c, 'sine', 140 * k, t, t + 0.45 * d);
      o.frequency.exponentialRampToValueAtTime(70 * k, t + 0.3 * d);
      o.connect(env(c, t, vel * 0.8, 0.4 * d)).connect(dest);
      break;
    }
    case 'perc': {
      const bp = filter(c, 'bandpass', 800 * k, 2);
      const g = env(c, t, vel * 0.3, 0.25 * d);
      osc(c, 'square', 540 * k, t, t + 0.3 * d).connect(bp);
      osc(c, 'square', 800 * k, t, t + 0.3 * d).connect(bp);
      bp.connect(g).connect(dest);
      break;
    }
    case 'rim': {
      noise(c, t, 0.05).connect(filter(c, 'bandpass', 2600 * k, 4)).connect(env(c, t, vel * 0.6, 0.05 * d)).connect(dest);
      osc(c, 'triangle', 420 * k, t, t + 0.06).connect(env(c, t, vel * 0.35, 0.04 * d)).connect(dest);
      break;
    }
    case 'shaker': {
      const len = 0.09 * d;
      noise(c, t, len).connect(filter(c, 'bandpass', 6000 * k, 0.8)).connect(env(c, t, vel * 0.28, len, 0.02)).connect(dest);
      break;
    }
    case 'cowbell': {
      const bp = filter(c, 'bandpass', 700 * k, 1.5);
      osc(c, 'square', 562 * k, t, t + 0.35 * d).connect(bp);
      osc(c, 'square', 845 * k, t, t + 0.35 * d).connect(bp);
      bp.connect(env(c, t, vel * 0.35, 0.3 * d)).connect(dest);
      break;
    }
    case 'conga': {
      const o = osc(c, 'sine', 330 * k, t, t + 0.3 * d);
      o.frequency.exponentialRampToValueAtTime(260 * k, t + 0.08);
      o.connect(env(c, t, vel * 0.7, 0.25 * d)).connect(dest);
      noise(c, t, 0.02).connect(filter(c, 'bandpass', 3000, 1)).connect(env(c, t, vel * 0.2, 0.015)).connect(dest);
      break;
    }
    case 'crash':
    case 'ride': {
      const crash = ch.drum === 'crash', len = (crash ? 1.6 : 0.7) * d;
      noise(c, t, len).connect(filter(c, 'highpass', (crash ? 4500 : 7500) * k)).connect(env(c, t, vel * (crash ? 0.32 : 0.14), len)).connect(dest);
      if (!crash) osc(c, 'sine', 3200 * k, t, t + len).connect(env(c, t, vel * 0.06, len * 0.8)).connect(dest);
      break;
    }
    case 'snap': {
      noise(c, t, 0.12 * d).connect(filter(c, 'bandpass', 2400 * k, 2.5)).connect(env(c, t, vel * 0.7, 0.09 * d, 0.003)).connect(dest);
      break;
    }
    case 'block': {
      osc(c, 'sine', 1050 * k, t, t + 0.1).connect(env(c, t, vel * 0.5, 0.07 * d)).connect(dest);
      osc(c, 'triangle', 2600 * k, t, t + 0.05).connect(env(c, t, vel * 0.12, 0.03 * d)).connect(dest);
      break;
    }
  }
}

// [wave, frequency ratio, detune cents, level] for additive waves
const VOICES = {
  bell: [['sine', 1, 0, 0.75], ['sine', 2.76, 0, 0.18], ['sine', 5.4, 0, 0.07]],
  marimba: [['sine', 1, 0, 0.8], ['sine', 3.93, 0, 0.15], ['sine', 9.2, 0, 0.05]],
  organ: [['sine', 0.5, 0, 0.25], ['sine', 1, 0, 0.4], ['sine', 2, 0, 0.18], ['sine', 3, 0, 0.1], ['sine', 4, 0, 0.07]],
  epiano: [['sine', 1, 0, 0.75], ['sine', 2, 0, 0.18], ['triangle', 7, 0, 0.04]],
};

function synth(c, dest, ch, t, midi, dur, vel) {
  const p = ch.params;
  const f = 440 * Math.pow(2, (midi + 12 * (p.octave || 0) - 69) / 12);
  const a = Math.max(0.002, p.attack), d = Math.max(0.01, p.decay), s = Math.max(0, Math.min(1, p.sustain)), r = Math.max(0.01, p.release);
  const end = Math.max(t + dur, t + a + 0.005);
  const stopAt = end + r + 0.1;
  const peak = 0.22 * vel;

  const amp = c.createGain();
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(peak, t + a);
  amp.gain.setTargetAtTime(peak * s, t + a, d / 4);
  amp.gain.setTargetAtTime(0, end, r / 5);

  const nyq = c.sampleRate / 2 - 100;
  const lo = Math.min(p.cutoff, nyq), hi = Math.min(p.cutoff + p.envAmt, nyq);
  const flt = c.createBiquadFilter();
  flt.type = 'lowpass';
  flt.Q.value = p.res;
  flt.frequency.setValueAtTime(lo, t);
  flt.frequency.linearRampToValueAtTime(hi, t + a);
  flt.frequency.setTargetAtTime(lo, t + a, d / 3);

  const voices = VOICES[p.wave]
    || (p.wave === 'supersaw' ? [-1, -0.35, 0.35, 1].map((x) => ['sawtooth', 1, x * p.detune, 0.27])
      : p.detune > 0 ? [[p.wave, 1, -p.detune, 0.5], [p.wave, 1, p.detune, 0.5]] : [[p.wave, 1, 0, 1]]);
  for (const [wave, ratio, dt, lvl] of voices) {
    const o = osc(c, wave, Math.min(f * ratio, nyq), t, stopAt);
    o.detune.value = dt;
    const vg = c.createGain();
    vg.gain.value = lvl;
    o.connect(vg).connect(flt);
  }
  flt.connect(amp).connect(dest);
}

function sample(c, dest, ch, t, midi, dur, vel, oneShot) {
  const smp = state.samples.get(ch.sampleId);
  if (!smp) return;
  const p = ch.params;
  const src = c.createBufferSource();
  src.buffer = smp.buffer;
  src.playbackRate.value = Math.pow(2, (midi - 60 + (p.pitch || 0)) / 12);
  const g = c.createGain();
  g.gain.value = vel * (p.gain ?? 1);
  if (!oneShot) {
    g.gain.setValueAtTime(vel * (p.gain ?? 1), t + dur);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.03);
    src.stop(t + dur + 0.05);
  }
  src.connect(g).connect(dest);
  src.start(t);
}

export function trigger(c, dest, ch, t, midi, dur, vel = 0.9, oneShot = false) {
  if (ch.type === 'drum') drum(c, dest, ch, t, midi, vel);
  else if (ch.type === 'synth') synth(c, dest, ch, t, midi, dur, vel);
  else if (ch.type === 'sample') sample(c, dest, ch, t, midi, dur, vel, oneShot);
}

export async function preview(ch, midi = 60, dur = 0.3) {
  if (!ch) return;
  const c = await resume();
  const d = ch.type === 'sample' ? Math.min(1.5, state.samples.get(ch.sampleId)?.buffer.duration || 0) : dur;
  trigger(c, stripInput(live, ch), ch, c.currentTime + 0.01, midi, d, 0.9, false);
}

// ---------- scheduler ----------
const sch = { timer: null, step: 0, next: 0, queue: [], mode: 'pattern', last: -1 };
export const isPlaying = () => !!sch.timer;

function tick() {
  const P = state.project;
  const sd = 60 / P.bpm / 4;
  const horizon = ctx.currentTime + 0.12;
  while (sch.next < horizon) {
    const t = sch.next + (sch.step % 2 ? P.swing * sd * 0.5 : 0);
    for (const e of eventsAt(P, sch.mode, sch.step)) {
      trigger(ctx, stripInput(live, e.ch), e.ch, t, e.midi, e.len * sd, e.vel, e.oneShot);
    }
    sch.queue.push({ step: sch.step, t: sch.next });
    sch.step++;
    sch.next += sd;
  }
}

export async function play(mode) {
  await resume();
  stop();
  sch.mode = mode;
  sch.step = 0;
  sch.last = -1;
  sch.next = ctx.currentTime + 0.05;
  tick();
  sch.timer = setInterval(tick, 25);
}

export function stop() {
  if (sch.timer) clearInterval(sch.timer);
  sch.timer = null;
  sch.queue.length = 0;
  sch.last = -1;
}

export function playhead() {
  if (!sch.timer) return null;
  const now = ctx.currentTime;
  while (sch.queue.length && sch.queue[0].t <= now) sch.last = sch.queue.shift().step;
  return { step: sch.last, mode: sch.mode };
}

// ---------- offline render ----------
export async function render(P, mode) {
  const sd = 60 / P.bpm / 4, sr = 44100;
  const total = totalSteps(P, mode);
  const oc = new OfflineAudioContext(2, Math.ceil((total * sd + 3) * sr), sr);
  const g = createGraph(oc, true);
  syncMix(g, P);
  for (let s = 0; s < total; s++) {
    const t = s * sd + (s % 2 ? P.swing * sd * 0.5 : 0);
    for (const e of eventsAt(P, mode, s)) trigger(oc, g.strips.get(e.ch.id).input, e.ch, t, e.midi, e.len * sd, e.vel, e.oneShot);
  }
  return oc.startRendering();
}

const meterBuf = new Float32Array(512);
export function peak(an) {
  an.getFloatTimeDomainData(meterBuf);
  let m = 0;
  for (let i = 0; i < meterBuf.length; i++) { const v = Math.abs(meterBuf[i]); if (v > m) m = v; }
  return m;
}
