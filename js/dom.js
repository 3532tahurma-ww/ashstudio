export const $ = (sel) => document.querySelector(sel);

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'style') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, sv);
        else el.style[sk] = sv;
      }
    } else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of kids.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const ICONS = {
  play: '<path d="M7 5v14l12-7z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  rack: '<rect x="3" y="5" width="5" height="5" rx="1.5"/><rect x="10" y="5" width="5" height="5" rx="1.5"/><rect x="17" y="5" width="4" height="5" rx="1.5"/><rect x="3" y="14" width="5" height="5" rx="1.5"/><rect x="10" y="14" width="5" height="5" rx="1.5"/><rect x="17" y="14" width="4" height="5" rx="1.5"/>',
  piano: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v9M12 4v9M16 4v9M8 13v7M12 13v7M16 13v7"/>',
  playlist: '<path d="M3 6h9M3 12h18M3 18h12"/>',
  mixer: '<path d="M6 4v16M12 4v16M18 4v16"/><rect x="4" y="13" width="4" height="3" rx="1"/><rect x="10" y="7" width="4" height="3" rx="1"/><rect x="16" y="11" width="4" height="3" rx="1"/>',
  wave: '<path d="M3 12h1M7 8v8M11 4v16M15 7v10M19 10v4"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  hand: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="9" r="1.3" fill="currentColor"/><circle cx="9" cy="15" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13"/><path d="M9 7h6"/>',
};

export function icon(name) {
  const span = document.createElement('span');
  span.className = 'ic';
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
  return span;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('i[data-ic]').forEach((el) => el.replaceWith(icon(el.dataset.ic)));
}

export function setIcon(btn, name) {
  const old = btn.querySelector('.ic');
  if (old) old.replaceWith(icon(name));
}

// Labeled range input. opts.log maps the 0..1 slider position exponentially onto min..max.
export function slider(label, value, opts, onInput) {
  const { min = 0, max = 1, step = 0.01, fmt = (v) => v.toFixed(2), log = false } = opts;
  const toPos = (v) => (log ? Math.log(v / min) / Math.log(max / min) : v);
  const fromPos = (p) => (log ? min * Math.pow(max / min, p) : p);
  const out = h('output', {}, fmt(value));
  const inp = h('input', log
    ? { type: 'range', min: 0, max: 1, step: 0.001, value: toPos(value) }
    : { type: 'range', min, max, step, value });
  inp.addEventListener('input', () => {
    const v = fromPos(parseFloat(inp.value));
    out.textContent = fmt(v);
    onInput(v);
  });
  return h('label', { class: 'slider' }, h('span', {}, label), inp, out);
}

let toastTimer;
export function toast(msg, ms = 2400) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
