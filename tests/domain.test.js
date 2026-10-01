import test from 'node:test';
import assert from 'node:assert/strict';
import {
  weekDates,
  dateKey,
  weekLabel,
  summarize,
  duration,
  validateRecord,
} from '../src/domain/workouts.js';
test('week is Monday to Sunday across months', () => {
  const dates = weekDates(new Date(2026, 9, 1));
  assert.equal(dateKey(dates[0]), '2026-09-28');
  assert.equal(dateKey(dates[6]), '2026-10-04');
  assert.equal(weekLabel(dates[0]), '2026년 10월 1주');
});
test('Sunday and year boundaries stay in correct week', () => {
  assert.equal(dateKey(weekDates(new Date(2027, 0, 3))[0]), '2026-12-28');
});
test('missing duration counts workout, other weeks excluded', () => {
  const records = {
    '2026-10-01': { minutes: 60 },
    '2026-10-02': { minutes: null },
    '2026-10-03': { minutes: 90 },
    '2026-10-05': { minutes: 200 },
  };
  assert.deepEqual(summarize(weekDates(new Date(2026, 9, 1)), records), { count: 3, minutes: 150 });
  assert.equal(duration(150), '2h 30m');
  assert.equal(duration(0), '0m');
});
test('invalid duration and empty custom names rejected', () => {
  assert.throws(() => validateRecord({ type: 'other', name: ' ', hours: '', mins: '', memo: '' }));
  assert.throws(() => validateRecord({ type: 'yoga', hours: '-1', mins: '0', memo: '' }));
  assert.throws(() => validateRecord({ type: 'yoga', hours: '0', mins: '60', memo: '' }));
  assert.equal(validateRecord({ type: 'yoga', hours: '', mins: '', memo: '' }).minutes, null);
});
