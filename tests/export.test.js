import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoster } from '../src/media/poster.js';
import { weekDates } from '../src/domain/workouts.js';
test('poster uses fallback when fonts fail and exports 1080 by 1920 PNG', async () => {
  const context = new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === 'measureText') return () => ({ width: 50 });
        if (name === 'getImageData')
          return () => ({ width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255]) });
        return () => {};
      },
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
      const surface = {
        getContext: () => context,
        toBlob: (cb) => cb(new Blob(['png'], { type: 'image/png' })),
      };
      canvas ??= surface;
      return surface;
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

async function posterLabels(t, records) {
  const original = globalThis.document;
  t.after(() => {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  });
  const labels = [];
  const context = new Proxy(
    {},
    {
      get: (_, name) => {
        if (name === 'fillText') return (label, x, y) => labels.push({ label, x, y });
        if (name === 'measureText') return () => ({ width: 50 });
        if (name === 'getImageData')
          return () => ({ width: 1, height: 1, data: new Uint8ClampedArray([0, 0, 0, 255]) });
        return () => {};
      },
      set: () => true,
    },
  );
  globalThis.document = {
    fonts: { load: async () => [] },
    createElement: () => ({ getContext: () => context, toBlob: (cb) => cb(new Blob(['png'])) }),
  };
  await createPoster(weekDates(new Date(2026, 9, 1)), records);
  return labels;
}

test('poster lists combined sport time to the right of total only for multiple sports', async (t) => {
  const labels = await posterLabels(t, {
    '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 },
    '2026-09-29': { type: 'yoga', name: 'Yoga', minutes: 30 },
    '2026-09-30': { type: 'running', name: 'Running', minutes: 45 },
  });
  const total = labels.find((item) => item.label === '2h 15m');
  const yoga = labels.find((item) => item.label === 'Yoga 1h 30m');
  const running = labels.find((item) => item.label === 'Running 45m');
  assert.ok(yoga.x > total.x && running.x > total.x);
  assert.ok(yoga.y > 437 && running.y < 600);
  assert.equal(labels.filter((item) => item.label === 'Yoga 1h 30m').length, 1);
});

test('poster keeps its original summary layout for one sport', async (t) => {
  const labels = await posterLabels(t, {
    '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 },
    '2026-09-29': { type: 'yoga', name: 'Yoga', minutes: 60 },
  });
  assert.equal(
    labels.some((item) => item.label === 'Yoga 2h'),
    false,
  );
  assert.equal(labels.find((item) => item.label === '2h').x, 518);
});

test('all seven sport totals fit vertically inside the summary panel', async (t) => {
  const types = ['crossfit', 'yoga', 'running', 'cycling', 'swimming', 'weight', 'pilates'];
  const names = ['CrossFit', 'Yoga', 'Running', 'Cycling', 'Swimming', 'Weight', 'Pilates'];
  const keys = [
    '2026-09-28',
    '2026-09-29',
    '2026-09-30',
    '2026-10-01',
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
  ];
  const records = Object.fromEntries(
    keys.map((key, i) => [key, { type: types[i], name: names[i], minutes: 60 }]),
  );
  const labels = await posterLabels(t, records);
  const rows = labels.filter((item) => names.some((name) => item.label === `${name} 1h`));
  assert.equal(rows.length, 7);
  for (const row of rows) {
    assert.equal(row.x, 673);
    assert.ok(row.y >= 450 && row.y <= 600);
  }
});
