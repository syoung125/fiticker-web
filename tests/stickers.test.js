import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STICKERS,
  STICKER_BACKGROUNDS,
  copySticker,
  stickerDimensions,
  matchesStickerCategory,
  createStickers,
  DEFAULT_STICKER_BACKGROUNDS,
} from '../src/media/stickers.js';
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

test('calendar time toggle hides daily times without removing square summary totals', () => {
  const previous = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        fillText() {},
        getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      }),
    }),
  };
  try {
    const dates = weekDates(new Date(2026, 9, 1));
    const records = { '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 } };
    for (const id of ['calendar', 'square']) {
      const sticker = STICKERS.find((item) => item.id === id);
      for (const visible of [true, false]) {
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
        sticker.draw(ctx, dates, records, undefined, undefined, visible);
        assert.equal(
          labels.filter((text) => text === '1h').length,
          (id === 'square' ? 1 : 0) + Number(visible),
        );
        assert.ok(labels.includes('MON') && labels.includes('28'));
      }
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test('hidden daily times remove export space while square keeps equal sides', () => {
  assert.deepEqual(stickerDimensions('calendar', false), { width: 948, height: 240 });
  assert.equal(
    stickerDimensions('calendar', true).height - stickerDimensions('calendar', false).height,
    60,
  );
  const square = stickerDimensions('square', false);
  assert.equal(square.width, square.height);
  assert.equal(stickerDimensions('square', true).height - square.height, 60);
  assert.ok(674 + stickerDimensions('calendar', false).height < square.height);
});

test('gallery includes nine unique stickers in their matching categories', () => {
  assert.equal(STICKERS.length, 9);
  assert.equal(new Set(STICKERS.map((item) => item.id)).size, 9);
  assert.equal(STICKERS.filter((item) => matchesStickerCategory(item, 'all')).length, 9);
  for (const category of ['summary', 'calendar', 'combined']) {
    assert.equal(
      STICKERS.filter((item) => matchesStickerCategory(item, category)).length,
      { summary: 2, calendar: 5, combined: 2 }[category],
    );
  }
});

test('all designs export PNG with independent options and compact dimensions', async () => {
  const previous = globalThis.document;
  globalThis.document = {
    fonts: { load: async () => [] },
    createElement: () => {
      const ctx = new Proxy(
        {},
        {
          get(target, key) {
            if (key === 'measureText') return () => ({ width: 40 });
            if (key === 'getImageData')
              return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
            return target[key] ?? (() => {});
          },
        },
      );
      return {
        getContext: () => ctx,
        toBlob: (callback) => callback(new Blob(['png'], { type: 'image/png' })),
      };
    },
  };
  try {
    const times = Object.fromEntries(STICKERS.map((item) => [item.id, false]));
    const result = await createStickers(
      weekDates(new Date(2026, 9, 1)),
      {
        '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 },
      },
      DEFAULT_STICKER_BACKGROUNDS,
      times,
    );
    assert.equal(result.length, 9);
    for (const sticker of result) {
      assert.equal(sticker.blob.type, 'image/png');
      assert.deepEqual(
        { width: sticker.width, height: sticker.height },
        stickerDimensions(sticker.id, false),
      );
      if (sticker.category !== 'summary' && sticker.supportsDailyTime !== false)
        assert.ok(sticker.height < stickerDimensions(sticker.id, true).height);
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test('compact type design shows weekly metrics and dots only on recorded days', () => {
  const compact = STICKERS.find((item) => item.id === 'combined-compact');
  const labels = [],
    dots = [];
  const ctx = new Proxy(
    {},
    {
      get(target, key) {
        if (key === 'measureText') return () => ({ width: 40 });
        if (key === 'fillText') return (value) => labels.push(value);
        if (key === 'arc') return (...args) => dots.push(args);
        return target[key] ?? (() => {});
      },
    },
  );
  compact.draw(
    ctx,
    weekDates(new Date(2026, 9, 1)),
    {
      '2026-09-28': { type: 'yoga', minutes: 60 },
      '2026-09-30': { type: 'running', minutes: 30 },
    },
    STICKER_BACKGROUNDS.transparentWhite,
  );
  assert.ok(labels.includes('2') && labels.includes('1h 30m'));
  assert.equal(dots.length, 2);
  assert.equal(compact.summaryBackgroundKey, undefined);
  assert.equal(compact.defaultBackground, 'transparentWhite');
});

test('mini summary is square and shows zero and recorded totals', () => {
  const widget = STICKERS.find((item) => item.id === 'summary-widget');
  assert.deepEqual(stickerDimensions(widget.id), { width: 480, height: 480 });
  const dates = weekDates(new Date(2026, 9, 1));
  for (const [records, count, total] of [
    [{}, '0', '0m'],
    [{ '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 75 } }, '1', '1h 15m'],
  ]) {
    const labels = [];
    const ctx = new Proxy(
      {},
      {
        get(target, key) {
          if (key === 'measureText') return () => ({ width: 40 });
          if (key === 'fillText') return (value) => labels.push(value);
          return target[key] ?? (() => {});
        },
      },
    );
    widget.draw(ctx, dates, records, STICKER_BACKGROUNDS.lime);
    assert.ok(labels.includes(count) && labels.includes(total));
    assert.ok(labels.includes('workouts') && labels.includes('total time'));
  }
});

test('compact calendar has weekdays but no date numbers or week heading', () => {
  const sticker = STICKERS.find((item) => item.id === 'calendar-compact');
  const labels = [];
  const ctx = new Proxy(
    {},
    {
      get(target, key) {
        if (key === 'measureText') return () => ({ width: 40 });
        if (key === 'fillText') return (value) => labels.push(value);
        return target[key] ?? (() => {});
      },
    },
  );
  sticker.draw(ctx, weekDates(new Date(2026, 9, 1)), {}, STICKER_BACKGROUNDS.transparent);
  assert.deepEqual(
    labels.filter((value) => value !== '—'),
    ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
  );
  assert.equal(
    stickerDimensions(sticker.id, true).height - stickerDimensions(sticker.id, false).height,
    44,
  );
});
