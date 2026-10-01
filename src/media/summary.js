import { summarize, summarizeBySport, duration } from '../domain/workouts.js';

export const SUMMARY_WIDTH = 948;
export const SUMMARY_HEIGHT = 294;
const FONT = '"Manrope", "Noto Sans KR", sans-serif';

export function loadSummaryFonts() {
  return Promise.allSettled([
    document.fonts.load('500 24px Manrope'),
    document.fonts.load('600 72px Manrope'),
    document.fonts.load('700 19px Manrope'),
    document.fonts.load('500 24px "Noto Sans KR"'),
  ]);
}

export function summaryModel(dates, records) {
  const totals = summarize(dates, records);
  const sports = summarizeBySport(dates, records);
  return {
    count: totals.count,
    total: duration(totals.minutes),
    sports:
      sports.length < 2
        ? []
        : sports.map((sport) => ({
            name: sport.name,
            time: sport.minutes === null ? '시간 미입력' : duration(sport.minutes),
          })),
  };
}

// The editor, thumbnail and PNG use this exact renderer, including text fitting.
export function drawSummary(ctx, model, originX = 0, originY = 0) {
  const detailed = model.sports.length > 0;
  const ink = '#20221d',
    secondary = '#525b36';
  function font(size, weight = 500) {
    ctx.font = `${weight} ${size}px ${FONT}`;
  }
  function text(value, x, y, size, weight = 500, align = 'left', color = ink) {
    font(size, weight);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(value, originX + x, originY + y);
  }
  function fitSize(value, size, width, weight = 500) {
    font(size, weight);
    while (ctx.measureText(value).width > width && size > 12) {
      size--;
      font(size, weight);
    }
    return size;
  }
  ctx.save();
  ctx.fillStyle = '#dfff7a';
  ctx.beginPath();
  ctx.roundRect(originX, originY, SUMMARY_WIDTH, SUMMARY_HEIGHT, 30);
  ctx.fill();
  text('THIS WEEK', 34, 47, 24, 700);
  text(String(model.count), 34, 184, detailed ? 82 : 102, 600);
  text('workouts', 36, 230, 30, 500, 'left', secondary);
  const columnWidth = SUMMARY_WIDTH / 3;
  const totalX = detailed ? columnWidth + 34 : 455;
  const totalWidth = detailed ? columnWidth - 68 : 459;
  ctx.fillStyle = '#b7cd70';
  ctx.fillRect(originX + (detailed ? columnWidth : 420), originY + 28, 1, SUMMARY_HEIGHT - 56);
  text(model.total, totalX, 184, fitSize(model.total, detailed ? 82 : 96, totalWidth, 600), 600);
  text('total time', totalX + 2, 230, 30, 500, 'left', secondary);
  if (detailed) {
    ctx.fillStyle = '#b7cd70';
    ctx.fillRect(originX + columnWidth * 2, originY + 28, 1, SUMMARY_HEIGHT - 56);
    const lineHeight = 34;
    const start = (SUMMARY_HEIGHT - model.sports.length * lineHeight) / 2 + 26;
    model.sports.forEach((sport, index) => {
      const timeSize = fitSize(sport.time, 32, 125);
      font(timeSize);
      const timeWidth = ctx.measureText(sport.time).width;
      const nameWidth = 914 - (columnWidth * 2 + 34) - timeWidth - 16;
      font(32);
      let name = sport.name;
      // Preserve readable type rather than shrinking long custom names to a few pixels.
      if (ctx.measureText(name).width > nameWidth) {
        const letters = Array.from(name);
        while (letters.length && ctx.measureText(letters.join('') + '…').width > nameWidth)
          letters.pop();
        name = letters.join('') + '…';
      }
      const y = start + index * lineHeight;
      text(name, columnWidth * 2 + 34, y, 32, 500, 'left', secondary);
      text(sport.time, 914, y, timeSize, 500, 'right', secondary);
    });
  }
  ctx.restore();
}
