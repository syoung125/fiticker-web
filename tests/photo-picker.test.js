import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoPicker } from '../src/ui/photo-picker.js';

const record = () => ({ type: 'yoga', name: 'Yoga', minutes: 60, memo: '메모', photo: null });
test('direct photo attachment saves immediately and preserves other edits made while processing', async () => {
  const records = { day: record() };
  let finish;
  const picker = createPhotoPicker({
    records,
    onChange() {},
    notify() {},
    preparePhoto: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = picker.attach('day', {});
  records.day = { ...records.day, minutes: 90 };
  finish('new-photo');
  await pending;
  assert.deepEqual(records.day, { ...record(), minutes: 90, photo: 'new-photo' });
});
test('a late photo never replaces a newer photo or resurrects a deleted record', async () => {
  const records = { day: record() };
  const jobs = [];
  const picker = createPhotoPicker({
    records,
    onChange() {},
    notify() {},
    preparePhoto: () => new Promise((resolve) => jobs.push(resolve)),
  });
  const first = picker.attach('day', {});
  const second = picker.attach('day', {});
  jobs[1]('new');
  await second;
  jobs[0]('old');
  await first;
  assert.equal(records.day.photo, 'new');
  const deleted = picker.attach('day', {});
  delete records.day;
  picker.invalidate('day');
  records.day = record();
  jobs[2]('deleted-record-photo');
  await deleted;
  assert.equal(records.day.photo, null);
});
