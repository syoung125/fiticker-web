import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadCustomSports,
  rememberCustomSport,
  CUSTOM_SPORTS_KEY,
} from '../src/domain/custom-sports.js';
import { validEmoji, recordIcon } from '../src/domain/workouts.js';
import { updateRecord } from '../src/domain/record-actions.js';
import { saveSessionRecords, loadSessionRecords } from '../src/domain/session-records.js';

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('custom names and emoji survive reload, deduplicate by name, and preserve older records', () => {
  const cache = storage(),
    sports = [];
  let record = updateRecord(undefined, 'type', { type: 'other', name: ' 배드민턴 ', icon: '🏸' });
  record = updateRecord(record, 'time', { hours: '1', mins: '' });
  record = updateRecord(record, 'memo', { memo: '완료' });
  assert.equal(rememberCustomSport(sports, record, cache), true);
  assert.deepEqual(loadCustomSports(cache), [{ name: '배드민턴', icon: '🏸' }]);
  saveSessionRecords({ '2026-10-01': record }, cache);
  assert.deepEqual(loadSessionRecords(cache)['2026-10-01'], record);
  rememberCustomSport(sports, { name: '배드민턴', icon: '🔥' }, cache);
  assert.deepEqual(loadCustomSports(cache), [{ name: '배드민턴', icon: '🔥' }]);
  assert.equal(recordIcon(record), '🏸');
  const changed = updateRecord(record, 'type', { type: 'yoga' });
  assert.equal(recordIcon(changed), '🧘');
  assert.equal(changed.icon, undefined);
  assert.equal(changed.minutes, 60);
  assert.equal(changed.memo, '완료');
  assert.equal(recordIcon({ type: 'other', name: '옛 기록' }), '✳');
});
test('emoji validation accepts compound emoji and safely rejects text and multiple emoji', () => {
  for (const value of ['🏸', '✳️', '🧗🏽‍♀️', '🇰🇷', '1️⃣']) assert.ok(validEmoji(value));
  for (const value of ['', 'abc', '🏸🥊', '<img>', 'a🏸']) assert.equal(validEmoji(value), false);
  assert.throws(() =>
    updateRecord(undefined, 'type', { type: 'other', name: '복싱', icon: 'abc' }),
  );
});
test('invalid storage items and blocked persistence do not break custom sport selection', () => {
  const cache = storage();
  cache.setItem(
    CUSTOM_SPORTS_KEY,
    JSON.stringify([null, {}, { name: '', icon: '🏸' }, { name: '복싱', icon: '🥊' }]),
  );
  assert.deepEqual(loadCustomSports(cache), [{ name: '복싱', icon: '🥊' }]);
  const blocked = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  };
  assert.deepEqual(loadCustomSports(blocked), []);
  const sports = [];
  assert.equal(rememberCustomSport(sports, { name: '복싱', icon: '🥊' }, blocked), false);
  assert.deepEqual(sports, [{ name: '복싱', icon: '🥊' }]);
});

test('custom emoji reaches each calendar sticker renderer', async () => {
  const { STICKERS, STICKER_BACKGROUNDS } = await import('../src/media/stickers.js');
  const { weekDates, dateKey } = await import('../src/domain/workouts.js');
  const previous = globalThis.document;
  const symbols = [];
  const context = () =>
    new Proxy(
      {},
      {
        get(target, key) {
          if (key === 'measureText') return (text) => ({ width: text.length * 10 });
          if (key === 'fillText') return (text) => symbols.push(text);
          if (key === 'getImageData')
            return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
          return target[key] ?? (() => {});
        },
      },
    );
  globalThis.document = { createElement: () => ({ getContext: context }) };
  try {
    const dates = weekDates(new Date(2026, 9, 1));
    const records = {
      [dateKey(dates[0])]: updateRecord(undefined, 'type', {
        type: 'other',
        name: '배드민턴',
        icon: '🏸',
      }),
    };
    for (const id of [
      'calendar',
      'calendar-minimal',
      'calendar-ticket',
      'square',
      'combined-poster',
    ]) {
      symbols.length = 0;
      STICKERS.find((item) => item.id === id).draw(
        context(),
        dates,
        records,
        STICKER_BACKGROUNDS.white,
      );
      assert.ok(symbols.includes('🏸'), id);
      assert.ok(!symbols.includes('✳'), id);
    }
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});
