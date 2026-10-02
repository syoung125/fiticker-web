import { SMALL_STICKERS } from './small-stickers.js';
import { COMPACT_STICKER } from './compact-sticker.js';
import { DAYS, TYPES, dateKey, weekLabel, duration } from '../domain/workouts.js';
import { createIconRenderer } from './icon.js';

const FONT = '"Manrope", "Noto Sans KR", sans-serif';
function text(ctx, value, x, y, size, color, weight = 500, align = 'left', maxWidth) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
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
function calendar(ctx, dates, records, theme, style, showTime) {
  const icon = createIconRenderer(ctx);
  const height =
    style === 'ticket'
      ? showTime
        ? 960
        : 750
      : style === 'poster'
        ? showTime
          ? 620
          : 560
        : showTime
          ? 320
          : 260;
  const width = style === 'ticket' ? 660 : 1000;
  panel(ctx, width, height, theme, style === 'poster' ? 0 : 24);
  text(ctx, weekLabel(dates[0]), 32, 46, 23, theme.secondary, 600);
  if (style === 'ticket') {
    text(ctx, 'WEEK / LOG', 32, 103, 39, theme.ink, 800);
    dates.forEach((date, i) => {
      const record = records[dateKey(date)],
        y = 145 + i * (showTime ? 110 : 80);
      line(ctx, 32, y, 596, theme, true);
      text(ctx, DAYS[i], 34, y + 38, 18, theme.secondary, 700);
      text(ctx, String(date.getDate()).padStart(2, '0'), 108, y + 43, 35, theme.ink, 600);
      if (record) icon(TYPES[record.type].icon, 214, y + 36, 39, theme.ink);
      text(ctx, record?.name ?? 'REST DAY', 262, y + 41, 26, theme.ink, 500, 'left', 355);
      if (showTime && record?.minutes != null)
        text(ctx, duration(record.minutes), 262, y + 80, 21, theme.secondary);
    });
  } else {
    const poster = style === 'poster';
    if (poster) {
      text(ctx, '7 DAYS.', 32, 187, 140, theme.ink, 800);
      text(ctx, 'ONE WEEK OF MOVEMENT', 38, 240, 23, theme.secondary, 600);
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
    });
    if (poster) text(ctx, 'MOVE. REST. REPEAT.', 32, height - 22, 17, theme.secondary, 700);
  }
}
const styles = ['minimal', 'ticket', 'poster'];
const names = { minimal: '미니멀', ticket: '티켓', poster: '포스터' };
const categories = { calendar: '캘린더' };
export const EXTRA_STICKERS = Object.entries(categories).flatMap(([category, label]) =>
  styles.map((style) => ({
    id: `${category}-${style}`,
    category,
    title: `${label} · ${names[style]}`,
    defaultBackground: style === 'poster' ? 'dark' : style === 'ticket' ? 'lavender' : 'white',
    dimensions(showTime = true) {
      if (category === 'calendar')
        return {
          width: style === 'ticket' ? 660 : 1000,
          height:
            style === 'ticket'
              ? showTime
                ? 960
                : 750
              : style === 'poster'
                ? showTime
                  ? 620
                  : 560
                : showTime
                  ? 320
                  : 260,
        };
    },
    draw(
      ctx,
      dates,
      records,
      theme,
      summaryTheme = { ...theme, background: null },
      showTime = true,
    ) {
      if (category === 'calendar') return calendar(ctx, dates, records, theme, style, showTime);
    },
  })),
);

EXTRA_STICKERS.push(COMPACT_STICKER, ...SMALL_STICKERS);
