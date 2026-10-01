import test from 'node:test';
import assert from 'node:assert/strict';
import { updateRecord } from '../src/domain/record-actions.js';

test('one sport selection creates a complete record without optional details', () => {
  assert.deepEqual(updateRecord(undefined, 'type', { type: 'yoga' }), {
    type: 'yoga',
    name: 'Yoga',
    minutes: null,
    memo: '',
    photo: null,
  });
  assert.throws(() => updateRecord(undefined, 'type', { type: 'other', name: ' ' }));
});

test('single-action edits preserve every unrelated field and do not mutate the record', () => {
  const original = { type: 'yoga', name: 'Yoga', minutes: 45, memo: '좋았어', photo: 'photo-data' };
  assert.deepEqual(updateRecord(original, 'time', { hours: '1', mins: '30' }), {
    ...original,
    minutes: 90,
  });
  assert.deepEqual(updateRecord(original, 'time', { hours: '', mins: '' }), {
    ...original,
    minutes: null,
  });
  assert.deepEqual(updateRecord(original, 'photo', { photo: null }), { ...original, photo: null });
  assert.deepEqual(updateRecord(original, 'memo', { memo: ' 새 메모 ' }), {
    ...original,
    memo: '새 메모',
  });
  assert.deepEqual(updateRecord(original, 'type', { type: 'running' }), {
    ...original,
    type: 'running',
    name: 'Running',
  });
  assert.equal(original.minutes, 45);
  assert.throws(() => updateRecord(original, 'time', { hours: '24' }));
});
