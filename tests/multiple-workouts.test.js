import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayRecords,
  activeDays,
  summarize,
  summarizeBySport,
  weekDates,
} from '../src/domain/workouts.js';
import { loadSessionRecords, saveSessionRecords } from '../src/domain/session-records.js';
const dates = weekDates(new Date(2026, 9, 5));
const run = { type: 'running', name: 'Running', minutes: 30, memo: '5km', photo: null };
test('multiple sessions including repeated sports count separately but progress counts dates', () => {
  const records = {
    '2026-10-05': [run, { ...run, minutes: 20 }],
    '2026-10-06': { type: 'weight', name: 'Weight', minutes: 60, memo: '' },
  };
  assert.deepEqual(summarize(dates, records), { count: 3, minutes: 110 });
  assert.equal(activeDays(dates, records), 2);
  assert.equal(dayRecords(records, '2026-10-05').length, 2);
  assert.deepEqual(summarizeBySport(dates, records), [
    { name: 'Running', minutes: 50 },
    { name: 'Weight', minutes: 60 },
  ]);
});
test('cache retains multiple sessions and old single records, ignores only invalid sessions', () => {
  let json;
  const storage = { getItem: () => json, setItem: (_, v) => (json = v) };
  saveSessionRecords({ '2026-10-05': [run, { ...run, memo: '저녁' }], '2026-10-06': run }, storage);
  const loaded = loadSessionRecords(storage);
  assert.equal(dayRecords(loaded, '2026-10-05').length, 2);
  assert.equal(dayRecords(loaded, '2026-10-05')[1].memo, '저녁');
  assert.deepEqual(loaded['2026-10-06'], run);
  json = JSON.stringify({ '2026-10-05': [run, { type: 'invalid' }] });
  assert.equal(dayRecords(loadSessionRecords(storage), '2026-10-05').length, 1);
});

test('every calendar export includes all sessions, fits memos and keeps progress to active days', async () => {
  const { createStickers } = await import('../src/media/stickers.js');
  const old = globalThis.document;
  const canvases = [];
  globalThis.document = {
    fonts: { load: async () => [] },
    createElement() {
      const canvas = {
        labels: [],
        width: 0,
        height: 0,
        toBlob(cb) {
          this.exported = true;
          cb(new Blob(['png']));
        },
      };
      const ctx = new Proxy(
        {},
        {
          get(target, key) {
            if (key === 'measureText') return (v) => ({ width: Array.from(v).length * 11 });
            if (key === 'getImageData')
              return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
            if (key === 'fillText') return (value, x, y) => canvas.labels.push({ value, x, y });
            return target[key] ?? (() => {});
          },
        },
      );
      canvas.getContext = () => ctx;
      canvases.push(canvas);
      return canvas;
    },
  };
  try {
    const records = {
      '2026-10-05': [
        run,
        { ...run, type: 'weight', name: 'Weight', minutes: 60, memo: '하체\n12세트' },
        { ...run, minutes: null, memo: '저녁' },
      ],
    };
    for (const showTime of [true, false]) {
      canvases.length = 0;
      const visibility = Object.fromEntries(
        ['calendar', 'calendar-minimal', 'calendar-ticket', 'square', 'combined-poster'].map(
          (id) => [id, showTime],
        ),
      );
      const stickers = await createStickers(dates, records, undefined, visibility);
      const outputs = canvases.filter((c) => c.exported);
      stickers.forEach((sticker, i) => {
        const labels = outputs[i].labels;
        if (
          ['calendar', 'calendar-minimal', 'calendar-ticket', 'combined-poster', 'square'].includes(
            sticker.id,
          )
        ) {
          for (const memo of ['5km', '하체', '12세트', '저녁'])
            assert.ok(
              labels.some((l) => l.value === memo),
              `${sticker.id}: ${memo}`,
            );
          if (sticker.id !== 'square')
            assert.ok(
              labels.every((l) => l.y < sticker.height),
              `${sticker.id} fits`,
            );
        }
        if (sticker.id === 'summary-progress')
          assert.ok(labels.some((l) => l.value === '1 / 7 days'));
        if (sticker.id === 'square') assert.equal(sticker.height, 1080);
      });
    }
  } finally {
    globalThis.document = old;
  }
});
