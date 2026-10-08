import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPACT_STICKER } from '../src/media/compact-sticker.js';
import { weekDates } from '../src/domain/workouts.js';
test('simple sticker shows each session name under one day dot and grows to fit', () => {
  const dates = weekDates(new Date(2026, 9, 5));
  const records = {
    '2026-10-05': [
      { type: 'running', name: 'Running', minutes: 30 },
      { type: 'weight', name: 'Weight', minutes: 60 },
    ],
    '2026-10-06': { type: 'yoga', name: 'Yoga', minutes: null },
  };
  const labels = [],
    dots = [];
  const ctx = new Proxy(
    {},
    {
      get(t, k) {
        if (k === 'measureText') return (v) => ({ width: v.length * 10 });
        if (k === 'fillText') return (v, x, y) => labels.push({ v, x, y });
        if (k === 'arc') return (...a) => dots.push(a);
        return t[k] ?? (() => {});
      },
    },
  );
  COMPACT_STICKER.draw(ctx, dates, records, { background: '#fff', ink: '#000', secondary: '#555' });
  assert.equal(dots.length, 2);
  const run = labels.find((l) => l.v === 'Running'),
    weight = labels.find((l) => l.v === 'Weight');
  assert.ok(run && weight);
  assert.equal(run.x, weight.x);
  assert.ok(weight.y > run.y);
  assert.ok(labels.some((l) => l.v === 'Yoga'));
  const multiple = COMPACT_STICKER.dimensions(false, records, dates);
  const single = COMPACT_STICKER.dimensions(
    false,
    { '2026-10-05': records['2026-10-05'][0] },
    dates,
  );
  assert.ok(multiple.height > single.height);
  assert.ok(weight.y + 24 + 20 < multiple.height);
});
