import { state, changed } from './state.js';
import { liveGraph, peak } from './engine.js';
import { $, h } from './dom.js';

const root = $('#mixer');
let meters = [];

const db = (v) => (v <= 0.0001 ? '-∞ dB' : (20 * Math.log10(v * v)).toFixed(1) + ' dB');

function fader(obj, key, out) {
  return h('input', {
    type: 'range', class: 'vfader', min: 0, max: 1.25, step: 0.01, value: obj[key],
    oninput: (e) => { obj[key] = +e.target.value; out.textContent = db(obj[key]); changed('mix'); },
  });
}

function knob(label, ch, key, min, max) {
  return h('label', { class: 'knob' }, h('span', {}, label),
    h('input', { type: 'range', min, max, step: 0.01, value: ch[key], oninput: (e) => { ch[key] = +e.target.value; changed('mix'); } }));
}

function toggle(label, ch, key, extra = '') {
  return h('button', {
    class: `ms ${extra}` + (ch[key] ? ' on' : ''), title: key === 'mute' ? 'Sessiz' : 'Solo',
    onclick: (e) => { ch[key] = !ch[key]; e.currentTarget.classList.toggle('on', ch[key]); changed('mix'); },
  }, label);
}

function meter(id) {
  const el = h('div', { class: 'meter' }, h('i'));
  meters.push({ el: el.firstChild, id, v: 0 });
  return el;
}

export function renderMixer() {
  const P = state.project;
  meters = [];
  root.replaceChildren();
  for (const ch of P.channels) {
    const out = h('output', { class: 'db' }, db(ch.vol));
    root.append(h('div', { class: 'strip', style: { '--c': ch.color } },
      h('div', { class: 'strip-name', title: ch.name }, ch.name),
      h('div', { class: 'fader-wrap' }, meter(ch.id), fader(ch, 'vol', out)),
      out,
      knob('Pan', ch, 'pan', -1, 1),
      knob('Reverb', ch, 'rev', 0, 1),
      knob('Delay', ch, 'dly', 0, 1),
      h('div', { class: 'ms-row' }, toggle('M', ch, 'mute'), toggle('S', ch, 'solo', 'solo')),
    ));
  }
  const out = h('output', { class: 'db' }, db(P.master));
  root.append(h('div', { class: 'strip master', style: { '--c': 'var(--primary)' } },
    h('div', { class: 'strip-name' }, 'MASTER'),
    h('div', { class: 'fader-wrap' }, meter('master'), fader(P, 'master', out)),
    out,
  ));
}

export function updateMeters() {
  const g = liveGraph();
  if (!g) return;
  for (const m of meters) {
    const an = m.id === 'master' ? g.analyser : g.strips.get(m.id)?.analyser;
    if (!an) continue;
    m.v = Math.max(peak(an), m.v * 0.9);
    m.el.style.height = Math.min(100, m.v * 100) + '%';
  }
}
