import test from 'node:test';
import assert from 'node:assert/strict';
import { summaryModel, drawSummary, SUMMARY_WIDTH, SUMMARY_HEIGHT } from '../src/media/summary.js';
import { weekDates } from '../src/domain/workouts.js';
function context() {
  const labels = [];
  const state = { font: '20px sans-serif', textAlign: 'left' };
  const ctx = new Proxy(state, {
    get(target, key) {
      if (key === 'measureText')
        return (value) => ({
          width:
            Array.from(value).length * parseFloat(target.font.match(/(\d+(?:\.\d+)?)px/)[1]) * 0.65,
        });
      if (key === 'fillText')
        return (text, x, y) =>
          labels.push({ text, x, y, align: target.textAlign, font: target.font });
      return key in target ? target[key] : () => {};
    },
  });
  return { ctx, labels };
}
test('single shared model has stable sport names, durations and omission handling', () => {
  const model = summaryModel(weekDates(new Date(2026, 9, 1)), {
    '2026-09-28': { type: 'yoga', name: 'Yoga', minutes: 60 },
    '2026-09-29': { type: 'running', name: 'Running', minutes: 45 },
  });
  assert.equal(model.total, '1h 45m');
  assert.deepEqual(model.sports, [
    { name: 'Yoga', time: '1h' },
    { name: 'Running', time: '45m' },
  ]);
});
test('seven sport rows stay aligned with no text overlapping its neighbor', () => {
  const { ctx, labels } = context();
  drawSummary(ctx, {
    count: 7,
    total: '167h 53m',
    sports: Array.from({ length: 7 }, (_, i) => ({
      name: `아주긴운동이름을기록하는테스트${i}`,
      time: '23h 59m',
    })),
  });
  const names = labels.filter((l) => l.align === 'left' && l.x === 666);
  const times = labels.filter((l) => l.align === 'right' && l.x === 914);
  assert.equal(names.length, 7);
  assert.equal(times.length, 7);
  for (let i = 0; i < 7; i++) {
    assert.equal(names[i].y, times[i].y);
    assert.ok(names[i].y > 20 && names[i].y < SUMMARY_HEIGHT - 15);
    ctx.font = names[i].font;
    const nameEnd = names[i].x + ctx.measureText(names[i].text).width;
    ctx.font = times[i].font;
    const timeStart = times[i].x - ctx.measureText(times[i].text).width;
    assert.ok(nameEnd + 12 <= timeStart);
  }
  const total = labels.find((l) => l.text === '167h 53m');
  ctx.font = total.font;
  assert.ok(total.x + ctx.measureText(total.text).width / 2 < 632);
  assert.equal(SUMMARY_WIDTH, 948);
});

test('editor and exported summary use identical text coordinates and accessible full names', async () => {
  const { renderSummary } = await import('../src/ui/render-summary.js');
  const model = {
    count: 2,
    total: '1h 45m',
    sports: [
      { name: 'Yoga', time: '1h' },
      { name: 'Running', time: '45m' },
    ],
  };
  const editor = context(),
    exported = context();
  const attrs = {};
  const canvas = {
    getContext: () => editor.ctx,
    setAttribute: (key, value) => {
      attrs[key] = value;
    },
  };
  renderSummary(canvas, model);
  drawSummary(exported.ctx, model, 66, 393);
  const rounded = (label) => ({ ...label, x: +label.x.toFixed(6), y: +label.y.toFixed(6) });
  assert.deepEqual(
    editor.labels.map(rounded),
    exported.labels.map((label) => rounded({ ...label, x: label.x - 66, y: label.y - 393 })),
  );
  assert.equal(canvas.width, SUMMARY_WIDTH);
  assert.match(attrs['aria-label'], /Yoga 1h, Running 45m/);
});
