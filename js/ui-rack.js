import { state, changed, curPattern, stepsOf, channel, makeChannel, removeChannel, uid, SYNTH_PRESETS, DRUMS } from './state.js';
import { preview, isPlaying } from './engine.js';
import { $, h, icon, slider, cssVar } from './dom.js';
import { randomizeChannel } from './generator.js';

const rackEl = $('#rack'), inspEl = $('#inspector');
let stepCells = [], lastPlay = -1;

const goTab = (tab) => document.dispatchEvent(new CustomEvent('ash:tab', { detail: tab }));

export function renderRack() {
  const P = state.project, pat = curPattern();
  $('#patLen').value = String(pat.length);
  stepCells = Array.from({ length: pat.length }, () => []);
  rackEl.replaceChildren();
  for (const ch of P.channels) {
    const steps = stepsOf(pat, ch.id);
    const hasNotes = (pat.notes[ch.id] || []).length > 0;
    const grid = h('div', { class: 'steps' });
    for (let s = 0; s < pat.length; s++) {
      const b = h('button', { class: 'step' + (steps[s] ? ' on' : '') + (Math.floor(s / 4) % 2 ? ' alt' : ''), dataset: { s, id: ch.id }, 'aria-label': `Adım ${s + 1}` });
      grid.append(b);
      stepCells[s].push(b);
    }
    const head = h('div', { class: 'head' },
      h('button', {
        class: 'led' + (ch.mute ? '' : ' on'), title: 'Aç / sessize al',
        onclick: (e) => { ch.mute = !ch.mute; e.currentTarget.classList.toggle('on', !ch.mute); changed('mix'); },
      }),
      h('input', { type: 'range', class: 'mini', min: 0, max: 1.25, step: 0.01, value: ch.vol, title: 'Ses', oninput: (e) => { ch.vol = +e.target.value; changed('mix'); } }),
      h('button', { class: 'ch-name', title: 'Seç (çift tık: piano roll)', onclick: () => select(ch.id), ondblclick: () => { select(ch.id); goTab('piano'); } },
        ch.name, hasNotes ? h('i', { class: 'pr-dot', title: 'Piano roll notaları var' }) : null),
    );
    rackEl.append(h('div', { class: 'row' + (state.selected === ch.id ? ' sel' : ''), dataset: { id: ch.id }, style: { '--c': ch.color } }, head, grid));
  }
  if (!P.channels.length) rackEl.append(h('p', { class: 'muted' }, 'Kanal yok. "+ Kanal ekle" ile başla.'));
  lastPlay = -1;
}

export function rackPlayhead(s) {
  if (s === lastPlay) return;
  stepCells[lastPlay]?.forEach((b) => b.classList.remove('play'));
  stepCells[s]?.forEach((b) => b.classList.add('play'));
  lastPlay = s;
}

function setStep(b, v) {
  const steps = stepsOf(curPattern(), b.dataset.id);
  const s = +b.dataset.s;
  if (!!steps[s] === v) return;
  steps[s] = v ? 1 : 0;
  b.classList.toggle('on', v);
  if (v && !isPlaying()) preview(channel(b.dataset.id));
  changed('steps');
}

// Mouse: press-and-drag paints steps. Touch: tap toggles (drag scrolls).
let paint = null, lastType = 'mouse';
rackEl.addEventListener('pointerdown', (e) => {
  lastType = e.pointerType;
  const b = e.target.closest('.step');
  if (!b || e.pointerType !== 'mouse' || e.button !== 0) return;
  e.preventDefault();
  paint = !b.classList.contains('on');
  setStep(b, paint);
});
window.addEventListener('pointermove', (e) => {
  if (paint === null) return;
  const b = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.step');
  if (b && rackEl.contains(b)) setStep(b, paint);
});
window.addEventListener('pointerup', () => { paint = null; });
rackEl.addEventListener('click', (e) => {
  const b = e.target.closest('.step');
  if (b && lastType !== 'mouse') setStep(b, !b.classList.contains('on'));
});

export function select(id) {
  state.selected = id;
  rackEl.querySelectorAll('.row').forEach((r) => r.classList.toggle('sel', r.dataset.id === id));
  renderInspector();
}

// ---------- add-channel select ----------
export function initAddChannel(onSample) {
  const sel = $('#addCh');
  sel.replaceChildren(
    h('option', { value: '' }, '+ Kanal ekle'),
    h('optgroup', { label: 'Davul' }, ...Object.entries(DRUMS).map(([k, v]) => h('option', { value: 'drum:' + k }, v))),
    h('optgroup', { label: 'Synth' }, ...Object.keys(SYNTH_PRESETS).map((k) => h('option', { value: 'synth:' + k }, k))),
    h('optgroup', { label: 'Sample' }, h('option', { value: 'sample' }, 'Dosyadan sample…')),
  );
  sel.addEventListener('change', () => {
    const [type, sub] = sel.value.split(':');
    sel.value = '';
    if (type === 'sample') return onSample();
    if (!type) return;
    const ch = makeChannel(type, type === 'drum' ? { drum: sub } : { preset: sub });
    state.project.channels.push(ch);
    state.selected = ch.id;
    changed('channels');
  });
}

// ---------- inspector ----------
const fmtS = (v) => (v < 1 ? Math.round(v * 1000) + 'ms' : v.toFixed(2) + 's');
const fmtHz = (v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v) + '');
const fmtSt = (v) => (v > 0 ? '+' : '') + Math.round(v);

export function renderInspector() {
  const ch = channel(state.selected);
  inspEl.replaceChildren();
  if (!ch) { inspEl.append(h('p', { class: 'muted' }, 'Ayarlarını görmek için bir kanal seç.')); return; }

  const param = (label, key, opts) => slider(label, ch.params[key], opts, (v) => { ch.params[key] = v; changed('param'); });
  inspEl.append(h('div', { class: 'insp-head' },
    h('span', { class: 'tag' }, ch.type === 'drum' ? 'Davul' : ch.type === 'synth' ? 'Synth' : 'Sample'),
    h('input', { type: 'text', value: ch.name, maxlength: 28, onchange: (e) => { ch.name = e.target.value.trim() || ch.name; changed('channels'); } }),
    h('input', { type: 'color', value: ch.color, title: 'Renk', onchange: (e) => { ch.color = e.target.value; changed('channels'); } }),
    h('button', { class: 'btn sm', title: 'Önizle', onclick: () => preview(ch) }, icon('speaker')),
    h('button', { class: 'btn sm', title: 'Bu pattern için rastgele üret', onclick: () => { randomizeChannel(state.project, curPattern(), ch); changed('patterns'); } }, icon('dice'), 'Rastgele'),
    h('button', { class: 'btn sm', title: 'Piano roll', onclick: () => goTab('piano') }, icon('piano')),
    h('button', { class: 'btn sm', title: 'Klonla', onclick: () => duplicate(ch) }, icon('copy')),
    h('button', { class: 'btn sm danger', title: 'Sil', onclick: () => { if (confirm(`"${ch.name}" silinsin mi?`)) { removeChannel(ch.id); changed('channels'); } } }, icon('trash')),
  ));

  const params = h('div', { class: 'params' });
  if (ch.type === 'drum') {
    params.append(
      param('Tune', 'tune', { min: -12, max: 12, step: 1, fmt: fmtSt }),
      param('Decay', 'decay', { min: 0.2, max: 2, step: 0.01, fmt: (v) => v.toFixed(2) + '×' }),
    );
  } else if (ch.type === 'synth') {
    const preset = h('select', { class: 'btn-select', onchange: (e) => { Object.assign(ch.params, SYNTH_PRESETS[e.target.value], { preset: e.target.value }); changed('param'); renderInspector(); } },
      ...Object.keys(SYNTH_PRESETS).map((k) => h('option', { value: k, selected: ch.params.preset === k }, k)));
    const wave = h('select', { class: 'btn-select', onchange: (e) => { ch.params.wave = e.target.value; changed('param'); } },
      ...[['sine', 'Sine'], ['triangle', 'Triangle'], ['sawtooth', 'Saw'], ['square', 'Square'], ['supersaw', 'SuperSaw'], ['bell', 'Çan'], ['marimba', 'Marimba'], ['organ', 'Org'], ['epiano', 'E.Piyano']].map(([v, l]) => h('option', { value: v, selected: ch.params.wave === v }, l)));
    params.append(
      h('label', { class: 'slider' }, h('span', {}, 'Preset'), preset, h('span')),
      h('label', { class: 'slider' }, h('span', {}, 'Dalga'), wave, h('span')),
      param('Attack', 'attack', { min: 0.002, max: 2, log: true, fmt: fmtS }),
      param('Decay', 'decay', { min: 0.01, max: 2, log: true, fmt: fmtS }),
      param('Sustain', 'sustain', { min: 0, max: 1, step: 0.01 }),
      param('Release', 'release', { min: 0.01, max: 3, log: true, fmt: fmtS }),
      param('Cutoff', 'cutoff', { min: 80, max: 18000, log: true, fmt: fmtHz }),
      param('Rezonans', 'res', { min: 0, max: 20, step: 0.1, fmt: (v) => v.toFixed(1) }),
      param('Filtre env', 'envAmt', { min: 0, max: 8000, step: 10, fmt: fmtHz }),
      param('Detune', 'detune', { min: 0, max: 50, step: 1, fmt: (v) => Math.round(v) + 'c' }),
      param('Oktav', 'octave', { min: -2, max: 2, step: 1, fmt: fmtSt }),
    );
  } else {
    const smp = state.samples.get(ch.sampleId);
    params.append(
      param('Pitch', 'pitch', { min: -24, max: 24, step: 1, fmt: fmtSt }),
      param('Kazanç', 'gain', { min: 0, max: 2, step: 0.01 }),
      h('button', { class: 'btn sm', onclick: () => document.dispatchEvent(new CustomEvent('ash:load-sample', { detail: ch.id })) }, icon('upload'), smp ? 'Değiştir' : 'Sample yükle'),
      smp ? h('button', { class: 'btn sm', title: 'Dosyanın tamamını şarkıya ses klibi olarak koy', onclick: () => document.dispatchEvent(new CustomEvent('ash:place-clip', { detail: ch.id })) }, icon('playlist'), 'Playlist\'e yerleştir') : null,
    );
    if (smp) {
      const cv = h('canvas', { class: 'wave-canvas' });
      inspEl.append(h('div', { class: 'muted' }, `${smp.name} · ${smp.buffer.duration.toFixed(2)} sn`), cv);
      requestAnimationFrame(() => drawWave(cv, smp.buffer, ch.color));
    }
  }
  inspEl.append(params);
}

function duplicate(ch) {
  const P = state.project;
  const copy = { ...structuredClone(ch), id: uid(), name: ch.name + ' 2' };
  P.channels.splice(P.channels.indexOf(ch) + 1, 0, copy);
  for (const p of P.patterns) {
    if (p.steps[ch.id]) p.steps[copy.id] = [...p.steps[ch.id]];
    if (p.notes[ch.id]) p.notes[copy.id] = p.notes[ch.id].map((n) => ({ ...n }));
  }
  state.selected = copy.id;
  changed('channels');
}

export function drawWave(cv, buffer, color) {
  const w = cv.clientWidth || 300, ht = cv.clientHeight || 60, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = w * dpr; cv.height = ht * dpr;
  const x = cv.getContext('2d');
  x.scale(dpr, dpr);
  const d = buffer.getChannelData(0), per = Math.max(1, Math.floor(d.length / w));
  x.fillStyle = color || cssVar('--primary');
  for (let i = 0; i < w; i++) {
    let mn = 1, mx = -1;
    for (let j = i * per, e = Math.min(d.length, j + per); j < e; j++) { const v = d[j]; if (v < mn) mn = v; if (v > mx) mx = v; }
    if (mx < mn) continue;
    x.fillRect(i, ((1 - mx) * ht) / 2, 1, Math.max(1, ((mx - mn) * ht) / 2));
  }
}
