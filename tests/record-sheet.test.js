import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecordSheet } from '../src/ui/record-sheet.js';

// A small DOM fixture exercises actual sheet event handlers and the real duration picker.
function fixture() {
  const nodes = new Map();
  function node() {
    return {
      children: [],
      dataset: {},
      attributes: {},
      listeners: {},
      value: '',
      scrollTop: 0,
      hidden: false,
      disabled: false,
      classList: { toggle() {} },
      append(...items) {
        this.children.push(...items);
      },
      replaceChildren(...items) {
        this.children = items;
      },
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      addEventListener(name, handler) {
        this.listeners[name] = handler;
      },
      querySelector(selector) {
        return get(selector);
      },
      focus() {},
      reset() {},
      showModal() {
        this.open = true;
        this.openCount = (this.openCount || 0) + 1;
      },
      close() {
        this.open = false;
      },
    };
  }
  function get(selector) {
    if (!nodes.has(selector)) {
      const value = node();
      value.id = selector.slice(1);
      nodes.set(selector, value);
    }
    return nodes.get(selector);
  }
  const sections = ['type', 'time', 'memo', 'delete'].map((mode) => {
    const section = node();
    section.dataset.sheet = mode;
    return section;
  });
  const doc = {
    querySelector: get,
    querySelectorAll(selector) {
      if (selector === '[data-sheet]') return sections;
      if (selector === '[data-type]') return get('#types').children;
      return [];
    },
    createElement: node,
    createTextNode: (textContent) => ({ textContent }),
  };
  return { doc, get, sections };
}

test('separate sheets add sport in one step, preserve unrelated fields, and clear only their own content', () => {
  const previous = globalThis.document;
  const { doc, get, sections } = fixture();
  globalThis.document = doc;
  try {
    const records = {},
      saved = [];
    const sheet = createRecordSheet({ records, onSave: (...args) => saved.push(args) });
    const date = new Date(2026, 9, 1),
      key = '2026-10-01';
    const submit = () => get('#workout-form').onsubmit({ preventDefault() {} });
    const choose = (type) =>
      get('#types')
        .children.find((button) => button.dataset.type === type)
        .onclick();
    const visible = () =>
      sections.filter((section) => !section.hidden).map((section) => section.dataset.sheet);

    sheet.open(date, 'type');
    assert.deepEqual(visible(), ['type']);
    choose('crossfit');
    assert.equal(get('#workout-dialog').open, false);
    assert.equal(get('#workout-dialog').openCount, 1); // No automatic time sheet.
    assert.equal(records[key].minutes, null);

    sheet.open(date, 'time');
    assert.deepEqual(visible(), ['time']);
    get('#hours-wheel').scrollTop = 44;
    // Use the picker option click handler rather than relying on a pixel assumption.
    get('#hours-wheel').listeners.click({
      target: { closest: () => ({ dataset: { index: '1' } }) },
    });
    submit();
    assert.equal(records[key].minutes, 60);

    sheet.open(date, 'memo');
    assert.deepEqual(visible(), ['memo']);
    get('#memo').value = '오늘도 완료';
    submit();
    assert.equal(records[key].memo, '오늘도 완료');
    assert.equal(records[key].minutes, 60);

    sheet.open(date, 'type');
    choose('yoga');
    assert.equal(records[key].type, 'yoga');
    assert.equal(records[key].minutes, 60);
    assert.equal(records[key].memo, '오늘도 완료');

    sheet.open(date, 'time');
    assert.equal(get('#open-delete').attributes['aria-label'], '시간 지우기');
    get('#open-delete').onclick();
    assert.equal(records[key].minutes, null);
    assert.equal(records[key].memo, '오늘도 완료');
    assert.deepEqual(saved.at(-1), [key, 'time', true]);

    sheet.open(date, 'memo');
    assert.equal(get('#open-delete').attributes['aria-label'], '메모 지우기');
    get('#open-delete').onclick();
    assert.equal(records[key].memo, '');
    assert.equal(records[key].type, 'yoga');

    sheet.open(date, 'type');
    get('#open-delete').onclick();
    assert.deepEqual(visible(), ['delete']);
    assert.ok(records[key]);
    submit();
    assert.equal(records[key], undefined);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});
