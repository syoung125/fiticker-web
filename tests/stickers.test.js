import test from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, STICKER_BACKGROUNDS, copySticker } from '../src/media/stickers.js';
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

test('every background option reaches the PNG renderer with matching text contrast', () => {
  const dates = weekDates(new Date(2026, 9, 1));
  for (const sticker of STICKERS) {
    for (const theme of Object.values(STICKER_BACKGROUNDS)) {
      const fills = [],
        textColors = [];
      const state = {};
      const ctx = new Proxy(state, {
        get(target, key) {
          if (key === 'measureText') return () => ({ width: 40 });
          if (key === 'fill') return () => fills.push(target.fillStyle);
          if (key === 'fillText') return () => textColors.push(target.fillStyle);
          return target[key] ?? (() => {});
        },
      });
      sticker.draw(ctx, dates, {}, theme);
      assert.deepEqual(fills, theme.background ? [theme.background] : []);
      assert.ok(textColors.includes(theme.ink));
      assert.ok(textColors.includes(theme.secondary));
    }
  }
});

test('square sticker combines week title, totals and all seven dates in a 1:1 image', () => {
  const sticker = STICKERS.find((item) => item.id === 'square');
  assert.equal(sticker.width, 1080);
  assert.equal(sticker.height, 1080);
  const labels = [];
  const ctx = new Proxy(
    {},
    {
      get(target, key) {
        if (key === 'measureText') return () => ({ width: 40 });
        if (key === 'fillText') return (text) => labels.push(text);
        return target[key] ?? (() => {});
      },
    },
  );
  sticker.draw(ctx, weekDates(new Date(2026, 9, 1)), {});
  assert.ok(labels.includes('2026년 10월 1주'));
  assert.ok(labels.includes('THIS WEEK'));
  assert.ok(labels.includes('workouts') && labels.includes('total time'));
  assert.ok(labels.includes('MON') && labels.includes('SUN'));
});

test('square overall and summary backgrounds render independently in every combination', () => {
  const square = STICKERS.find((item) => item.id === 'square');
  const dates = weekDates(new Date(2026, 9, 1));
  for (const outer of Object.values(STICKER_BACKGROUNDS)) {
    for (const summary of Object.values(STICKER_BACKGROUNDS)) {
      const fills = [],
        labels = [];
      const ctx = new Proxy(
        {},
        {
          get(target, key) {
            if (key === 'measureText') return () => ({ width: 40 });
            if (key === 'fill') return () => fills.push(target.fillStyle);
            if (key === 'fillText') return (text) => labels.push([text, target.fillStyle]);
            return target[key] ?? (() => {});
          },
        },
      );
      square.draw(ctx, dates, {}, outer, summary);
      assert.deepEqual(fills, [outer.background, summary.background].filter(Boolean));
      assert.ok(labels.some(([text, color]) => text === '2026년 10월 1주' && color === outer.ink));
      assert.ok(labels.some(([text, color]) => text === 'THIS WEEK' && color === summary.ink));
    }
  }
});
