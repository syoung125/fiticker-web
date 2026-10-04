import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeaderScrollState } from '../src/ui/scroll-header.js';

const view = { height: 72, max: 1000 };
test('header hides below its initial area and returns after a deliberate upward scroll', () => {
  const state = createHeaderScrollState();
  assert.equal(state.update(30, view), false);
  assert.equal(state.update(120, view), true);
  assert.equal(state.update(118, view), true);
  assert.equal(state.update(116, view), true);
  assert.equal(state.update(110, view), false);
  assert.equal(state.update(114, view), false);
  assert.equal(state.update(122, view), true);
});
test('top and bottom rubber-band overscroll do not cause false direction changes', () => {
  const state = createHeaderScrollState();
  assert.equal(state.update(1000, view), true);
  assert.equal(state.update(1050, view), true);
  assert.equal(state.update(1000, view), true);
  assert.equal(state.update(988, view), false);
  assert.equal(state.update(-20, view), false);
  assert.equal(state.update(0, view), false);
});
test('open menu or keyboard focus keeps the header visible; resizing resets scroll baseline', () => {
  const state = createHeaderScrollState();
  assert.equal(state.update(200, view), true);
  assert.equal(state.update(250, { ...view, pinned: true }), false);
  assert.equal(state.update(500, { ...view, pinned: true }), false);
  assert.equal(state.update(500, view), false);
  assert.equal(state.update(520, view), true);
  state.reset(400);
  assert.equal(state.update(400, view), true);
  assert.equal(state.update(388, view), false);
});
