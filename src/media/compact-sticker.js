import { dateKey } from '../domain/workouts.js';
import { summaryModel } from './summary.js';

// A single typographic composition, independent of the summary and calendar renderers.
export const COMPACT_STICKER = {
  id: 'combined-compact',
  category: 'combined',
  title: '주간 기록 · 컴팩트',
  defaultBackground: 'transparentWhite',
  supportsDailyTime: false,
  dimensions: () => ({ width: 960, height: 660 }),
  draw(ctx, dates, records, theme) {
    const { count, total } = summaryModel(dates, records);
    function text(value, x, y, size, color, bold = false, maxWidth, align = 'left') {
      const font = () =>
        `${bold ? 'italic 800' : '500'} ${size}px "Manrope", "Noto Sans KR", sans-serif`;
      ctx.font = font();
      while (maxWidth && ctx.measureText(value).width > maxWidth && size > 18) {
        size--;
        ctx.font = font();
      }
      ctx.fillStyle = color;
      ctx.textAlign = align;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(value, x, y);
    }
    ctx.save();
    if (theme.background) {
      ctx.fillStyle = theme.background;
      ctx.beginPath();
      ctx.roundRect(0, 0, 960, 660, 24);
      ctx.fill();
    }
    const formatDate = (date) =>
      date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    text(`${formatDate(dates[0])} – ${formatDate(dates[6])}`, 30, 52, 39, theme.ink);
    text(String(count), 24, 304, 257, theme.ink, true, 270);
    text(total, 357, 304, 157, theme.ink, true, 560);
    text('WORKOUTS', 30, 395, 35, theme.secondary);
    text('TOTAL TIME', 369, 395, 35, theme.secondary);
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    dates.forEach((date, index) => {
      const active = Boolean(records[dateKey(date)]),
        x = 60 + index * 132;
      ctx.globalAlpha = active ? 1 : 0.4;
      text(days[index], x, 557, 39, theme.ink, false, undefined, 'center');
      ctx.globalAlpha = 1;
      if (active) {
        ctx.fillStyle = theme.ink;
        ctx.beginPath();
        ctx.arc(x, 615, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  },
};
