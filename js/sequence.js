// Pure sequencing logic shared by live playback, offline render and MIDI export.
export const BAR = 16;

export const patternById = (P, id) => P.patterns.find((p) => p.id === id);
export const currentPattern = (P) => patternById(P, P.current) || P.patterns[0];

export function songSteps(P) {
  let end = 0;
  for (const c of P.playlist.clips) {
    const p = patternById(P, c.pattern);
    if (p) end = Math.max(end, c.bar * BAR + p.length);
  }
  return end;
}

export function totalSteps(P, mode) {
  if (mode === 'song') {
    const t = songSteps(P);
    if (t) return t;
  }
  return currentPattern(P).length;
}

export function patternEvents(P, pat, s, out = []) {
  for (const ch of P.channels) {
    const st = pat.steps[ch.id];
    if (st && st[s]) out.push({ ch, midi: 60, len: 1, vel: st[s], oneShot: true });
    const ns = pat.notes[ch.id];
    if (ns) for (const n of ns) if (n.s === s) out.push({ ch, midi: n.n, len: n.l, vel: n.v ?? 0.9, oneShot: false });
  }
  return out;
}

// Events for global step g. Song mode falls back to the current pattern when the playlist is empty.
export function eventsAt(P, mode, g) {
  if (mode === 'song') {
    const total = songSteps(P);
    if (total) {
      g %= total;
      const out = [];
      for (const c of P.playlist.clips) {
        const p = patternById(P, c.pattern);
        if (!p) continue;
        const s = g - c.bar * BAR;
        if (s >= 0 && s < p.length) patternEvents(P, p, s, out);
      }
      return out;
    }
  }
  const p = currentPattern(P);
  return patternEvents(P, p, g % p.length);
}

// Position of the current pattern inside global step g (-1 if not playing there).
export function stepInCurrent(P, mode, g) {
  const cur = currentPattern(P);
  if (mode !== 'song' || !songSteps(P)) return g % cur.length;
  g %= songSteps(P);
  for (const c of P.playlist.clips) {
    if (c.pattern !== cur.id) continue;
    const s = g - c.bar * BAR;
    if (s >= 0 && s < cur.length) return s;
  }
  return -1;
}
