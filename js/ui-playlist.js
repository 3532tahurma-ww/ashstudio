import { state, changed, uid, channel } from './state.js';
import { songSteps, patternById, clipSteps, stepSec, BAR } from './sequence.js';
import { $, h, icon, slider, toast } from './dom.js';

const root = $('#playlist'), editEl = $('#plClip');
let erase = false, head = null, BW = 56, LW = 84, sel = null, drag = null, dragged = false;

const goTab = (tab) => document.dispatchEvent(new CustomEvent('ash:tab', { detail: tab }));
const clipById = (id) => state.project.playlist.clips.find((c) => c.id === id);
const audioWidth = (c) => (c.dur / (stepSec(state.project) * BAR)) * BW;

// Peak envelope per buffer (200 points per second), cached so redraws stay cheap.
const RES = 200, peakCache = new WeakMap();
function peaksOf(buf) {
  let p = peakCache.get(buf);
  if (p) return p;
  const per = Math.max(1, Math.round(buf.sampleRate / RES));
  p = new Float32Array(Math.ceil(buf.length / per));
  for (let k = 0; k < buf.numberOfChannels; k++) {
    const d = buf.getChannelData(k);
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > p[(i / per) | 0]) p[(i / per) | 0] = v; }
  }
  peakCache.set(buf, p);
  return p;
}

function drawClipWave(cv, c, buf) {
  const w = Math.min(8000, Math.round(audioWidth(c))), ht = 30;
  cv.width = w; cv.height = ht;
  const x = cv.getContext('2d'), p = peaksOf(buf);
  x.fillStyle = 'rgba(45, 35, 66, .55)';
  for (let i = 0; i < w; i++) {
    const v = p[Math.floor(((c.offset || 0) + (i / w) * c.dur) * RES)] || 0;
    const y = Math.max(1, v * ht);
    x.fillRect(i, (ht - y) / 2, 1, y);
  }
}

export function renderPlaylist() {
  const P = state.project;
  const small = matchMedia('(max-width: 720px)').matches;
  BW = small ? 40 : 56;
  LW = small ? 60 : 84;
  const bars = Math.max(32, Math.ceil(songSteps(P) / BAR) + 8);
  root.style.setProperty('--bw', BW + 'px');
  root.style.setProperty('--lw', LW + 'px');
  const inner = h('div', { class: 'pl-inner', style: { width: LW + bars * BW + 'px' } });
  inner.append(h('div', { class: 'pl-ruler' }, h('div', { class: 'pl-corner' }, 'Bar'),
    ...Array.from({ length: bars }, (_, i) => h('div', { class: 'pl-bar', dataset: { bar: i }, title: `Bar ${i + 1}'den çal` }, String(i + 1)))));
  if (sel && !clipById(sel)) sel = null;
  for (let l = 0; l < P.playlist.lanes; l++) {
    const track = h('div', { class: 'pl-track', dataset: { lane: l } });
    for (const c of P.playlist.clips) {
      if (c.lane !== l) continue;
      if (c.ch) {
        const ch = channel(c.ch), smp = ch && state.samples.get(ch.sampleId);
        if (!ch) continue;
        const cv = h('canvas', { class: 'pl-wave' });
        track.append(h('div', {
          class: 'pl-clip audio' + (c.id === sel ? ' cur' : ''), dataset: { id: c.id }, title: ch.name,
          style: { left: c.bar * BW + 'px', width: audioWidth(c) + 'px', '--c': ch.color },
        }, cv, h('span', {}, ch.name)));
        if (smp) drawClipWave(cv, c, smp.buffer);
        continue;
      }
      const p = patternById(P, c.pattern);
      if (!p) continue;
      track.append(h('div', {
        class: 'pl-clip' + (p.id === P.current ? ' cur' : ''), dataset: { id: c.id }, title: p.name,
        style: { left: c.bar * BW + 'px', width: Math.ceil(p.length / BAR) * BW + 'px', '--c': p.color },
      }, p.name));
    }
    inner.append(h('div', { class: 'pl-lane' }, h('div', { class: 'pl-label' }, `Track ${l + 1}`), track));
  }
  head = h('div', { class: 'pl-head' });
  inner.append(head);
  root.replaceChildren(inner);
  root.classList.toggle('erase', erase);
  renderClipEditor();
}

export function playlistPlayhead(g) {
  if (!head) return;
  if (g < 0) { head.style.display = 'none'; return; }
  head.style.display = 'block';
  const x = LW + (g / BAR) * BW;
  head.style.transform = `translateX(${x}px)`;
  // Keep the playhead in view while the song plays.
  if (x < root.scrollLeft + LW || x > root.scrollLeft + root.clientWidth - BW) root.scrollLeft = x - LW;
}

// ---------- audio clip editor ----------
const fmtSec = (v) => (v < 60 ? v.toFixed(2) + ' sn' : `${Math.floor(v / 60)}:${(v % 60).toFixed(1).padStart(4, '0')}`);
const fmtDb = (v) => (v <= 0.001 ? '-∞ dB' : (20 * Math.log10(v) > 0 ? '+' : '') + (20 * Math.log10(v)).toFixed(1) + ' dB');
const fmtBar = (b) => `${Math.floor(b) + 1}. bar${b % 1 ? ` · ${Math.round((b % 1) * 4) + 1}. vuruş` : ''}`;

function renderClipEditor() {
  const c = sel && clipById(sel);
  const ch = c && channel(c.ch);
  editEl.hidden = !ch;
  editEl.replaceChildren();
  if (!ch) return;
  const P = state.project, smp = state.samples.get(ch.sampleId);
  const full = smp ? smp.buffer.duration : c.dur;
  const el = () => root.querySelector(`.pl-clip[data-id="${c.id}"]`);
  // While dragging a slider only the clip box moves; the full redraw happens on release.
  const live = (fn) => (v) => {
    fn(v);
    const e = el();
    if (e) { e.style.left = c.bar * BW + 'px'; e.style.width = audioWidth(c) + 'px'; }
    changed('param');
  };
  const field = (label, value, opts, fn) => {
    const s = slider(label, value, opts, live(fn));
    s.addEventListener('change', () => changed('playlist'));
    return s;
  };
  const lane = h('select', { class: 'btn-select', onchange: (e) => { c.lane = +e.target.value; changed('playlist'); } },
    ...Array.from({ length: P.playlist.lanes }, (_, i) => h('option', { value: i, selected: i === c.lane }, `Track ${i + 1}`)));
  const end = c.offset + c.dur;
  editEl.append(
    h('div', { class: 'insp-head' },
      h('span', { class: 'tag' }, 'Ses klibi'),
      h('b', { class: 'pl-edit-name' }, ch.name),
      h('span', { class: 'muted' }, `${fmtSec(c.dur)} / ${fmtSec(full)}`),
      h('button', { class: 'btn sm', title: 'Klibin başından çal', onclick: () => document.dispatchEvent(new CustomEvent('ash:play-from', { detail: Math.round(c.bar * BAR) })) }, icon('play'), 'Çal'),
      h('button', { class: 'btn sm', title: 'Mixer\'da EQ ve kompresör', onclick: () => goTab('mixer') }, icon('mixer'), 'Mixer'),
      h('button', { class: 'btn sm', title: 'Klonla', onclick: duplicateClip }, icon('copy')),
      h('button', { class: 'btn sm danger', title: 'Sil', onclick: () => { removeClip(c.id); changed('playlist'); } }, icon('trash')),
      h('button', { class: 'btn sm', title: 'Kapat', onclick: () => { sel = null; renderPlaylist(); } }, icon('x'))),
    h('div', { class: 'params' },
      field('Başlangıç', c.bar, { min: 0, max: Math.max(64, Math.ceil(c.bar) + 16), step: 0.25, fmt: fmtBar }, (v) => { c.bar = v; }),
      h('label', { class: 'slider' }, h('span', {}, 'Şerit'), lane, h('span')),
      field('Seviye', c.gain, { min: 0, max: 2, step: 0.01, fmt: fmtDb }, (v) => { c.gain = v; }),
      field('Baştan kırp', c.offset, { min: 0, max: Math.max(0, full - 0.05), step: 0.01, fmt: fmtSec }, (v) => { c.offset = v; c.dur = Math.max(0.05, end - v); }),
      field('Uzunluk', c.dur, { min: 0.05, max: Math.max(0.05, full - c.offset), step: 0.01, fmt: fmtSec }, (v) => { c.dur = v; }),
      field('Fade in', c.fadeIn, { min: 0, max: Math.min(10, c.dur), step: 0.01, fmt: fmtSec }, (v) => { c.fadeIn = v; }),
      field('Fade out', c.fadeOut, { min: 0, max: Math.min(10, c.dur), step: 0.01, fmt: fmtSec }, (v) => { c.fadeOut = v; })),
    h('p', { class: 'hint' }, 'İpucu: Klibi fareyle sürükleyerek taşı (vuruşa yapışır). Ses tempoyla esnemez; şarkının BPM\'ini üst çubuğa yazarsan ızgara ile örtüşür.'),
  );
}

function duplicateClip() {
  const c = clipById(sel);
  if (!c) return;
  const copy = { ...c, id: uid(), bar: c.bar + Math.ceil(clipSteps(state.project, c) / BAR) };
  state.project.playlist.clips.push(copy);
  sel = copy.id;
  changed('playlist');
}

function removeClip(id) {
  const clips = state.project.playlist.clips;
  const i = clips.findIndex((c) => c.id === id);
  if (i >= 0) clips.splice(i, 1);
  if (sel === id) sel = null;
}

// ---------- mouse drag for audio clips (snaps to beats) ----------
root.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('.pl-clip.audio');
  if (!el || erase || e.pointerType !== 'mouse' || e.button !== 0) return;
  const c = clipById(el.dataset.id);
  if (c) drag = { c, el, x: e.clientX, y: e.clientY, bar: c.bar, lane: c.lane, moved: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
  drag.moved = true;
  const { c, el } = drag;
  c.bar = Math.max(0, Math.round((drag.bar + dx / BW) * 4) / 4);
  const lane = Math.max(0, Math.min(state.project.playlist.lanes - 1, drag.lane + Math.round(dy / el.parentElement.offsetHeight)));
  if (lane !== c.lane) { c.lane = lane; root.querySelector(`.pl-track[data-lane="${lane}"]`)?.append(el); }
  el.style.left = c.bar * BW + 'px';
});
window.addEventListener('pointerup', () => {
  if (!drag) return;
  const { moved, c } = drag;
  drag = null;
  if (!moved) return;
  sel = c.id;
  dragged = true;
  setTimeout(() => { dragged = false; });
  changed('playlist');
});

root.addEventListener('click', (e) => {
  if (dragged) return;
  const P = state.project;
  const clipEl = e.target.closest('.pl-clip');
  if (clipEl) {
    const c = clipById(clipEl.dataset.id);
    if (!c) return;
    if (erase) removeClip(c.id);
    else if (c.ch) sel = c.id;
    else P.current = c.pattern;
    changed('playlist');
    return;
  }
  const track = e.target.closest('.pl-track');
  if (!track || erase) return;
  const bar = Math.floor((e.clientX - track.getBoundingClientRect().left) / BW);
  const lane = +track.dataset.lane;
  const p = patternById(P, P.current);
  const span = p.length;
  const clash = P.playlist.clips.some((c) => {
    if (c.lane !== lane) return false;
    const cs = clipSteps(P, c) || BAR;
    return bar * BAR < c.bar * BAR + cs && c.bar * BAR < bar * BAR + span;
  });
  if (clash) return toast('Bu alanda başka bir blok var');
  P.playlist.clips.push({ id: uid(), lane, bar, pattern: p.id });
  changed('playlist');
});

root.addEventListener('contextmenu', (e) => {
  const clipEl = e.target.closest('.pl-clip');
  if (!clipEl) return;
  e.preventDefault();
  removeClip(clipEl.dataset.id);
  changed('playlist');
});

$('#plMode').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  erase = b.dataset.mode === 'erase';
  $('#plMode').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  root.classList.toggle('erase', erase);
});

export function selectClip(id) { sel = id; }
