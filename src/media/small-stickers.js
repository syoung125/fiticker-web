import { hasMultiple, multiDimensions, drawMultiCalendar } from './multi-calendar.js';
import { calendarMemoHeight, drawMemo } from './memo.js';
import { activeDays, DAYS, recordIcon, dateKey, duration } from '../domain/workouts.js';
import { summaryModel } from './summary.js';
import { createIconRenderer } from './icon.js';

const FONT = '"Manrope", "Noto Sans KR", sans-serif';
function text(ctx, value, x, y, size, color, weight = 600, maxWidth) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  while (maxWidth && ctx.measureText(value).width > maxWidth && size > 14)
    ctx.font = `${weight} ${--size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}
function background(ctx, width, height, theme, radius) {
  if (!theme.background) return;
  ctx.fillStyle = theme.background;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.fill();
}

export const SMALL_STICKERS = [
  {
    id: 'summary-progress',
    category: 'summary',
    title: '요약 · 프로그레스',
    defaultBackground: 'lime',
    dimensions: () => ({ width: 840, height: 188 }),
    draw(ctx, dates, records, theme) {
      const count = activeDays(dates, records);
      background(ctx, 840, 188, theme, 26);
      ctx.font = `500 27px ${FONT}`;
      ctx.fillStyle = theme.secondary;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText('This week', 48, 76);
      ctx.textAlign = 'right';
      ctx.fillStyle = theme.ink;
      ctx.fillText(`${count} / 7 days`, 792, 76);
      ctx.save();
      ctx.fillStyle = theme.ink;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.roundRect(48, 114, 744, 20, 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (count > 0) {
        ctx.beginPath();
        ctx.roundRect(48, 114, (744 * count) / 7, 20, 10);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  {
    id: 'summary-minimal',
    category: 'summary',
    title: '요약 · 미니멀',
    defaultBackground: 'transparent',
    dimensions: () => ({ width: 840, height: 220 }),
    draw(ctx, dates, records, theme) {
      const { count, total } = summaryModel(dates, records);
      background(ctx, 840, 220, theme, 26);
      text(ctx, String(count), 210, 124, 88, theme.ink, 700, 356);
      text(ctx, total, 630, 124, 88, theme.ink, 700, 356);
      text(ctx, 'WORKOUTS', 210, 177, 23, theme.secondary, 500);
      text(ctx, 'TOTAL TIME', 630, 177, 23, theme.secondary, 500);
    },
  },
  {
    id: 'summary-widget',
    category: 'summary',
    title: '요약 · 미니 위젯',
    defaultBackground: 'lime',
    dimensions: () => ({ width: 480, height: 480 }),
    draw(ctx, dates, records, theme) {
      const model = summaryModel(dates, records);
      background(ctx, 480, 480, theme, 44);
      text(ctx, 'THIS WEEK', 240, 58, 22, theme.secondary, 700);
      text(ctx, String(model.count), 240, 221, 154, theme.ink, 800);
      text(ctx, 'workouts', 240, 260, 26, theme.secondary, 500);
      text(ctx, model.total, 240, 375, 66, theme.ink, 700, 400);
      text(ctx, 'total time', 240, 416, 26, theme.secondary, 500);
    },
  },
  {
    id: 'calendar-minimal',
    category: 'calendar',
    title: '캘린더 · 미니멀',
    defaultBackground: 'white',
    dimensions: (showTime = true, records = {}, dates = []) =>
      hasMultiple(dates, records)
        ? multiDimensions('minimal', dates, records, showTime)
        : {
            width: 840,
            height: (showTime ? 180 : 136) + calendarMemoHeight(dates, records, 106, 19, 28, 600),
          },
    draw(ctx, dates, records, theme, _heading, showTime = true) {
      if (hasMultiple(dates, records))
        return drawMultiCalendar(ctx, dates, records, theme, 'minimal', showTime);
      background(
        ctx,
        840,
        (showTime ? 180 : 136) + calendarMemoHeight(dates, records, 106, 19, 28, 600),
        theme,
        26,
      );
      const icon = createIconRenderer(ctx);
      dates.forEach((date, index) => {
        const x = 120 * (index + 0.5);
        const record = records[dateKey(date)];
        text(ctx, DAYS[index], x, 38, 19, theme.secondary);
        if (record) {
          icon(recordIcon(record), x, 88, 44, theme.ink);
          if (showTime) text(ctx, duration(record.minutes ?? 0), x, 156, 21, theme.ink, 500, 106);
          drawMemo(
            ctx,
            record.memo,
            x,
            showTime ? 190 : 148,
            106,
            19,
            28,
            theme.secondary,
            'center',
            600,
          );
        } else text(ctx, '—', x, 99, 28, theme.ink, 500);
      });
    },
  },
];
