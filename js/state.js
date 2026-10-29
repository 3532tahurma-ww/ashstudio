import { encodeWav, b64ToAb } from './fileio.js';
import { currentPattern } from './sequence.js';

export const DRUMS = { kick: 'Kick', snare: 'Snare', clap: 'Clap', hat: 'Hi-Hat', ohat: 'Open Hat', tom: 'Tom', perc: 'Perc', rim: 'Rim', shaker: 'Shaker',
  cowbell: 'Cowbell', conga: 'Conga', crash: 'Crash', ride: 'Ride', snap: 'Snap', block: 'Wood Block' };
export const COLORS = ['#a78bfa', '#f0abfc', '#93c5fd', '#86efac', '#fcd34d', '#fda4af', '#c4b5fd', '#67e8f9', '#fdba74'];
export const SYNTH_PRESETS = {
  Lead: { wave: 'sawtooth', attack: 0.005, decay: 0.25, sustain: 0.5, release: 0.15, cutoff: 2200, res: 5, detune: 9, envAmt: 2500, octave: 0 },
  Bass: { wave: 'square', attack: 0.003, decay: 0.18, sustain: 0.4, release: 0.08, cutoff: 600, res: 8, detune: 3, envAmt: 1400, octave: 0 },
  Pad: { wave: 'sawtooth', attack: 0.5, decay: 0.8, sustain: 0.7, release: 1.0, cutoff: 1400, res: 1, detune: 16, envAmt: 600, octave: 0 },
  Pluck: { wave: 'triangle', attack: 0.002, decay: 0.3, sustain: 0, release: 0.25, cutoff: 2500, res: 4, detune: 6, envAmt: 3500, octave: 0 },
  Keys: { wave: 'sine', attack: 0.005, decay: 0.6, sustain: 0.3, release: 0.4, cutoff: 5000, res: 0.5, detune: 4, envAmt: 1000, octave: 0 },
  Flute: { wave: 'triangle', attack: 0.06, decay: 0.3, sustain: 0.8, release: 0.25, cutoff: 2600, res: 0.5, detune: 4, envAmt: 400, octave: 0 },
  Bell: { wave: 'bell', attack: 0.002, decay: 1.2, sustain: 0, release: 1.2, cutoff: 9000, res: 0.5, detune: 0, envAmt: 0, octave: 0 },
  Strings: { wave: 'supersaw', attack: 0.35, decay: 0.8, sustain: 0.75, release: 0.9, cutoff: 2400, res: 0.7, detune: 14, envAmt: 400, octave: 0 },
  Organ: { wave: 'organ', attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.08, cutoff: 6000, res: 0.5, detune: 0, envAmt: 0, octave: 0 },
  Brass: { wave: 'sawtooth', attack: 0.04, decay: 0.3, sustain: 0.7, release: 0.2, cutoff: 900, res: 1.5, detune: 7, envAmt: 2200, octave: 0 },
  Marimba: { wave: 'marimba', attack: 0.001, decay: 0.45, sustain: 0, release: 0.35, cutoff: 8000, res: 0.5, detune: 0, envAmt: 0, octave: 0 },
  EPiano: { wave: 'epiano', attack: 0.003, decay: 1.0, sustain: 0.25, release: 0.5, cutoff: 4500, res: 0.5, detune: 3, envAmt: 1500, octave: 0 },
  Acid: { wave: 'sawtooth', attack: 0.002, decay: 0.18, sustain: 0.2, release: 0.06, cutoff: 380, res: 14, detune: 0, envAmt: 3200, octave: 0 },
  Sub: { wave: 'sine', attack: 0.004, decay: 0.3, sustain: 0.8, release: 0.1, cutoff: 800, res: 0.5, detune: 0, envAmt: 0, octave: 0 },
};
export const PATTERN_LENGTHS = [16, 32, 64, 128];

export const uid = () => Math.random().toString(36).slice(2, 10);

export const state = { project: null, samples: new Map(), mode: 'pattern', selected: null };

const bus = new EventTarget();
export const onChange = (fn) => bus.addEventListener('change', (e) => fn(e.detail));

let colorIdx = 0;
export function makeChannel(type, opt = {}) {
  const ch = {
    id: uid(), type, name: opt.name || 'Kanal', color: opt.color || COLORS[colorIdx++ % COLORS.length],
    vol: opt.vol ?? 0.8, pan: 0, mute: false, solo: false, rev: 0.08, dly: 0, params: {},
  };
  if (type === 'drum') { ch.drum = opt.drum || 'kick'; ch.name = opt.name || DRUMS[ch.drum]; ch.params = { tune: 0, decay: 1 }; }
  if (type === 'synth') { const preset = opt.preset || 'Lead'; ch.name = opt.name || preset; ch.params = { preset, ...SYNTH_PRESETS[preset] }; }
  if (type === 'sample') { ch.sampleId = opt.sampleId || null; ch.name = opt.name || 'Sample'; ch.params = { pitch: 0, gain: 1 }; }
  return ch;
}

export function makePattern(name, length = 16) {
  return { id: uid(), name, length, color: COLORS[(colorIdx++) % COLORS.length], steps: {}, notes: {} };
}

export function defaultProject(demo = true) {
  colorIdx = 0;
  const drums = ['kick', 'snare', 'clap', 'hat', 'ohat'].map((d) => makeChannel('drum', { drum: d }));
  const bass = makeChannel('synth', { preset: 'Bass' });
  const pad = makeChannel('synth', { preset: 'Pad', vol: 0.6 });
  const lead = makeChannel('synth', { preset: 'Pluck' });
  const pat = makePattern('Pattern 1');
  const P = {
    version: 1, name: 'Yeni Proje', bpm: demo ? 92 : 120, swing: demo ? 0.2 : 0, master: 0.9,
    channels: [...drums, bass, pad, lead], patterns: [pat], current: pat.id,
    playlist: { lanes: 8, clips: [{ id: uid(), lane: 0, bar: 0, pattern: pat.id }] },
  };
  if (demo) {
    const on = (ch, list) => { pat.steps[ch.id] = Array.from({ length: 16 }, (_, i) => (list.includes(i) ? 1 : 0)); };
    on(drums[0], [0, 7, 10]);
    on(drums[2], [4, 12]);
    on(drums[3], [0, 2, 4, 6, 8, 10, 12, 14]);
    on(drums[4], [14]);
    pat.notes[bass.id] = [{ s: 0, l: 3, n: 45, v: 0.9 }, { s: 7, l: 2, n: 45, v: 0.8 }, { s: 10, l: 2, n: 48, v: 0.9 }, { s: 12, l: 4, n: 43, v: 0.9 }];
    pat.notes[pad.id] = [57, 60, 64].map((n) => ({ s: 0, l: 16, n, v: 0.7 }));
    pat.notes[lead.id] = [{ s: 2, l: 1, n: 72, v: 0.8 }, { s: 3, l: 1, n: 76, v: 0.7 }, { s: 6, l: 2, n: 79, v: 0.8 }, { s: 11, l: 1, n: 76, v: 0.7 }, { s: 13, l: 2, n: 74, v: 0.8 }];
  }
  return P;
}

export const curPattern = () => currentPattern(state.project);
export const channel = (id) => state.project.channels.find((c) => c.id === id);

export function stepsOf(p, chId) {
  let a = p.steps[chId];
  if (!a) a = p.steps[chId] = [];
  for (let i = a.length; i < p.length; i++) a[i] = 0;
  return a;
}
export const notesOf = (p, chId) => p.notes[chId] || (p.notes[chId] = []);

export function removeChannel(id) {
  const P = state.project;
  P.channels = P.channels.filter((c) => c.id !== id);
  for (const p of P.patterns) { delete p.steps[id]; delete p.notes[id]; }
  if (state.selected === id) state.selected = P.channels[0]?.id || null;
}

// ---------- change notification, autosave, undo ----------
let saveTimer;
export function changed(scope = 'all') {
  bus.dispatchEvent(new CustomEvent('change', { detail: scope }));
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { snapshot(); autosave(); }, 500);
}

const undoStack = [], redoStack = [];
let lastSnap = null;
function snapshot() {
  const s = JSON.stringify(state.project);
  if (s === lastSnap) return;
  if (lastSnap) {
    undoStack.push(lastSnap);
    if (undoStack.length > 100) undoStack.shift();
    redoStack.length = 0;
  }
  lastSnap = s;
}
export function resetHistory() {
  undoStack.length = redoStack.length = 0;
  lastSnap = JSON.stringify(state.project);
}
export function undo() {
  clearTimeout(saveTimer);
  snapshot();
  if (!undoStack.length) return false;
  redoStack.push(lastSnap);
  lastSnap = undoStack.pop();
  state.project = JSON.parse(lastSnap);
  changed('all');
  return true;
}
export function redo() {
  clearTimeout(saveTimer);
  snapshot();
  if (!redoStack.length) return false;
  undoStack.push(lastSnap);
  lastSnap = redoStack.pop();
  state.project = JSON.parse(lastSnap);
  changed('all');
  return true;
}

// ---------- (de)serialization ----------
export function serialize() {
  const used = new Set(state.project.channels.map((c) => c.sampleId).filter(Boolean));
  const samples = {};
  for (const id of used) {
    const s = state.samples.get(id);
    if (!s) continue;
    if (!s.wav) s.wav = encodeWav(s.buffer);
    samples[id] = { name: s.name, wav: s.wav };
  }
  return { format: 'ash-studio', version: 1, project: state.project, samples };
}

function migrate(P) {
  P.swing ??= 0;
  P.master ??= 0.9;
  P.playlist ??= { lanes: 8, clips: [] };
  P.playlist.lanes ??= 8;
  if (!P.patterns?.length) { const p = makePattern('Pattern 1'); P.patterns = [p]; P.current = p.id; }
  if (!P.patterns.some((p) => p.id === P.current)) P.current = P.patterns[0].id;
  return P;
}

export async function deserialize(data, decode) {
  if (!data || data.format !== 'ash-studio' || !data.project) throw new Error('Geçersiz proje dosyası');
  const samples = new Map();
  for (const [id, s] of Object.entries(data.samples || {})) {
    const wav = typeof s.wav === 'string' ? b64ToAb(s.wav) : s.wav;
    try { samples.set(id, { name: s.name, buffer: await decode(wav.slice(0)), wav }); } catch (e) { console.warn('Sample yüklenemedi', id, e); }
  }
  state.samples = samples;
  state.project = migrate(data.project);
  state.selected = state.project.channels[0]?.id || null;
  resetHistory();
  changed('all');
}

// ---------- IndexedDB ----------
function db() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('ash-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idb(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction('kv', mode);
    const req = fn(tx.objectStore('kv'));
    tx.oncomplete = () => res(req.result);
    tx.onerror = () => rej(tx.error);
  });
}
export async function autosave() {
  try { await idb('readwrite', (s) => s.put(serialize(), 'project')); } catch (e) { console.warn('Otomatik kayıt başarısız', e); }
}
export const loadAutosave = () => idb('readonly', (s) => s.get('project'));
