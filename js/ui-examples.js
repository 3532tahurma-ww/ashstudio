import { EXAMPLES, STYLES, describe } from './generator.js';
import { $, h, icon } from './dom.js';

// onOpen(opts, autoplay) is provided by app.js
export function initExamples(onOpen) {
  $('#examples').replaceChildren(...EXAMPLES.map((ex) => h('div', { class: 'example card' },
    h('div', { class: 'ex-icon' }, ex.icon),
    h('div', { class: 'ex-body' },
      h('h3', {}, ex.name),
      h('p', {}, ex.desc),
      h('span', { class: 'tag' }, describe(ex))),
    h('div', { class: 'ex-actions' },
      h('button', { class: 'btn sm primary', onclick: () => onOpen(ex, true) }, icon('play'), 'Aç ve çal'),
      h('button', { class: 'btn sm', onclick: () => onOpen(ex, false) }, 'Aç')),
  )));

  $('#genStyle').replaceChildren(
    h('option', { value: '' }, 'Karışık tarz'),
    ...Object.entries(STYLES).map(([k, s]) => h('option', { value: k }, s.label)),
  );
}
