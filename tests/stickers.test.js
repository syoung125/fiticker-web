import test from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, copySticker } from '../src/media/stickers.js';
import { weekDates } from '../src/domain/workouts.js';

test('summary retains its card background while calendar is transparent', () => {
  const fills = [],
    labels = [];
  const ctx = new Proxy(
    {},
    {
      get(target, key) {
        if (key === 'measureText') return () => ({ width: 40 });
        if (key === 'fill') return () => fills.push('background');
        if (key === 'fillText') return (text) => labels.push(text);
        return target[key] ?? (() => {});
      },
    },
  );
  const dates = weekDates(new Date(2026, 9, 1));
  STICKERS[0].draw(ctx, dates, {});
  assert.equal(fills.length, 1);
  fills.length = 0;
  labels.length = 0;
  STICKERS[1].draw(ctx, dates, {});
  assert.equal(fills.length, 0);
  assert.ok(labels.includes('MON') && labels.includes('SUN'));
  assert.equal(labels.filter((text) => text === '—').length, 7);
});
test('copy writes an actual PNG immediately during the user gesture', async () => {
  const png = new Blob(['image'], { type: 'image/png' });
  let written;
  class Item {
    constructor(data) {
      this.data = data;
    }
  }
  const promise = copySticker(
    png,
    {
      write(items) {
        written = items;
        return Promise.resolve();
      },
    },
    Item,
  );
  assert.equal(written[0].data['image/png'], png);
  await promise;
  await assert.rejects(copySticker(png, {}, Item));
});
