import { memoLines, drawMemo, calendarMemoHeight } from './memo.js';
import { SMALL_STICKERS } from './small-stickers.js';
import { COMPACT_STICKER } from './compact-sticker.js';
import { DAYS, TYPES, dateKey, weekLabel, duration } from '../domain/workouts.js';
import { createIconRenderer } from './icon.js';
import { summaryModel } from './summary.js';

const FONT = '"Manrope", "Noto Sans KR", sans-serif';
function text(
  ctx,
  value,
  x,
  y,
  size,
  color,
  weight = 500,
  align = 'left',
  maxWidth,
  baseline = 'alphabetic',
) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  while (maxWidth && ctx.measureText(value).width > maxWidth && size > 14) {
    ctx.font = `${weight} ${--size}px ${FONT}`;
  }
  ctx.fillText(value, x, y);
}
function panel(ctx, width, height, theme, radius = 28) {
  if (!theme.background) return;
  ctx.fillStyle = theme.background;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fill();
}
function line(ctx, x, y, width, theme, dashed = false) {
  ctx.save();
  ctx.strokeStyle = theme.divider;
  ctx.lineWidth = 2;
  ctx.setLineDash(dashed ? [8, 8] : []);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();
  ctx.restore();
}
function ticketMemoHeight(dates, records) {
  return dates.reduce(
    (sum, date) => sum + memoLines(records[dateKey(date)]?.memo, 234, 21).length * 28,
    0,
  );
}
function calendar(ctx, dates, records, theme, style, showTime) {
  const icon = createIconRenderer(ctx);
  const height =
    style === 'ticket'
      ? 750 + ticketMemoHeight(dates, records)
      : style === 'poster'
        ? showTime
          ? 596
          : 536
        : showTime
          ? 320
          : 260;
  const memoHeight = style === 'poster' ? calendarMemoHeight(dates, records, 116, 21, 28) : 0;
  const width = style === 'ticket' ? 520 : 1000;
  panel(ctx, width, height + memoHeight, theme, style === 'poster' ? 0 : 24);
  text(ctx, weekLabel(dates[0]), 32, 46, 23, theme.secondary, 600);
  if (style === 'ticket') {
    text(ctx, 'WEEK / LOG', 32, 103, 39, theme.ink, 800);
    let y = 145;
    dates.forEach((date, i) => {
      const record = records[dateKey(date)];
      line(ctx, 32, y, 456, theme, true);
      const rowText = (value, x, size, color, weight = 500, align = 'left', maxWidth) =>
        text(ctx, value, x, y + 40, size, color, weight, align, maxWidth, 'middle');
      rowText(DAYS[i], 34, 18, theme.secondary, 700);
      rowText(String(date.getDate()).padStart(2, '0'), 108, 35, theme.ink, 600);
      if (record) icon(TYPES[record.type].icon, 205, y + 40, 39, theme.ink);
      let nameWidth = 234;
      if (showTime && record?.minutes != null) {
        const time = duration(record.minutes);
        rowText(time, 488, 21, theme.secondary, 500, 'right', 110);
        nameWidth -= ctx.measureText(time).width + 16;
      }
      let name = record?.name ?? 'REST DAY';
      ctx.font = `500 26px ${FONT}`;
      if (ctx.measureText(name).width > nameWidth) {
        const letters = Array.from(name);
        while (letters.length && ctx.measureText(letters.join('') + '…').width > nameWidth)
          letters.pop();
        name = letters.join('') + '…';
      }
      rowText(name, 254, 26, theme.ink);
      drawMemo(ctx, record?.memo, 254, y + 84, 234, 21, 28, theme.secondary, 'left');
      y += 80 + memoLines(record?.memo, 234, 21).length * 28;
    });
  } else {
    const poster = style === 'poster';
    if (poster) {
      const { count, total } = summaryModel(dates, records);
      text(ctx, String(count), 266, 186, 112, theme.ink, 800, 'center', 420);
      text(ctx, total, 734, 186, 96, theme.ink, 800, 'center', 420);
      text(ctx, 'WORKOUTS', 266, 236, 23, theme.secondary, 600, 'center');
      text(ctx, 'TOTAL TIME', 734, 236, 23, theme.secondary, 600, 'center');
      line(ctx, 32, 280, 936, theme);
    }
    const offset = poster ? 240 : 0;
    dates.forEach((date, i) => {
      const x = 32 + (936 / 7) * (i + 0.5),
        record = records[dateKey(date)];
      text(ctx, DAYS[i], x, offset + 98, 18, theme.secondary, 600, 'center');
      text(
        ctx,
        String(date.getDate()).padStart(2, '0'),
        x,
        offset + 147,
        poster ? 45 : 34,
        theme.ink,
        700,
        'center',
      );
      if (record) icon(TYPES[record.type].icon, x, offset + 202, 47, theme.ink);
      else text(ctx, '—', x, offset + 211, 26, theme.secondary, 500, 'center');
      if (showTime && record?.minutes != null)
        text(ctx, duration(record.minutes), x, offset + 278, 21, theme.secondary, 500, 'center');
      if (poster)
        drawMemo(ctx, record?.memo, x, showTime ? 556 : 496, 116, 21, 28, theme.secondary);
    });
  }
}
const styles = ['ticket', 'poster'];
export const EXTRA_STICKERS = styles.map((style) => ({
  id: style === 'poster' ? 'combined-poster' : 'calendar-ticket',
  category: style === 'poster' ? 'combined' : 'calendar',
  title: style === 'poster' ? '주간 기록 · 포스터' : '캘린더 · 티켓',
  defaultBackground: style === 'poster' ? 'dark' : 'lavender',
  dimensions(showTime = true, records = {}, dates = []) {
    return {
      width: style === 'ticket' ? 520 : 1000,
      height:
        style === 'ticket'
          ? 750 + ticketMemoHeight(dates, records)
          : (showTime ? 596 : 536) + calendarMemoHeight(dates, records, 116, 21, 28),
    };
  },
  draw(ctx, dates, records, theme, _summaryTheme, showTime = true) {
    return calendar(ctx, dates, records, theme, style, showTime);
  },
}));

EXTRA_STICKERS.unshift(SMALL_STICKERS.find((sticker) => sticker.category === 'calendar'));
EXTRA_STICKERS.push(
  COMPACT_STICKER,
  ...SMALL_STICKERS.filter((sticker) => sticker.category === 'summary'),
);
