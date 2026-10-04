import test from 'node:test';
import { memoLines } from '../src/media/memo.js';
import assert from 'node:assert/strict';
import {
  STICKERS,
  STICKER_BACKGROUNDS,
  stickerDimensions,
  createStickers,
} from '../src/media/stickers.js';
import { weekDates, dateKey } from '../src/domain/workouts.js';

test('calendar and ticket memos wrap within exports and remain visible with times hidden', async () => {
  const previous = globalThis.document;
  function context(labels = []) {
    return new Proxy(
      {},
      {
        get(target, key) {
          if (key === 'measureText')
            return (value) => ({
              width:
                Array.from(value).length *
                (parseFloat(target.font?.match(/([\d.]+)px/)?.[1]) || 21),
            });
          if (key === 'getImageData')
            return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
          if (key === 'fillText')
            return (value, x, y) =>
              labels.push({ value, x, y, font: target.font, color: target.fillStyle });
          return target[key] ?? (() => {});
        },
      },
    );
  }
  globalThis.document = {
    fonts: { load: async () => [] },
    createElement: () => ({
      getContext: () => context(),
      toBlob: (callback) => callback(new Blob(['png'], { type: 'image/png' })),
    }),
  };
  try {
    assert.deepEqual(memoLines('첫 줄\n\n둘째 줄', 234, 21), ['첫 줄', '', '둘째 줄']);
    const dates = weekDates(new Date(2026, 9, 1));
    const memo = '오늘도운동완료무리하지않고꾸준하게천천히운동하기';
    const records = Object.fromEntries(
      dates.map((date) => [dateKey(date), { type: 'yoga', name: 'Yoga', minutes: 60, memo }]),
    );
    for (const id of ['calendar', 'calendar-minimal', 'calendar-ticket']) {
      const sticker = STICKERS.find((item) => item.id === id);
      for (const showTime of [true, false]) {
        const labels = [];
        sticker.draw(
          context(labels),
          dates,
          records,
          STICKER_BACKGROUNDS.white,
          undefined,
          showTime,
        );
        const notes = labels.filter(
          (label) => /[가-힣]/.test(label.value) && !label.value.includes('2026'),
        );
        assert.equal(notes.map((label) => label.value).join(''), memo.repeat(7));
        const dimensions = stickerDimensions(id, showTime, records, dates);
        assert.ok(dimensions.height > stickerDimensions(id, showTime).height);
        assert.ok(
          notes.every((label) => label.y + (id === 'calendar' ? 24 : 0) < dimensions.height),
        );
        if (id === 'calendar-ticket') {
          const sport = labels.find((label) => label.value === 'Yoga');
          assert.equal(notes[0].x, sport.x);
          assert.ok(notes[0].y > sport.y);
        } else if (showTime) {
          const time = labels.find((label) => label.value === '1h');
          const reference =
            id === 'calendar-minimal' ? labels.find((label) => label.value === 'MON') : time;
          assert.equal(notes[0].font, reference.font);
          assert.equal(notes[0].color, reference.color);
          assert.equal(notes[0].x, time.x);
          assert.ok(notes[0].y > time.y);
        }
      }
    }
    const exported = await createStickers(dates, records);
    for (const id of ['calendar', 'calendar-minimal', 'calendar-ticket']) {
      const sticker = exported.find((item) => item.id === id);
      assert.equal(sticker.height, stickerDimensions(id, true, records, dates).height);
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});
