import {
  state, onChange, changed, curPattern, channel, makeChannel, makePattern, notesOf, uid,
  defaultProject, resetHistory, serialize, deserialize, loadAutosave, undo, redo, PATTERN_LENGTHS,
} from './state.js';
import { syncMix, play, stop, isPlaying, playhead, render, decode, preview } from './engine.js';
import { totalSteps, stepInCurrent } from './sequence.js';
import { encodeWav, download, exportMidi, parseMidi, abToB64 } from './fileio.js';
import { $, hydrateIcons, setIcon, toast, h } from './dom.js';
import { renderRack, renderInspector, rackPlayhead, initAddChannel } from './ui-rack.js';
import { renderPiano, pianoPlayhead } from './ui-piano.js';
import { renderPlaylist, playlistPlayhead } from './ui-playlist.js';
import { renderMixer, updateMeters } from './ui-mixer.js';
import { runStems, updateStemHeads } from './ui-stems.js';
import { initExamples } from './ui-examples.js';
import { generateProject, randomOpts, describe } from './generator.js';
import { openGuide } from './ui-guide.js';

hydrateIcons();

// ---------- tabs ----------
let tab = 'rack';
function showTab(t) {
  tab = t;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + t));
  renderActive();
  try { localStorage.setItem('ash-tab', t); } catch (e) { /* storage unavailable */ }
}
function renderActive() {
  if (tab === 'rack') { renderRack(); renderInspector(); }
  else if (tab === 'piano') renderPiano();
  else if (tab === 'playlist') renderPlaylist();
  else if (tab === 'mixer') renderMixer();
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });
document.addEventListener('ash:tab', (e) => showTab(e.detail));

// ---------- header ----------
function renderHeader() {
  const P = state.project;
  if (document.activeElement !== $('#bpm')) $('#bpm').value = P.bpm;
  $('#swing').value = Math.round(P.swing * 100);
  $('#projName').value = P.name;
  $('#patternSel').replaceChildren(...P.patterns.map((p) => h('option', { value: p.id, selected: p.id === P.current }, p.name)));
  document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === state.mode));
}

onChange((scope) => {
  syncMix();
  if (scope === 'mix' || scope === 'steps' || scope === 'param' || scope === 'notes') return;
  renderHeader();
  renderActive();
});

// ---------- transport ----------
function updatePlayBtn() { setIcon($('#btnPlay'), isPlaying() ? 'pause' : 'play'); }
async function togglePlay() {
  if (isPlaying()) stop(); else await play(state.mode);
  updatePlayBtn();
  if (!isPlaying()) clearPlayheads();
}
function clearPlayheads() { rackPlayhead(-1); pianoPlayhead(-1); playlistPlayhead(-1); $('#pos').textContent = '1.1.1'; }

$('#btnPlay').addEventListener('click', togglePlay);
$('#btnStop').addEventListener('click', () => { stop(); updatePlayBtn(); clearPlayheads(); });
$('#modeSeg').addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.mode = b.dataset.mode;
  renderHeader();
  if (isPlaying()) await play(state.mode);
});
$('#bpm').addEventListener('change', (e) => {
  const v = Math.round(+e.target.value);
  state.project.bpm = Math.max(40, Math.min(300, v || 120));
  e.target.value = state.project.bpm;
  changed('param');
});
$('#swing').addEventListener('input', (e) => { state.project.swing = +e.target.value / 100; changed('param'); });
$('#patternSel').addEventListener('change', (e) => { state.project.current = e.target.value; changed('patterns'); });
$('#btnAddPattern').addEventListener('click', () => {
  const P = state.project;
  const p = makePattern(`Pattern ${P.patterns.length + 1}`, curPattern().length);
  P.patterns.push(p);
  P.current = p.id;
  changed('patterns');
  toast(`${p.name} oluşturuldu`);
});

// ---------- pattern toolbar ----------
$('#patLen').addEventListener('change', (e) => { curPattern().length = +e.target.value; changed('patterns'); });
$('#btnPatRename').addEventListener('click', () => {
  const p = curPattern();
  const name = prompt('Pattern adı', p.name);
  if (name && name.trim()) { p.name = name.trim().slice(0, 24); changed('patterns'); }
});
$('#btnPatClone').addEventListener('click', () => {
  const P = state.project, src = curPattern();
  const p = { ...structuredClone(src), id: uid(), name: src.name + ' (kopya)' };
  P.patterns.splice(P.patterns.indexOf(src) + 1, 0, p);
  P.current = p.id;
  changed('patterns');
});
$('#btnPatClear').addEventListener('click', () => {
  if (!confirm('Bu pattern\'deki tüm adımlar ve notalar silinsin mi?')) return;
  const p = curPattern();
  p.steps = {};
  p.notes = {};
  changed('patterns');
});
$('#btnPatDelete').addEventListener('click', () => {
  const P = state.project;
  if (P.patterns.length < 2) return toast('Son pattern silinemez');
  const p = curPattern();
  if (!confirm(`"${p.name}" ve playlist'teki blokları silinsin mi?`)) return;
  P.patterns = P.patterns.filter((x) => x !== p);
  P.playlist.clips = P.playlist.clips.filter((c) => c.pattern !== p.id);
  P.current = P.patterns[0].id;
  changed('patterns');
});

$('#btnGuide').addEventListener('click', openGuide);

// ---------- theme ----------
const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};
function syncThemeIcon() {
  setIcon($('#btnTheme'), isDark() ? 'sun' : 'moon');
  document.querySelector('meta[name=theme-color]').content = isDark() ? '#1f1829' : '#8b5cf6';
}
$('#btnTheme').addEventListener('click', () => {
  const t = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('ash-theme', t); } catch (e) { /* storage unavailable */ }
  syncThemeIcon();
  renderActive();
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { syncThemeIcon(); renderActive(); });

// ---------- file operations ----------
const fname = (ext) => (state.project.name || 'ash-studio').replace(/[^\p{L}\p{N}\-_ ]+/gu, '_').trim() + ext;

function saveProject() {
  const data = serialize();
  const samples = Object.fromEntries(Object.entries(data.samples).map(([id, s]) => [id, { name: s.name, wav: abToB64(s.wav) }]));
  download(new Blob([JSON.stringify({ ...data, samples })], { type: 'application/json' }), fname('.ash'));
  toast('Proje kaydedildi');
}

async function openProject(file) {
  try {
    stop(); updatePlayBtn(); clearPlayheads();
    await deserialize(JSON.parse(await file.text()), decode);
    toast('Proje açıldı');
  } catch (e) {
    console.error(e);
    toast('Proje açılamadı: ' + e.message, 4000);
  }
}

async function exportWav() {
  toast('Render ediliyor…', 10000);
  try {
    const buf = await render(state.project, state.mode);
    download(new Blob([encodeWav(buf)], { type: 'audio/wav' }), fname(state.mode === 'song' ? '.wav' : '-pattern.wav'));
    toast('WAV hazır');
  } catch (e) {
    console.error(e);
    toast('Render başarısız: ' + e.message, 4000);
  }
}

function exportMidiFile() {
  download(new Blob([exportMidi(state.project, state.mode)], { type: 'audio/midi' }), fname('.mid'));
  toast('MIDI hazır');
}

async function loadSampleInto(ch, file) {
  const buffer = await decode(await file.arrayBuffer());
  const id = uid();
  state.samples.set(id, { name: file.name, buffer });
  ch.sampleId = id;
  return ch;
}

async function importAudio(files) {
  let n = 0;
  for (const file of files) {
    try {
      const ch = makeChannel('sample', { name: file.name.replace(/\.[^.]+$/, '').slice(0, 28) });
      await loadSampleInto(ch, file);
      state.project.channels.push(ch);
      state.selected = ch.id;
      n++;
    } catch (e) {
      toast(`${file.name} okunamadı`, 3500);
    }
  }
  if (n) { changed('channels'); toast(`${n} sample eklendi`); }
}

async function importMidi(file) {
  try {
    const m = parseMidi(await file.arrayBuffer());
    if (!m.notes.length) return toast('MIDI dosyasında nota bulunamadı');
    const P = state.project;
    let ch = channel(state.selected);
    if (!ch || ch.type !== 'synth') { ch = makeChannel('synth', { preset: 'Keys' }); P.channels.push(ch); }
    const per = m.ppq / 4, max = PATTERN_LENGTHS[PATTERN_LENGTHS.length - 1];
    const fold = (n) => { while (n < 36) n += 12; while (n > 96) n -= 12; return n; };
    const notes = m.notes
      .map((n) => ({ s: Math.round(n.tick / per), l: Math.max(1, Math.round(n.dur / per)), n: fold(n.note), v: Math.max(0.1, n.vel / 127) }))
      .filter((n) => n.s < max);
    const end = Math.max(...notes.map((n) => n.s + n.l));
    const pat = curPattern();
    pat.length = Math.max(pat.length, PATTERN_LENGTHS.find((l) => l >= end) || max);
    for (const n of notes) n.l = Math.min(n.l, pat.length - n.s);
    notesOf(pat, ch.id).push(...notes);
    if (m.bpm) P.bpm = Math.round(m.bpm);
    state.selected = ch.id;
    changed('all');
    showTab('piano');
    toast(`${notes.length} nota içe aktarıldı`);
  } catch (e) {
    console.error(e);
    toast('MIDI okunamadı: ' + e.message, 4000);
  }
}

function newProject() {
  if (!confirm('Mevcut proje kapatılsın mı? (Kaydetmediysen değişiklikler kaybolur)')) return;
  stop(); updatePlayBtn(); clearPlayheads();
  state.project = defaultProject(false);
  state.samples = new Map();
  state.selected = state.project.channels[0].id;
  resetHistory();
  changed('all');
}

async function loadGenerated(opts, autoplay) {
  if (!confirm(`"${opts.name}" açılsın mı? Mevcut proje değiştirilecek (kaydetmediysen değişiklikler kaybolur).`)) return;
  stop(); clearPlayheads();
  state.project = generateProject(opts);
  state.samples = new Map();
  state.selected = state.project.channels[0]?.id || null;
  state.mode = 'song';
  resetHistory();
  changed('all');
  if (autoplay) await play('song');
  updatePlayBtn();
  toast(`${opts.name} · ${describe(opts)}`, 3500);
}
initExamples(loadGenerated);
$('#btnGen').addEventListener('click', () => loadGenerated(randomOpts($('#genStyle').value), true));

const pick = (sel, fn) => {
  const inp = $(sel);
  inp.onchange = () => { if (inp.files.length) fn([...inp.files]); inp.value = ''; };
  inp.click();
};

let sampleTarget = null;
document.addEventListener('ash:load-sample', (e) => {
  sampleTarget = e.detail;
  pick('#fileSample', async ([f]) => {
    const ch = channel(sampleTarget);
    if (!ch) return;
    try { await loadSampleInto(ch, f); changed('channels'); } catch (err) { toast('Ses dosyası okunamadı'); }
  });
});
initAddChannel(() => pick('#fileAudio', importAudio));

// ---------- menu ----------
const menu = $('#menu');
let installEvt = null;
$('#btnMenu').addEventListener('click', (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target)) menu.hidden = true; });
$('#projName').addEventListener('change', (e) => { state.project.name = e.target.value.trim() || 'Yeni Proje'; changed('param'); });
menu.addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  menu.hidden = true;
  const act = b.dataset.act;
  if (act === 'new') newProject();
  else if (act === 'open') pick('#fileProject', ([f]) => openProject(f));
  else if (act === 'save') saveProject();
  else if (act === 'wav') exportWav();
  else if (act === 'midi') exportMidiFile();
  else if (act === 'audio') pick('#fileAudio', importAudio);
  else if (act === 'midiIn') pick('#fileMidi', ([f]) => importMidi(f));
  else if (act === 'undo') { if (!undo()) toast('Geri alınacak bir şey yok'); }
  else if (act === 'redo') { if (!redo()) toast('Yinelenecek bir şey yok'); }
  else if (act === 'guide') openGuide();
  else if (act === 'install' && installEvt) { installEvt.prompt(); installEvt = null; b.hidden = true; }
});
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvt = e;
  menu.querySelector('[data-act=install]').hidden = false;
});

// ---------- drag & drop ----------
let dragDepth = 0;
window.addEventListener('dragenter', (e) => { if (e.dataTransfer?.types.includes('Files')) { dragDepth++; document.body.classList.add('dragging'); } });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; document.body.classList.remove('dragging'); } });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('dragging');
  const files = [...(e.dataTransfer?.files || [])];
  if (!files.length) return;
  const f = files[0], ext = f.name.split('.').pop().toLowerCase();
  if (ext === 'ash' || ext === 'json') openProject(f);
  else if (ext === 'mid' || ext === 'midi') importMidi(f);
  else if (tab === 'stems') runStems(f);
  else importAudio(files);
});

// ---------- keyboard ----------
const KEYS = 'awsedftgyhujkolp';
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input[type=text], input[type=number], select, textarea')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); return; }
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k === 's') { e.preventDefault(); saveProject(); return; }
  if (mod || e.altKey || e.repeat) return;
  const i = KEYS.indexOf(k);
  if (i >= 0) preview(channel(state.selected), 60 + i);
});

// ---------- animation loop ----------
function loop() {
  const ph = playhead();
  if (ph && ph.step >= 0) {
    const P = state.project;
    const g = ph.step % totalSteps(P, ph.mode);
    $('#pos').textContent = `${Math.floor(g / 16) + 1}.${Math.floor((g % 16) / 4) + 1}.${(g % 4) + 1}`;
    const s = stepInCurrent(P, ph.mode, g);
    if (tab === 'rack') rackPlayhead(s);
    if (tab === 'piano') pianoPlayhead(s);
    if (tab === 'playlist') playlistPlayhead(ph.mode === 'song' ? g : -1);
  }
  if (tab === 'mixer') updateMeters();
  if (tab === 'stems') updateStemHeads();
  requestAnimationFrame(loop);
}

// ---------- boot ----------
(async function init() {
  let restored = false;
  try {
    const data = await loadAutosave();
    if (data) { await deserialize(data, decode); restored = true; }
  } catch (e) {
    console.warn('Otomatik kayıt yüklenemedi', e);
  }
  if (!restored) {
    state.project = defaultProject(true);
    state.selected = state.project.channels[0].id;
    resetHistory();
  }
  syncThemeIcon();
  renderHeader();
  let saved = 'rack';
  try { saved = localStorage.getItem('ash-tab') || 'rack'; } catch (e) { /* storage unavailable */ }
  showTab(document.getElementById('tab-' + saved) ? saved : 'rack');
  requestAnimationFrame(loop);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW kaydı başarısız', e));
  }
})();
