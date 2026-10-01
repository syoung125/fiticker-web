import test from 'node:test';
import assert from 'node:assert/strict';
import { minuteOptions, splitDuration, wheelIndex } from '../src/domain/duration-picker.js';

test('minutes use five-minute steps with no duplicate 60-minute value', () => {
  assert.deepEqual(minuteOptions(null), [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
});
test('editing an existing arbitrary minute duration preserves its exact minute', () => {
  assert.deepEqual(splitDuration(67), { hours: 1, minutes: 7, entered: true });
  assert.deepEqual(minuteOptions(7), [0, 5, 7, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  assert.equal(minuteOptions(25).filter((n) => n === 25).length, 1);
});
test('missing duration remains distinct from explicitly selected zero', () => {
  assert.deepEqual(splitDuration(null), { hours: 0, minutes: 0, entered: false });
  assert.deepEqual(splitDuration(0), { hours: 0, minutes: 0, entered: true });
  assert.deepEqual(splitDuration(1439), { hours: 23, minutes: 59, entered: true });
});
test('scroll position selects nearest row and clamps overscroll', () => {
  assert.equal(wheelIndex(79, 12), 2);
  assert.equal(wheelIndex(-100, 12), 0);
  assert.equal(wheelIndex(1000, 12), 11);
});
