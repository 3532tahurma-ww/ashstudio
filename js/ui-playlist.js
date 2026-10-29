import { state, changed, uid } from './state.js';
import { songSteps, patternById, BAR } from './sequence.js';
import { $, h, toast } from './dom.js';

const root = $('#playlist');
let erase = false, head = null, BW = 56, LW = 84;

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
    ...Array.from({ length: bars }, (_, i) => h('div', { class: 'pl-bar' }, String(i + 1)))));
  for (let l = 0; l < P.playlist.lanes; l++) {
    const track = h('div', { class: 'pl-track', dataset: { lane: l } });
    for (const c of P.playlist.clips) {
      if (c.lane !== l) continue;
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
}

export function playlistPlayhead(g) {
  if (!head) return;
  if (g < 0) { head.style.display = 'none'; return; }
  head.style.display = 'block';
  head.style.transform = `translateX(${LW + (g / BAR) * BW}px)`;
}

function removeClip(id) {
  const clips = state.project.playlist.clips;
  const i = clips.findIndex((c) => c.id === id);
  if (i >= 0) clips.splice(i, 1);
}

root.addEventListener('click', (e) => {
  const P = state.project;
  const clipEl = e.target.closest('.pl-clip');
  if (clipEl) {
    const c = P.playlist.clips.find((x) => x.id === clipEl.dataset.id);
    if (!c) return;
    if (erase) removeClip(c.id); else P.current = c.pattern;
    changed('playlist');
    return;
  }
  const track = e.target.closest('.pl-track');
  if (!track || erase) return;
  const bar = Math.floor((e.clientX - track.getBoundingClientRect().left) / BW);
  const lane = +track.dataset.lane;
  const p = patternById(P, P.current);
  const span = Math.ceil(p.length / BAR);
  const clash = P.playlist.clips.some((c) => {
    if (c.lane !== lane) return false;
    const cp = patternById(P, c.pattern);
    const cs = cp ? Math.ceil(cp.length / BAR) : 1;
    return bar < c.bar + cs && c.bar < bar + span;
  });
  if (clash) return toast('Bu alanda başka bir pattern var');
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
