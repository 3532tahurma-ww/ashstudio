import { state, changed, curPattern, notesOf, channel } from './state.js';
import { preview } from './engine.js';
import { $, h, cssVar, setIcon } from './dom.js';

const LOW = 36, HIGH = 96, ROWS = HIGH - LOW + 1, RH = 18, CW = 24, KW = 54;
const BLACK = new Set([1, 3, 6, 8, 10]);
const keysC = $('#prKeys'), gridC = $('#prGrid'), scroller = $('#prScroll'), head = $('#prHead');
const chSel = $('#prChannel'), lenSel = $('#prLen'), modeBtn = $('#prMode');
let lastLen = 2, edit = true, drag = null, scrolled = false;

const chId = () => state.selected;

function fit(c, w, ht) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = Math.round(w * dpr); c.height = Math.round(ht * dpr);
  c.style.width = w + 'px'; c.style.height = ht + 'px';
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return x;
}

export function renderPiano() {
  const P = state.project;
  if (!channel(state.selected)) state.selected = (P.channels.find((c) => c.type === 'synth') || P.channels[0])?.id || null;
  chSel.replaceChildren(...P.channels.map((c) => h('option', { value: c.id, selected: c.id === state.selected }, c.name)));
  drawKeys();
  drawGrid();
  if (!scrolled) { scroller.scrollTop = (HIGH - 74) * RH; scrolled = true; }
}

function drawKeys() {
  const x = fit(keysC, KW, ROWS * RH);
  const white = cssVar('--key-white'), black = cssVar('--key-black'), line = cssVar('--border'), muted = cssVar('--muted');
  x.font = '700 10px Nunito, sans-serif';
  x.textBaseline = 'middle';
  for (let r = 0; r < ROWS; r++) {
    const n = HIGH - r, y = r * RH, isB = BLACK.has(n % 12);
    x.fillStyle = isB ? black : white;
    x.fillRect(0, y, isB ? KW * 0.62 : KW, RH);
    if (isB) { x.fillStyle = white; x.fillRect(KW * 0.62, y, KW * 0.38, RH); }
    x.fillStyle = line;
    x.fillRect(0, y + RH - 1, KW, 1);
    if (n % 12 === 0) { x.fillStyle = muted; x.fillText('C' + (n / 12 - 1), KW - 24, y + RH / 2); }
  }
}

function rr(x, px, py, w, ht, r) {
  x.beginPath();
  if (x.roundRect) x.roundRect(px, py, w, ht, r); else x.rect(px, py, w, ht);
  x.fill();
}

function drawGrid() {
  const P = state.project, pat = curPattern(), W = pat.length * CW, H = ROWS * RH;
  const x = fit(gridC, W, H);
  const c = { w: cssVar('--pr-white'), b: cssVar('--pr-black'), line: cssVar('--pr-line'), beat: cssVar('--pr-beat'), bar: cssVar('--pr-bar') };
  for (let r = 0; r < ROWS; r++) {
    const n = HIGH - r;
    x.fillStyle = BLACK.has(n % 12) ? c.b : c.w;
    x.fillRect(0, r * RH, W, RH);
    x.fillStyle = n % 12 === 0 ? c.beat : c.line;
    x.fillRect(0, r * RH + RH - 1, W, 1);
  }
  for (let s = 0; s <= pat.length; s++) {
    x.fillStyle = s % 16 === 0 ? c.bar : s % 4 === 0 ? c.beat : c.line;
    x.fillRect(s * CW, 0, 1, H);
  }
  for (const ch of P.channels) {
    if (ch.id === chId()) continue;
    x.globalAlpha = 0.22;
    x.fillStyle = ch.color;
    for (const n of pat.notes[ch.id] || []) rr(x, n.s * CW + 1, (HIGH - n.n) * RH + 1, n.l * CW - 2, RH - 2, 4);
  }
  x.globalAlpha = 1;
  const ch = channel(chId());
  if (!ch) return;
  for (const n of pat.notes[ch.id] || []) {
    if (n.n < LOW || n.n > HIGH) continue;
    const px = n.s * CW + 1, py = (HIGH - n.n) * RH + 1, w = n.l * CW - 2;
    x.fillStyle = ch.color;
    rr(x, px, py, w, RH - 2, 4);
    x.fillStyle = 'rgba(0,0,0,.22)';
    x.fillRect(px + w - 4, py + 4, 2, RH - 10);
  }
}

export function pianoPlayhead(s) {
  if (s < 0) { head.style.display = 'none'; return; }
  head.style.display = 'block';
  head.style.transform = `translateX(${KW + s * CW}px)`;
}

function cell(e) {
  const r = gridC.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  return { x, s: Math.floor(x / CW), n: HIGH - Math.floor(y / RH) };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

gridC.addEventListener('contextmenu', (e) => e.preventDefault());
gridC.addEventListener('pointerdown', (e) => {
  if (!edit && e.pointerType !== 'mouse') return;
  const ch = channel(chId());
  if (!ch) return;
  const pat = curPattern(), { x, s, n } = cell(e);
  if (s < 0 || s >= pat.length || n < LOW || n > HIGH) return;
  const notes = notesOf(pat, ch.id);
  const hit = notes.find((o) => o.n === n && s >= o.s && s < o.s + o.l);
  if (e.button === 2) {
    if (hit) { notes.splice(notes.indexOf(hit), 1); changed('notes'); drawGrid(); }
    return;
  }
  gridC.setPointerCapture(e.pointerId);
  if (hit) {
    const edge = x > (hit.s + hit.l) * CW - Math.min(10, CW * 0.4);
    drag = { note: hit, mode: edge ? 'resize' : 'move', off: s - hit.s, moved: false, created: false };
  } else {
    const note = { s, l: Math.min(lastLen, pat.length - s), n, v: 0.9 };
    notes.push(note);
    drag = { note, mode: 'move', off: 0, moved: false, created: true };
    preview(ch, n);
    drawGrid();
  }
});
gridC.addEventListener('pointermove', (e) => {
  const pat = curPattern(), { x, s, n } = cell(e);
  if (!drag) {
    const ch = channel(chId());
    const hit = ch && (pat.notes[ch.id] || []).find((o) => o.n === n && s >= o.s && s < o.s + o.l);
    gridC.style.cursor = hit && x > (hit.s + hit.l) * CW - Math.min(10, CW * 0.4) ? 'ew-resize' : hit ? 'grab' : 'crosshair';
    return;
  }
  const note = drag.note;
  if (drag.mode === 'move') {
    const ns = clamp(s - drag.off, 0, pat.length - note.l), nn = clamp(n, LOW, HIGH);
    if (ns !== note.s || nn !== note.n) {
      if (nn !== note.n) preview(channel(chId()), nn);
      note.s = ns; note.n = nn; drag.moved = true;
      drawGrid();
    }
  } else {
    const nl = clamp(s - note.s + 1, 1, pat.length - note.s);
    if (nl !== note.l) { note.l = nl; lastLen = nl; lenSel.value = [1, 2, 4, 8, 16].includes(nl) ? nl : lenSel.value; drag.moved = true; drawGrid(); }
  }
});
const endDrag = () => {
  if (!drag) return;
  if (!drag.created && !drag.moved && drag.mode === 'move') {
    const notes = notesOf(curPattern(), chId());
    notes.splice(notes.indexOf(drag.note), 1);
  }
  drag = null;
  changed('notes');
  drawGrid();
};
gridC.addEventListener('pointerup', endDrag);
gridC.addEventListener('pointercancel', endDrag);

keysC.addEventListener('pointerdown', (e) => {
  const r = keysC.getBoundingClientRect();
  preview(channel(chId()), HIGH - Math.floor((e.clientY - r.top) / RH));
});

chSel.addEventListener('change', () => { state.selected = chSel.value; drawGrid(); });
lenSel.addEventListener('change', () => { lastLen = +lenSel.value; });
modeBtn.addEventListener('click', () => {
  edit = !edit;
  gridC.style.touchAction = edit ? 'none' : 'pan-x pan-y';
  modeBtn.classList.toggle('on', edit);
  setIcon(modeBtn, edit ? 'pencil' : 'hand');
  modeBtn.querySelector('span:not(.ic)').textContent = edit ? 'Düzenle' : 'Kaydır';
});
$('#prClear').addEventListener('click', () => {
  const ch = channel(chId());
  if (!ch || !confirm(`"${ch.name}" kanalındaki notalar silinsin mi?`)) return;
  notesOf(curPattern(), ch.id).length = 0;
  changed('notes');
  drawGrid();
});
