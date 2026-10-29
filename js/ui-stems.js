import { state, changed, makeChannel, uid } from './state.js';
import { resume } from './engine.js';
import { separate } from './stems.js';
import { encodeWav, download } from './fileio.js';
import { $, h, icon, toast } from './dom.js';
import { drawWave } from './ui-rack.js';

const STEMS = [['drums', 'Davul', '#f0abfc'], ['bass', 'Bas', '#93c5fd'], ['vocals', 'Vokal', '#fcd34d'], ['other', 'Diğer', '#86efac']];
const zone = $('#stemDrop'), input = $('#stemFile'), prog = $('#stemProg'), list = $('#stemList');
let result = null, playing = null, busy = false, heads = {};

function setProg(p, label) {
  prog.querySelector('i').style.width = Math.round(p * 100) + '%';
  prog.querySelector('span').textContent = label || `Ayrıştırılıyor… %${Math.round(p * 100)}`;
}

export async function runStems(file) {
  if (busy) return;
  busy = true;
  stopPreview();
  prog.hidden = false;
  setProg(0, 'Dosya çözülüyor…');
  try {
    const bufs = await separate(file, (p) => setProg(p));
    result = { name: file.name.replace(/\.[^.]+$/, ''), bufs, vol: { drums: 1, bass: 1, vocals: 1, other: 1 }, mute: {}, solo: null };
    render();
    toast('Parçalar ayrıldı');
  } catch (e) {
    console.error(e);
    toast('Ayırma başarısız: ' + e.message, 4000);
  } finally {
    busy = false;
    prog.hidden = true;
  }
}

const gainFor = (k) => ((result.solo ? result.solo === k : !result.mute[k]) ? result.vol[k] : 0);
function applyGains() { if (playing) for (const p of playing.parts) p.g.gain.value = playing.only ? result.vol[p.k] : gainFor(p.k); }

// only = a stem key plays that stem alone (ignores mute/solo); omitted plays the full mix
async function playStems(only) {
  stopPreview();
  const c = await resume();
  const t = c.currentTime + 0.05;
  const parts = STEMS.filter(([k]) => !only || k === only).map(([k]) => {
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = result.bufs[k];
    g.gain.value = only ? result.vol[k] : gainFor(k);
    s.connect(g).connect(c.destination);
    s.start(t);
    return { k, s, g };
  });
  parts[0].s.onended = () => { if (playing?.parts === parts) { playing = null; render(); } };
  playing = { parts, only: only || null, t0: t, ctx: c, dur: result.bufs.drums.duration };
  render();
}

function stopPreview() {
  if (!playing) return;
  for (const p of playing.parts) { try { p.s.stop(); } catch (e) { /* already stopped */ } }
  playing = null;
}

function addChannel(k, label, color) {
  const id = uid();
  state.samples.set(id, { name: `${result.name} - ${label}`, buffer: result.bufs[k] });
  state.project.channels.push(makeChannel('sample', { sampleId: id, name: `${label} · ${result.name}`.slice(0, 28), color }));
}

function render() {
  list.replaceChildren();
  heads = {};
  if (!result) return;
  list.append(h('div', { class: 'stem-top' },
    h('h3', {}, result.name),
    h('button', { class: 'btn primary', onclick: () => (playing && !playing.only ? (stopPreview(), render()) : playStems()) },
      icon(playing && !playing.only ? 'stop' : 'play'), playing && !playing.only ? 'Durdur' : 'Hepsini çal'),
    h('button', { class: 'btn', onclick: () => { for (const [k, l, c] of STEMS) addChannel(k, l, c); changed('channels'); toast('4 kanal eklendi'); } }, icon('plus'), 'Tümünü kanala ekle'),
  ));
  for (const [k, label, color] of STEMS) {
    const cv = h('canvas');
    const hd = h('div', { class: 'head' });
    heads[k] = hd;
    const mute = h('button', { class: 'ms' + (result.mute[k] ? ' on' : ''), onclick: (e) => { result.mute[k] = !result.mute[k]; e.currentTarget.classList.toggle('on', result.mute[k]); applyGains(); } }, 'M');
    const solo = h('button', { class: 'ms solo' + (result.solo === k ? ' on' : ''), onclick: () => { result.solo = result.solo === k ? null : k; applyGains(); render(); } }, 'S');
    const alone = playing?.only === k;
    const playOne = h('button', {
      class: 'ms play' + (alone ? ' on' : ''), title: alone ? 'Durdur' : `Sadece ${label}`,
      onclick: () => (alone ? (stopPreview(), render()) : playStems(k)),
    }, icon(alone ? 'stop' : 'play'));
    list.append(h('div', { class: 'stem card', style: { '--c': color } },
      h('div', { class: 'stem-name' }, label,
        h('input', { type: 'range', min: 0, max: 1.5, step: 0.01, value: result.vol[k], oninput: (e) => { result.vol[k] = +e.target.value; applyGains(); } }),
        h('div', { class: 'ms-row' }, playOne, mute, solo)),
      h('div', { class: 'stem-wave' }, cv, hd),
      h('div', { class: 'stem-actions' },
        h('button', { class: 'btn sm', onclick: () => download(new Blob([encodeWav(result.bufs[k])], { type: 'audio/wav' }), `${result.name}-${k}.wav`) }, icon('download'), 'WAV'),
        h('button', { class: 'btn sm', onclick: () => { addChannel(k, label, color); changed('channels'); toast(`${label} kanala eklendi`); } }, icon('plus'), 'Kanala ekle')),
    ));
    requestAnimationFrame(() => drawWave(cv, result.bufs[k], color));
  }
}

export function updateStemHeads() {
  if (!playing) return;
  const p = Math.max(0, (playing.ctx.currentTime - playing.t0) / playing.dur);
  for (const [k, hd] of Object.entries(heads)) {
    const on = !playing.only || playing.only === k;
    hd.style.display = on ? 'block' : 'none';
    hd.style.left = Math.min(100, p * 100) + '%';
  }
}

input.addEventListener('change', () => { if (input.files[0]) runStems(input.files[0]); input.value = ''; });
zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
zone.addEventListener('dragleave', () => zone.classList.remove('over'));
zone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  zone.classList.remove('over');
  document.body.classList.remove('dragging');
  const f = e.dataTransfer.files[0];
  if (f) runStems(f);
});
