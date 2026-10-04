import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSessionRecords,
  saveSessionRecords,
  SESSION_KEY,
} from '../src/domain/session-records.js';
import { updateRecord } from '../src/domain/record-actions.js';

function storage() {
  const data = new Map();
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('session cache restores records across reloads and persists field clearing and deletion', () => {
  const cache = storage();
  const records = loadSessionRecords(cache);
  records['2026-10-01'] = {
    type: 'yoga',
    name: 'Yoga',
    minutes: 75,
    memo: '첫 줄\n둘째 줄',
    photo: null,
  };
  records['2026-10-05'] = { type: 'running', name: 'Running', minutes: 0, memo: '', photo: null };
  assert.equal(saveSessionRecords(records, cache), true);
  const restored = loadSessionRecords(cache);
  assert.deepEqual(restored, records);
  restored['2026-10-01'] = updateRecord(restored['2026-10-01'], 'time', { hours: '', mins: '' });
  saveSessionRecords(restored, cache);
  assert.equal(loadSessionRecords(cache)['2026-10-01'].minutes, null);
  assert.equal(loadSessionRecords(cache)['2026-10-01'].memo, '첫 줄\n둘째 줄');
  delete restored['2026-10-01'];
  saveSessionRecords(restored, cache);
  assert.equal(loadSessionRecords(cache)['2026-10-01'], undefined);
  assert.equal(loadSessionRecords(cache)['2026-10-05'].minutes, 0);
});
test('bad cache and unavailable storage never prevent recording', () => {
  const cache = storage();
  cache.setItem(SESSION_KEY, '{broken');
  assert.equal(Object.keys(loadSessionRecords(cache)).length, 0);
  cache.setItem(
    SESSION_KEY,
    JSON.stringify({
      '2026-10-01': { type: 'unknown', minutes: 60 },
      '2026-10-02': { type: 'yoga', minutes: -1 },
      '2026-10-03': { type: 'yoga', name: 'Yoga', minutes: null, memo: '' },
    }),
  );
  assert.deepEqual(Object.keys(loadSessionRecords(cache)), ['2026-10-03']);
  const blocked = {
    getItem() {
      throw Error('blocked');
    },
    setItem() {
      throw Error('full');
    },
  };
  assert.equal(Object.keys(loadSessionRecords(blocked)).length, 0);
  assert.equal(saveSessionRecords({}, blocked), false);
});
