import test from 'node:test';
import assert from 'node:assert/strict';
import { alphaBounds, centeredDestination } from '../src/media/icon.js';

test('asymmetric transparent emoji padding is excluded from alignment', () => {
  const width = 12,
    height = 10;
  const data = new Uint8ClampedArray(width * height * 4);
  // Visible icon is shifted right inside its text/bitmap box.
  for (let y = 2; y < 8; y++) for (let x = 6; x < 10; x++) data[(y * width + x) * 4 + 3] = 255;
  const bounds = alphaBounds({ data, width, height });
  assert.deepEqual(bounds, { x: 6, y: 2, width: 4, height: 6 });
  const destination = centeredDestination(bounds, 100, 200);
  assert.equal(destination.x + bounds.width / 2, 100);
  assert.equal(destination.y + bounds.height / 2, 200);
});
test('transparent or edge-touching icon buffers are handled', () => {
  const data = new Uint8ClampedArray(4 * 4 * 4);
  assert.equal(alphaBounds({ data, width: 4, height: 4 }), null);
  data[3] = 1;
  data[data.length - 1] = 255;
  assert.deepEqual(alphaBounds({ data, width: 4, height: 4 }), { x: 0, y: 0, width: 4, height: 4 });
});
test('odd-sized icons center exactly in fractional-width calendar and cards', () => {
  const bounds = { x: 20, y: 10, width: 35, height: 53 };
  for (const center of [66 + 948 / 14, 66 + (948 - 40) / 3 / 2]) {
    const destination = centeredDestination(bounds, center, 760);
    assert.equal(destination.x + bounds.width / 2, center);
    assert.equal(destination.y + bounds.height / 2, 760);
  }
});

test('renderer crops glyph whitespace before drawing at requested center', async (t) => {
  const { createIconRenderer } = await import('../src/media/icon.js');
  const original = globalThis.document;
  t.after(() => {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  });
  const width = 12,
    height = 10;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 2; y < 8; y++) for (let x = 6; x < 10; x++) data[(y * width + x) * 4 + 3] = 255;
  let surfaces = 0;
  globalThis.document = {
    createElement: () => {
      surfaces++;
      return {
        getContext: () => ({ fillText() {}, getImageData: () => ({ data, width, height }) }),
      };
    },
  };
  const calls = [];
  const icon = createIconRenderer({ drawImage: (...args) => calls.push(args) });
  icon('🏃', 100, 200, 35);
  icon('🏃', 300, 400, 35);
  assert.deepEqual(calls[0].slice(1), [6, 2, 4, 6, 98, 197, 4, 6]);
  assert.deepEqual(calls[1].slice(1), [6, 2, 4, 6, 298, 397, 4, 6]);
  assert.equal(surfaces, 1);
});
