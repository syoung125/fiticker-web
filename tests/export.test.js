import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoster } from '../src/media/poster.js';
import { weekDates } from '../src/domain/workouts.js';
test('poster uses fallback when fonts fail and exports 1080 by 1920 PNG', async () => {
  const context = new Proxy(
    {},
    {
      get: (_, name) => (name === 'measureText' ? () => ({ width: 50 }) : () => {}),
      set: () => true,
    },
  );
  let canvas;
  globalThis.document = {
    fonts: {
      load: async () => {
        throw new Error('offline');
      },
    },
    createElement: () => {
      canvas = {
        getContext: () => context,
        toBlob: (cb) => cb(new Blob(['png'], { type: 'image/png' })),
      };
      return canvas;
    },
  };
  const result = await createPoster(weekDates(new Date(2026, 9, 1)), {
    '2026-10-01': { type: 'yoga', name: 'Yoga', minutes: null, memo: '', photo: null },
  });
  assert.equal(canvas.width, 1080);
  assert.equal(canvas.height, 1920);
  assert.equal(result.type, 'image/png');
  delete globalThis.document;
});
