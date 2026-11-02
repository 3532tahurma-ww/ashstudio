import { state, changed, MASTERING, MASTER_PRESETS } from './state.js';
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

// Labeled range; fmt shows the value next to the label, double-click resets to def.
function knob(label, ch, key, min, max, fmt = null, def = null) {
  ch[key] ??= def ?? 0;
  const val = h('em', {}, fmt ? fmt(ch[key]) : '');
  const set = (inp, v) => { ch[key] = v; inp.value = v; if (fmt) val.textContent = fmt(v); changed('mix'); };
  return h('label', { class: 'knob' }, h('span', {}, label, val),
    h('input', {
      type: 'range', min, max, step: 0.01, value: ch[key], title: def != null ? 'Çift tık: sıfırla' : null,
      oninput: (e) => set(e.target, +e.target.value),
      ondblclick: (e) => { if (def != null) set(e.target, def); },
    }));
}
const fmtDb = (v) => (v > 0 ? '+' : '') + v.toFixed(1);
const fmtPct = (v) => Math.round(v * 100) + '%';
const eqKnobs = (o, keys) => [
  h('div', { class: 'strip-sec' }, 'EQ'),
  knob('Bas', o, keys[0], -12, 12, fmtDb, 0),
  knob('Orta', o, keys[1], -12, 12, fmtDb, 0),
  knob('Tiz', o, keys[2], -12, 12, fmtDb, 0),
];

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
      ...eqKnobs(ch, ['eqLow', 'eqMid', 'eqHigh']),
      knob('Komp', ch, 'comp', 0, 1, fmtPct, 0),
      h('div', { class: 'ms-row' }, toggle('M', ch, 'mute'), toggle('S', ch, 'solo', 'solo')),
    ));
  }
  P.mastering ??= { ...MASTERING };
  const M = P.mastering;
  const out = h('output', { class: 'db' }, db(P.master));
  const preset = h('select', {
    class: 'btn-select', title: 'Hazır master ayarı',
    onchange: (e) => { if (MASTER_PRESETS[e.target.value]) { Object.assign(M, MASTER_PRESETS[e.target.value]); changed('mixer'); } },
  }, h('option', { value: '' }, 'Hazır…'), ...Object.keys(MASTER_PRESETS).map((k) => h('option', { value: k }, k)));
  root.append(h('div', { class: 'strip master', style: { '--c': 'var(--primary)' } },
    h('div', { class: 'strip-name' }, 'MASTER'),
    h('div', { class: 'fader-wrap' }, meter('master'), fader(P, 'master', out)),
    out,
    preset,
    ...eqKnobs(M, ['low', 'mid', 'high']),
    h('div', { class: 'strip-sec' }, 'Dinamik'),
    knob('Glue', M, 'glue', 0, 1, fmtPct, MASTERING.glue),
    knob('Loudness', M, 'loud', 0, 12, (v) => '+' + v.toFixed(1), 0),
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
