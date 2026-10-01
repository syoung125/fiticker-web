import { summarize, summarizeBySport, duration } from '../domain/workouts.js';

export const SUMMARY_WIDTH = 948;
const HEADER_HEIGHT = 60;
const BODY_HEIGHT = 294;
export const SUMMARY_HEIGHT = HEADER_HEIGHT + BODY_HEIGHT;
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
export function drawSummary(ctx, model, originX = 0, originY = 0, { transparent = false } = {}) {
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
  if (!transparent) {
    ctx.fillStyle = '#dfff7a';
    ctx.beginPath();
    ctx.roundRect(originX, originY, SUMMARY_WIDTH, SUMMARY_HEIGHT, 30);
    ctx.fill();
  }
  text('THIS WEEK', 34, 47, 24, 700);
  // Keep the heading above all columns, including both vertical dividers.
  originY += HEADER_HEIGHT;
  const columnWidth = SUMMARY_WIDTH / (detailed ? 3 : 2);
  const totalWidth = columnWidth - 68;
  const valueSize = fitSize(model.total, 82, totalWidth, 600);
  function bounds(value, size, weight = 500) {
    font(size, weight);
    const metrics = ctx.measureText(value);
    return {
      ascent: metrics.actualBoundingBoxAscent ?? size * 0.75,
      descent: metrics.actualBoundingBoxDescent ?? size * 0.2,
    };
  }
  const values = [String(model.count), model.total];
  const labels = ['workouts', 'total time'];
  const valueBounds = values.map((value) => bounds(value, valueSize, 600));
  const labelBounds = labels.map((label) => bounds(label, 30));
  const ascent = Math.max(...valueBounds.map((b) => b.ascent));
  const descent = Math.max(...valueBounds.map((b) => b.descent));
  const labelAscent = Math.max(...labelBounds.map((b) => b.ascent));
  const labelDescent = Math.max(...labelBounds.map((b) => b.descent));
  const gap = 20;
  const blockHeight = ascent + descent + gap + labelAscent + labelDescent;
  const valueY = (BODY_HEIGHT - blockHeight) / 2 + ascent;
  const labelY = valueY + descent + gap + labelAscent;
  values.forEach((value, index) => {
    const centerX = columnWidth * (index + 0.5);
    text(value, centerX, valueY, valueSize, 600, 'center');
    text(labels[index], centerX, labelY, 30, 500, 'center', secondary);
  });
  ctx.fillStyle = '#b7cd70';
  ctx.fillRect(originX + columnWidth, originY + 28, 1, BODY_HEIGHT - 56);
  if (detailed) {
    ctx.fillStyle = '#b7cd70';
    ctx.fillRect(originX + columnWidth * 2, originY + 28, 1, BODY_HEIGHT - 56);
    const lineHeight = 34;
    const rowBounds = model.sports.flatMap((sport) => [
      bounds(sport.name, 32),
      bounds(sport.time, fitSize(sport.time, 32, 125)),
    ]);
    const rowAscent = Math.max(...rowBounds.map((b) => b.ascent));
    const rowDescent = Math.max(...rowBounds.map((b) => b.descent));
    const listHeight = (model.sports.length - 1) * lineHeight + rowAscent + rowDescent;
    // Lift the sport list slightly to visually align it with the large metric groups.
    const start = (BODY_HEIGHT - listHeight) / 2 + rowAscent - 12;
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
