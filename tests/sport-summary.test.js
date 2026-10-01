import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeBySport, weekDates } from '../src/domain/workouts.js';
const dates = weekDates(new Date(2026, 9, 1));
test('combines repeated sports and excludes other weeks', () => {
  const records = {
    '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 },
    '2026-09-29': { type: 'running', name: 'Running', minutes: 45 },
    '2026-10-01': { type: 'yoga', name: 'Yoga', minutes: 30 },
    '2026-10-05': { type: 'cycling', name: 'Cycling', minutes: 100 },
  };
  assert.deepEqual(summarizeBySport(dates, records), [
    { name: 'Yoga', minutes: 90 },
    { name: 'Running', minutes: 45 },
  ]);
});
test('single sport stays a single group even with several workouts', () => {
  assert.equal(
    summarizeBySport(dates, {
      '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 },
      '2026-09-29': { type: 'yoga', name: 'Yoga', minutes: 30 },
    }).length,
    1,
  );
});
test('custom sports are grouped by their names', () => {
  assert.deepEqual(
    summarizeBySport(dates, {
      '2026-09-28': { type: 'other', name: '테니스', minutes: 60 },
      '2026-09-29': { type: 'other', name: '등산', minutes: 90 },
      '2026-09-30': { type: 'other', name: '테니스', minutes: 30 },
    }),
    [
      { name: '테니스', minutes: 90 },
      { name: '등산', minutes: 90 },
    ],
  );
});
test('missing time is distinct from zero and mixed entries sum known time', () => {
  assert.deepEqual(
    summarizeBySport(dates, {
      '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: null },
      '2026-09-29': { type: 'running', name: 'Running', minutes: 0 },
      '2026-09-30': { type: 'cycling', name: 'Cycling', minutes: null },
      '2026-10-01': { type: 'cycling', name: 'Cycling', minutes: 45 },
    }),
    [
      { name: 'Yoga', minutes: null },
      { name: 'Running', minutes: 0 },
      { name: 'Cycling', minutes: 45 },
    ],
  );
});
