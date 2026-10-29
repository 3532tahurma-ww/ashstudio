import { eventsAt, totalSteps } from './sequence.js';

export function encodeWav(buf) {
  const nch = Math.min(2, buf.numberOfChannels), n = buf.length, sr = buf.sampleRate;
  const ab = new ArrayBuffer(44 + n * nch * 2);
  const v = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * nch * 2, true); ws(8, 'WAVE');
  ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nch, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * nch * 2, true); v.setUint16(32, nch * 2, true); v.setUint16(34, 16, true);
  ws(36, 'data'); v.setUint32(40, n * nch * 2, true);
  const pcm = new Int16Array(ab, 44);
  const chs = Array.from({ length: nch }, (_, i) => buf.getChannelData(i));
  for (let i = 0, o = 0; i < n; i++) {
    for (let c = 0; c < nch; c++, o++) {
      const s = Math.max(-1, Math.min(1, chs[c][i]));
      pcm[o] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }
  return ab;
}

export function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

export function abToB64(ab) {
  const u = new Uint8Array(ab);
  let s = '';
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}

export function b64ToAb(b64) {
  const s = atob(b64);
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u.buffer;
}

// ---------- MIDI ----------
export const GM_DRUM = { kick: 36, snare: 38, clap: 39, hat: 42, ohat: 46, tom: 45, perc: 56, rim: 37, shaker: 70, cowbell: 56, conga: 63, crash: 49, ride: 51, snap: 39, block: 76 };

function vlq(n) {
  const out = [n & 0x7f];
  while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80);
  return out;
}

function chunk(events, name) {
  const data = [];
  const push = (arr) => { for (const b of arr) data.push(b); };
  if (name) {
    const nb = new TextEncoder().encode(name);
    push([0, 0xff, 0x03, ...vlq(nb.length)]);
    push(nb);
  }
  let last = 0;
  for (const e of events) { push(vlq(e.t - last)); push(e.d); last = e.t; }
  push([0, 0xff, 0x2f, 0]);
  const len = data.length;
  return [0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 255, (len >>> 16) & 255, (len >>> 8) & 255, len & 255, ...data];
}

export function exportMidi(P, mode) {
  const PPQ = 96, TPS = PPQ / 4;
  const total = totalSteps(P, mode);
  const per = new Map();
  for (let s = 0; s < total; s++) {
    for (const e of eventsAt(P, mode, s)) {
      let list = per.get(e.ch.id);
      if (!list) per.set(e.ch.id, (list = []));
      const note = e.ch.type === 'drum' ? (GM_DRUM[e.ch.drum] || 36) + (e.midi - 60) : e.midi;
      list.push({ tick: s * TPS, len: e.len * TPS, note: Math.max(0, Math.min(127, note)), vel: Math.max(1, Math.min(127, Math.round(e.vel * 110))) });
    }
  }
  const mpqn = Math.round(60000000 / P.bpm);
  const tracks = [chunk([
    { t: 0, d: [0xff, 0x51, 0x03, (mpqn >> 16) & 255, (mpqn >> 8) & 255, mpqn & 255] },
    { t: 0, d: [0xff, 0x58, 0x04, 4, 2, 24, 8] },
  ], P.name || 'Ash Studio')];
  let chanNo = 0;
  const nextChan = () => { if (chanNo === 9) chanNo++; return chanNo++ % 16; };
  for (const ch of P.channels) {
    const list = per.get(ch.id);
    if (!list) continue;
    const chan = ch.type === 'drum' ? 9 : nextChan();
    const msgs = [];
    for (const e of list) {
      msgs.push({ t: e.tick, d: [0x90 | chan, e.note, e.vel] });
      msgs.push({ t: e.tick + e.len, d: [0x80 | chan, e.note, 0] });
    }
    msgs.sort((a, b) => a.t - b.t || ((a.d[0] & 0xf0) === 0x80 ? -1 : 1));
    tracks.push(chunk(msgs, ch.name));
  }
  const n = tracks.length;
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, (n >> 8) & 255, n & 255, (PPQ >> 8) & 255, PPQ & 255];
  return new Uint8Array([...head, ...tracks.flat()]);
}

export function parseMidi(ab) {
  const d = new DataView(ab);
  let p = 0;
  const tag = () => String.fromCharCode(d.getUint8(p), d.getUint8(p + 1), d.getUint8(p + 2), d.getUint8(p + 3));
  if (tag() !== 'MThd') throw new Error('Geçerli bir MIDI dosyası değil');
  const hl = d.getUint32(p + 4), ntr = d.getUint16(p + 10), div = d.getUint16(p + 12);
  p += 8 + hl;
  const ppq = div & 0x8000 ? 96 : div;
  const notes = [];
  let bpm = null;
  const vlqRead = () => { let v = 0, b; do { b = d.getUint8(p++); v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };

  for (let t = 0; t < ntr && p + 8 <= d.byteLength; t++) {
    const id = tag(), len = d.getUint32(p + 4);
    p += 8;
    const end = Math.min(p + len, d.byteLength);
    if (id !== 'MTrk') { p = end; continue; }
    let tick = 0, status = 0;
    const open = new Map();
    while (p < end) {
      tick += vlqRead();
      const b = d.getUint8(p);
      if (b & 0x80) { status = b; p++; }
      if (status === 0xff) {
        const type = d.getUint8(p++), l = vlqRead();
        if (type === 0x51 && bpm === null) bpm = 60000000 / ((d.getUint8(p) << 16) | (d.getUint8(p + 1) << 8) | d.getUint8(p + 2));
        p += l; status = 0; continue;
      }
      if (status === 0xf0 || status === 0xf7) { p += vlqRead(); status = 0; continue; }
      const hi = status & 0xf0, ch = status & 0x0f;
      const a = d.getUint8(p++);
      const v = hi !== 0xc0 && hi !== 0xd0 ? d.getUint8(p++) : 0;
      const key = ch * 128 + a;
      const close = () => {
        const o = open.get(key);
        if (o) { notes.push({ tick: o.tick, dur: tick - o.tick, note: a, vel: o.vel, ch }); open.delete(key); }
      };
      if (hi === 0x90 && v > 0) { close(); open.set(key, { tick, vel: v }); }
      else if (hi === 0x80 || hi === 0x90) close();
    }
    p = end;
  }
  notes.sort((x, y) => x.tick - y.tick);
  return { ppq, notes, bpm };
}
