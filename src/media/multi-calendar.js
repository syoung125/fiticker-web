import { dayRecords, dateKey, DAYS, duration, recordIcon, weekLabel } from '../domain/workouts.js';
import { memoLines, drawMemo } from './memo.js';
import { createIconRenderer } from './icon.js';
import { summaryModel } from './summary.js';
export const hasMultiple = (dates, records) =>
  dates.some((date) => dayRecords(records, dateKey(date)).length > 1);
const FONT = '"Manrope", "Noto Sans KR", sans-serif';
function config(style) {
  return style === 'minimal'
    ? { width: 840, top: 70, size: 19, weight: 600, line: 28, col: 106, icon: 44 }
    : {
        width: style === 'poster' ? 1000 : 996,
        top: style === 'poster' ? 420 : 190,
        size: 23,
        weight: 500,
        line: 30,
        col: 116,
        icon: 48,
      };
}
function entryHeight(record, showTime, c) {
  return 96 + (showTime ? 34 : 0) + memoLines(record.memo, c.col, c.size, c.weight).length * c.line;
}
export function multiDimensions(style, dates, records, showTime) {
  if (style === 'ticket')
    return {
      width: 520,
      height:
        180 +
        dates.reduce(
          (sum, date) =>
            sum +
            Math.max(1, dayRecords(records, dateKey(date)).length) * 80 +
            dayRecords(records, dateKey(date)).reduce(
              (n, r) => n + memoLines(r.memo, 234, 21).length * 28,
              0,
            ),
          0,
        ),
    };
  const c = config(style);
  const body = Math.max(
    ...dates.map((date) =>
      dayRecords(records, dateKey(date)).reduce((sum, r) => sum + entryHeight(r, showTime, c), 0),
    ),
  );
  return { width: c.width, height: c.top + body + 26 };
}
export function drawMultiCalendar(ctx, dates, records, theme, style, showTime, showHeading = true) {
  const { width, height } = multiDimensions(style, dates, records, showTime);
  const icon = createIconRenderer(ctx);
  const text = (value, x, y, size = 23, color = theme.ink, align = 'center', weight = 500) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, x, y);
  };
  if (theme.background) {
    ctx.fillStyle = theme.background;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, style === 'poster' ? 0 : 26);
    ctx.fill();
  }
  if (style !== 'minimal' && showHeading)
    text(weekLabel(dates[0]), 32, 46, 23, theme.secondary, 'left', 600);
  if (style === 'ticket') {
    text('WEEK / LOG', 32, 103, 39, theme.ink, 'left', 800);
    let y = 145;
    dates.forEach((date, i) => {
      const items = dayRecords(records, dateKey(date));
      ctx.strokeStyle = theme.divider;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(488, y);
      ctx.stroke();
      ctx.setLineDash([]);
      (items.length ? items : [null]).forEach((r, j) => {
        if (j === 0) {
          text(DAYS[i], 34, y + 47, 18, theme.secondary, 'left', 700);
          text(String(date.getDate()).padStart(2, '0'), 108, y + 50, 35, theme.ink, 'left', 600);
        }
        if (r) icon(recordIcon(r), 205, y + 40, 39, theme.ink);
        const time = showTime && r?.minutes != null ? duration(r.minutes) : '';
        ctx.font = `500 21px ${FONT}`;
        const room = 234 - (time ? ctx.measureText(time).width + 16 : 0);
        let size = 26;
        const name = r?.name ?? 'REST DAY';
        while (size > 12) {
          ctx.font = `500 ${size}px ${FONT}`;
          if (ctx.measureText(name).width <= room) break;
          size--;
        }
        text(name, 254, y + 47, size, theme.ink, 'left');
        if (time) text(time, 488, y + 47, 21, theme.secondary, 'right');
        drawMemo(ctx, r?.memo, 254, y + 84, 234, 21, 28, theme.secondary, 'left');
        y += 80 + memoLines(r?.memo, 234, 21).length * 28;
      });
    });
    return;
  }
  const c = config(style),
    minimal = style === 'minimal',
    poster = style === 'poster';
  if (poster) {
    const { count, total } = summaryModel(dates, records);
    text(String(count), 266, 186, 100, theme.ink, 'center', 800);
    text(total, 734, 186, 82, theme.ink, 'center', 800);
    text('WORKOUTS', 266, 236, 23, theme.secondary);
    text('TOTAL TIME', 734, 236, 23, theme.secondary);
    ctx.strokeStyle = theme.divider;
    ctx.beginPath();
    ctx.moveTo(32, 280);
    ctx.lineTo(968, 280);
    ctx.stroke();
  }
  dates.forEach((date, i) => {
    const x = minimal ? 120 * (i + 0.5) : 24 + ((width - 48) / 7) * (i + 0.5);
    text(
      DAYS[i],
      x,
      minimal ? 38 : poster ? 338 : 110,
      minimal ? 19 : 22,
      theme.secondary,
      'center',
      600,
    );
    if (!minimal)
      text(
        String(date.getDate()).padStart(2, '0'),
        x,
        poster ? 387 : 159,
        38,
        theme.ink,
        'center',
        600,
      );
    const items = dayRecords(records, dateKey(date));
    let y = c.top;
    if (!items.length) text('—', x, y + 24, 26, theme.secondary);
    for (const r of items) {
      icon(recordIcon(r), x, y + 22, c.icon, theme.ink);
      let detailY = y + 82;
      if (showTime) {
        text(duration(r.minutes ?? 0), x, detailY, c.size, theme.secondary);
        detailY += 34;
      }
      drawMemo(ctx, r.memo, x, detailY, c.col, c.size, c.line, theme.secondary, 'center', c.weight);
      y += entryHeight(r, showTime, c);
    }
  });
}
