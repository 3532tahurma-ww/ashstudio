// Seeded song generator: a few settings (style, key, scale, chord progression, seed) become a full project.
// Same seed → same song. Also randomizes a single channel inside the current pattern.
import { makeChannel, makePattern, uid } from './state.js';

export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], harm: [0, 2, 3, 5, 7, 8, 11], penta: [0, 2, 4, 7, 9, 12, 14], minpenta: [0, 3, 5, 7, 10, 12, 15],
};
const SCALE_NAMES = { major: 'majör', minor: 'minör', dorian: 'doryen', lydian: 'lidyen', harm: 'armonik minör', penta: 'pentatonik', minpenta: 'minör pentatonik' };
const NOTE = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

// pad / lead / arp: synth presets · bass: BASS pattern · drums: KITS entry · density: melody density
export const STYLES = {
  farm: { label: 'Çiftlik', scales: ['major', 'lydian'], bpm: [96, 112], swing: 0.12, density: 0.5, pad: 'Keys', lead: 'Flute', arp: 'Pluck', bass: 'bounce', drums: 'farm' },
  village: { label: 'Kasaba', scales: ['major', 'penta'], bpm: [84, 98], swing: 0.18, density: 0.45, pad: 'Keys', lead: 'Bell', bass: 'roots', drums: 'village' },
  festival: { label: 'Festival', scales: ['major'], bpm: [112, 126], swing: 0, density: 0.6, pad: 'Keys', lead: 'Flute', arp: 'Pluck', bass: 'eighths', drums: 'festival' },
  rain: { label: 'Yağmur', scales: ['dorian', 'minor'], bpm: [66, 80], swing: 0.2, density: 0.35, pad: 'Pad', lead: 'Keys', arp: 'Bell', bass: 'drone', drums: '' },
  mine: { label: 'Mağara', scales: ['minor', 'harm'], bpm: [70, 84], swing: 0, density: 0.25, pad: 'Pad', lead: 'Bell', bass: 'drone', drums: 'mine' },
  winter: { label: 'Kış', scales: ['penta', 'lydian'], bpm: [58, 72], swing: 0, density: 0.3, pad: 'Pad', lead: 'Bell', arp: 'Bell', bass: 'drone', drums: '' },
  lofi: { label: 'Lo-fi', scales: ['minor', 'dorian', 'major'], bpm: [70, 86], swing: 0.25, density: 0.42, pad: 'Keys', lead: 'Pluck', bass: 'roots', drums: 'lofi' },
  jazzy: { label: 'Caz', scales: ['dorian', 'major'], bpm: [86, 104], swing: 0.3, density: 0.52, pad: 'Keys', lead: 'Pluck', bass: 'walk', drums: 'brush', seventh: true },
  pop: { label: 'Pop', scales: ['major', 'minor'], bpm: [96, 120], swing: 0, density: 0.58, pad: 'Pad', lead: 'Lead', bass: 'eighths', drums: 'pop' },
  // Carmen soundtrack moods (Music/fp); bassPreset overrides the default 'Bass' synth
  cMenu: { label: 'Carmen · Ana Menü', scales: ['major', 'lydian'], bpm: [84, 96], swing: 0.1, density: 0.4, pad: 'Strings', lead: 'EPiano', arp: 'Marimba', bass: 'roots', drums: 'cMenu' },
  cAction: { label: 'Carmen · Aksiyon', scales: ['minor', 'harm'], bpm: [128, 145], swing: 0, density: 0.55, pad: 'Strings', lead: 'Brass', arp: 'Pluck', bass: 'sixteenths', bassPreset: 'Acid', drums: 'cAction' },
  cBeach: { label: 'Carmen · Sahil', scales: ['major', 'penta'], bpm: [92, 108], swing: 0.2, density: 0.5, pad: 'Keys', lead: 'Marimba', arp: 'Pluck', bass: 'bounce', drums: 'cBeach' },
  cCollege: { label: 'Carmen · Okul', scales: ['major'], bpm: [104, 120], swing: 0.05, density: 0.58, pad: 'Pad', lead: 'Lead', arp: 'Pluck', bass: 'octave', drums: 'cCollege' },
  cForest: { label: 'Carmen · Orman', scales: ['dorian', 'lydian'], bpm: [72, 88], swing: 0.1, density: 0.38, pad: 'Strings', lead: 'Flute', arp: 'Marimba', bass: 'drone', drums: 'cForest' },
  cHospital: { label: 'Carmen · Hastane', scales: ['minor', 'dorian'], bpm: [60, 72], swing: 0, density: 0.28, pad: 'Strings', lead: 'EPiano', arp: 'Bell', bass: 'drone', bassPreset: 'Sub', drums: '' },
  cHouse: { label: 'Carmen · Ev', scales: ['major', 'dorian'], bpm: [76, 90], swing: 0.22, density: 0.45, pad: 'EPiano', lead: 'Keys', bass: 'roots', bassPreset: 'Sub', drums: 'cHouse', seventh: true },
  cMarket: { label: 'Carmen · Pazar', scales: ['major', 'penta'], bpm: [100, 116], swing: 0.15, density: 0.55, pad: 'Organ', lead: 'Marimba', arp: 'Pluck', bass: 'syncop', drums: 'cMarket' },
  cOffice: { label: 'Carmen · Ofis', scales: ['major', 'lydian'], bpm: [96, 110], swing: 0, density: 0.45, pad: 'EPiano', lead: 'Pluck', arp: 'Marimba', bass: 'eighths', drums: 'cOffice', seventh: true },
  cPark: { label: 'Carmen · Park', scales: ['major', 'penta'], bpm: [88, 104], swing: 0.12, density: 0.48, pad: 'Keys', lead: 'Flute', arp: 'Pluck', bass: 'bounce', drums: 'cPark' },
  cRomance: { label: 'Carmen · Romantik', scales: ['minor', 'dorian'], bpm: [64, 78], swing: 0.25, density: 0.35, pad: 'Strings', lead: 'EPiano', bass: 'roots', bassPreset: 'Sub', drums: 'cRomance', seventh: true },
};

const KITS = {
  lofi: { kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  farm: { kick: [0, 8], rim: [4, 12], shaker: [0, 2, 4, 6, 8, 10, 12, 14] },
  village: { kick: [0, 10], shaker: [4, 12], rim: [14] },
  festival: { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], shaker: [1, 3, 5, 7, 9, 11, 13, 15] },
  mine: { kick: [0], perc: [10], shaker: [6] },
  brush: { kick: [0, 10], shaker: [0, 4, 8, 12], rim: [12] },
  pop: { kick: [0, 8, 11], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  cMenu: { kick: [0, 8, 11], snap: [4, 12], ride: [0, 2, 4, 6, 8, 10, 12, 14] },
  cAction: { kick: [0, 6, 8, 10], snare: [4, 12], hat: [0, 1, 2, 4, 6, 8, 9, 10, 12, 14], tom: [14, 15], crash: [0] },
  cBeach: { kick: [0, 10], conga: [3, 6, 11, 14], shaker: [0, 2, 4, 6, 8, 10, 12, 14], rim: [12] },
  cCollege: { kick: [0, 8, 10], clap: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12], ohat: [14] },
  cForest: { block: [0, 6, 10], shaker: [4, 12], conga: [8] },
  cHouse: { kick: [0, 7, 10], snap: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  cMarket: { kick: [0, 8], conga: [2, 6, 10, 14], cowbell: [4, 12], shaker: [0, 2, 4, 6, 8, 10, 12, 14] },
  cOffice: { kick: [0, 8], rim: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], block: [15] },
  cPark: { kick: [0, 8], snap: [4, 12], shaker: [0, 2, 4, 6, 8, 10, 12, 14], block: [14] },
  cRomance: { kick: [0, 10], rim: [4, 12], ride: [0, 4, 8, 12] },
};
const KIT_VOL = {
  kick: 0.85, snare: 0.7, clap: 0.65, hat: 0.5, ohat: 0.5, rim: 0.6, shaker: 0.5, perc: 0.5, tom: 0.6,
  cowbell: 0.45, conga: 0.6, crash: 0.5, ride: 0.45, snap: 0.6, block: 0.5,
};
// [step, length, scale-degree offset from chord root]
const BASS = {
  roots: [[0, 6, 0], [8, 6, 0]],
  eighths: [0, 2, 4, 6, 8, 10, 12, 14].map((s) => [s, 2, 0]),
  walk: [[0, 4, 0], [4, 4, 2], [8, 4, 4], [12, 4, 5]],
  drone: [[0, 16, 0]],
  bounce: [[0, 3, 0], [6, 2, 4], [8, 3, 0], [14, 2, 4]],
  sixteenths: Array.from({ length: 16 }, (_, s) => [s, 1, s % 8 === 6 ? 7 : 0]),
  octave: [0, 2, 4, 6, 8, 10, 12, 14].map((s) => [s, 2, s % 4 ? 7 : 0]),
  syncop: [[0, 3, 0], [3, 3, 0], [6, 2, 4], [10, 3, 0], [13, 3, 4]],
};
const PROGS = [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 4, 0], [0, 5, 2, 6], [0, 3, 1, 4], [5, 3, 0, 4], [0, 1, 3, 4], [0, 6, 5, 4]];
const WORDS_A = ['Bahar', 'Sisli', 'Sessiz', 'Altın', 'Yeşil', 'Tatlı', 'Uzak', 'Sıcak', 'Ilık', 'Gece', 'Pembe', 'Eski', 'Küçük', 'Mavi', 'Sakin'];
const WORDS_B = ['Tarla', 'Vadi', 'Sabah', 'Hasat', 'Dere', 'Fener', 'Bahçe', 'Patika', 'Yağmur', 'Kulübe', 'Meydan', 'Orman', 'Liman', 'Çay', 'Rüzgâr'];

// Original compositions in a cozy farming-game mood (fixed seeds → always the same song).
export const EXAMPLES = [
  { id: 'spring', icon: '🌱', name: 'Bahar Sabahı', desc: 'Çiftlikte ilk gün; flüt, akustik arp ve hafif shaker.', style: 'farm', bpm: 104, root: 55, scale: 'major', prog: [0, 5, 3, 4], seed: 101 },
  { id: 'town', icon: '🏡', name: 'Kasaba Meydanı', desc: 'Pazar günü kasabada yürüyüş; çan melodisi.', style: 'village', bpm: 92, root: 60, scale: 'major', prog: [0, 3, 0, 4], seed: 202 },
  { id: 'rain', icon: '🌧️', name: 'Yağmurlu Gün', desc: 'Pencerede yağmur, içeride sıcak bir çay.', style: 'rain', bpm: 72, root: 57, scale: 'dorian', prog: [0, 3, 1, 4], seed: 303 },
  { id: 'mine', icon: '⛏️', name: 'Maden Derinlikleri', desc: 'Kristallerle dolu, yankılı ve gizemli bir mağara.', style: 'mine', bpm: 76, root: 52, scale: 'minor', prog: [0, 5, 3, 4], seed: 404 },
  { id: 'summer', icon: '🌻', name: 'Yaz Festivali', desc: 'Meydanda dans; neşeli ve hareketli.', style: 'festival', bpm: 118, root: 57, scale: 'major', prog: [0, 4, 5, 3], seed: 505 },
  { id: 'autumn', icon: '🍂', name: 'Sonbahar Hasadı', desc: 'Balkabakları ve kızıl yapraklar arasında.', style: 'farm', bpm: 98, root: 53, scale: 'major', prog: [0, 5, 1, 4], seed: 606 },
  { id: 'winter', icon: '❄️', name: 'Kış Gecesi', desc: 'Karla örtülü vadi, şöminede çıtırtılar.', style: 'winter', bpm: 64, root: 60, scale: 'penta', prog: [0, 3, 1, 4], seed: 707 },
  { id: 'beach', icon: '🌊', name: 'Sahil Akşamı', desc: 'İskelede gün batımı; lo-fi ritim.', style: 'lofi', bpm: 80, root: 55, scale: 'major', prog: [0, 4, 5, 3], seed: 808 },
  { id: 'saloon', icon: '☕', name: 'Kasaba Kafesi', desc: 'Akşam kafede caz tadında sohbet.', style: 'jazzy', bpm: 96, root: 53, scale: 'dorian', prog: [0, 3, 1, 4], seed: 909 },
];

export const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (r, a) => a[Math.floor(r() * a.length)];

export const describe = (o) => `${STYLES[o.style]?.label || o.style} · ${o.bpm} bpm · ${NOTE[o.root % 12]} ${SCALE_NAMES[o.scale] || o.scale}`;

function noteOf(key, deg, oct) {
  const sc = SCALES[key.scale] || SCALES.minor, i = ((deg % 7) + 7) % 7;
  let n = key.root + sc[i] + 12 * (Math.floor(deg / 7) + oct);
  while (n < 36) n += 12;
  while (n > 96) n -= 12;
  return n;
}

// Melody phrase: per bar a list of { s, deg, len }. Second half repeats the first with high probability.
function phrase(key, density, r, bars) {
  const out = [];
  let prev = 4;
  for (let b = 0; b < bars; b++) {
    const ch = key.prog[b % key.prog.length];
    if (b >= 4 && r() < 0.6) {
      const shift = ch - key.prog[(b - 4) % key.prog.length];
      out.push(out[b - 4].map((n) => ({ ...n, deg: n.deg + shift })));
      continue;
    }
    const bar = [];
    for (let s = 0; s < 16; s += 2) {
      const strong = s % 4 === 0;
      if (r() > density + (strong ? 0.2 : -0.1)) continue;
      prev = strong && r() < 0.7 ? pick(r, [ch, ch + 2, ch + 4]) + 7 : prev + pick(r, [-2, -1, -1, 1, 1, 2]);
      prev = Math.max(2, Math.min(13, prev));
      bar.push({ s, deg: prev, len: strong && r() < 0.4 ? 4 : 2 });
    }
    out.push(bar);
  }
  return out;
}

const push = (pat, ch, note) => (pat.notes[ch.id] ||= []).push(note);

export function generateProject(o) {
  const st = STYLES[o.style] || STYLES.lofi, r = rng(o.seed), key = { root: o.root, scale: o.scale, prog: o.prog };
  const kit = KITS[st.drums] || {};
  const drums = {};
  const channels = [];
  for (const d of Object.keys(kit)) {
    const ch = makeChannel('drum', { drum: d, vol: KIT_VOL[d] });
    ch.rev = 0.05;
    drums[d] = ch;
    channels.push(ch);
  }
  const bass = makeChannel('synth', { preset: st.bassPreset || 'Bass', name: 'Bas', vol: 0.75 });
  const pad = makeChannel('synth', { preset: st.pad, name: 'Akor', vol: 0.55 });
  const lead = makeChannel('synth', { preset: st.lead, name: 'Melodi', vol: 0.7 });
  bass.rev = 0; pad.rev = 0.3; lead.rev = 0.25; lead.dly = 0.18; lead.pan = 0.15;
  channels.push(bass, pad, lead);
  let arp = null;
  if (st.arp) {
    arp = makeChannel('synth', { preset: st.arp, name: 'Arp', vol: 0.5 });
    arp.rev = 0.2; arp.pan = -0.25;
    channels.push(arp);
  }

  const A = makePattern('Bölüm A', 64), B = makePattern('Bölüm B', 64);
  const mel = phrase(key, st.density, r, 8);
  const arpOrder = [0, 1, 2, 3, 2, 1, 0, 1];
  for (let b = 0; b < 8; b++) {
    const pat = b < 4 ? A : B, off = (b % 4) * 16, ch = key.prog[b % key.prog.length];
    for (const d of [ch, ch + 2, ch + 4].concat(st.seventh ? [ch + 6] : [])) push(pat, pad, { s: off, l: 16, n: noteOf(key, d, 0), v: 0.6 });
    for (const [s, l, d] of BASS[st.bass] || []) push(pat, bass, { s: off + s, l, n: noteOf(key, ch + d, -1), v: 0.85 });
    for (const n of mel[b]) push(pat, lead, { s: off + n.s, l: n.len, n: noteOf(key, n.deg, 0), v: 0.75 + r() * 0.15 });
    if (arp) {
      const tones = [ch, ch + 2, ch + 4, ch + 7];
      for (let s = 0; s < 16; s += 2) push(pat, arp, { s: off + s, l: 2, n: noteOf(key, tones[arpOrder[s / 2]], 0), v: 0.5 + r() * 0.15 });
    }
    for (const [d, steps] of Object.entries(kit)) {
      const arr = (pat.steps[drums[d].id] ||= new Array(64).fill(0));
      for (const s of steps) arr[off + s] = 1;
    }
  }
  const intro = { ...structuredClone(A), id: uid(), name: 'Giriş' };
  for (const d of Object.values(drums)) delete intro.steps[d.id];
  delete intro.notes[lead.id];
  const clips = [[intro, 0], [A, 4], [B, 8], [A, 12], [B, 16]].map(([p, bar]) => ({ id: uid(), lane: 0, bar, pattern: p.id }));

  return {
    version: 1, name: o.name, bpm: o.bpm, swing: st.swing, master: 0.9, key,
    channels, patterns: [intro, A, B], current: A.id, playlist: { lanes: 8, clips },
  };
}

export function randomOpts(style) {
  const seed = Math.floor(Math.random() * 1e9), r = rng(seed ^ 0x5bd1e995);
  const s = STYLES[style] ? style : pick(r, Object.keys(STYLES)), st = STYLES[s];
  const [lo, hi] = st.bpm;
  return {
    name: `${pick(r, WORDS_A)} ${pick(r, WORDS_B)}`, style: s, bpm: Math.round(lo + r() * (hi - lo)),
    root: 52 + Math.floor(r() * 9), scale: pick(r, st.scales), prog: pick(r, PROGS), seed,
  };
}

// ---------- single channel ----------
const DRUM_PROB = {
  kick: (s) => (s === 0 ? 1 : s === 8 ? 0.7 : s % 4 === 0 ? 0.25 : s % 2 === 0 ? 0.15 : 0.05),
  snare: (s) => (s === 4 || s === 12 ? 0.95 : s % 2 ? 0.04 : 0.08),
  hat: (s) => (s % 2 === 0 ? 0.85 : 0.25),
  ohat: (s) => (s === 14 ? 0.5 : s === 6 ? 0.2 : 0.03),
  other: (s) => (s % 2 === 0 ? 0.18 : 0.08),
};
DRUM_PROB.clap = DRUM_PROB.snap = DRUM_PROB.snare;
DRUM_PROB.shaker = DRUM_PROB.ride = DRUM_PROB.hat;
DRUM_PROB.crash = (s) => (s === 0 ? 0.6 : 0.01);
const BASS_PRESETS = ['Bass', 'Sub', 'Acid'], PAD_PRESETS = ['Pad', 'Strings', 'Organ'];

export function randomizeChannel(P, pat, ch) {
  const r = rng(Math.floor(Math.random() * 1e9));
  const key = P.key || { root: 57, scale: 'minor', prog: [0, 5, 2, 6] };
  const bars = pat.length / 16;

  if (ch.type !== 'synth') {
    const prob = ch.type === 'drum' ? DRUM_PROB[ch.drum] || DRUM_PROB.other : DRUM_PROB.other;
    const base = Array.from({ length: 16 }, (_, s) => (r() < prob(s) ? 1 : 0));
    pat.steps[ch.id] = Array.from({ length: pat.length }, (_, i) => (i >= 16 && r() < 0.12 ? (r() < prob(i % 16) ? 1 : 0) : base[i % 16]));
    return;
  }

  const notes = [];
  const preset = ch.params.preset;
  for (let b = 0; b < bars; b++) {
    const c = key.prog[b % key.prog.length], off = b * 16;
    if (BASS_PRESETS.includes(preset)) {
      const pattern = BASS[pick(r, ['roots', 'bounce', 'walk', 'eighths', 'octave', 'syncop'])];
      for (const [s, l, d] of pattern) notes.push({ s: off + s, l, n: noteOf(key, c + d, -1), v: 0.85 });
    } else if (PAD_PRESETS.includes(preset)) {
      for (const d of [c, c + 2, c + 4]) notes.push({ s: off, l: 16, n: noteOf(key, d, 0), v: 0.6 });
    }
  }
  if (!BASS_PRESETS.includes(preset) && !PAD_PRESETS.includes(preset)) {
    phrase(key, 0.35 + r() * 0.3, r, bars).forEach((bar, b) => {
      for (const n of bar) notes.push({ s: b * 16 + n.s, l: Math.min(n.len, pat.length - b * 16 - n.s), n: noteOf(key, n.deg, 0), v: 0.8 });
    });
  }
  pat.notes[ch.id] = notes;
  pat.steps[ch.id] = new Array(pat.length).fill(0);
}
