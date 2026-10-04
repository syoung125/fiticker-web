import { dateKey } from '../domain/workouts.js';

export const MEMO_FONT = '"Manrope", "Noto Sans KR", sans-serif';
export function memoLines(memo, width, size) {
  if (!memo?.trim()) return [];
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `500 ${size}px ${MEMO_FONT}`;
  const lines = [];
  let line = '';
  for (const char of Array.from(memo.trim())) {
    if (line && ctx.measureText(line + char).width > width) {
      lines.push(line.trim());
      line = '';
    }
    line += char;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
export function calendarMemoHeight(dates, records, width, size, lineHeight) {
  return (
    Math.max(
      0,
      ...dates.map((date) => memoLines(records[dateKey(date)]?.memo, width, size).length),
    ) * lineHeight
  );
}
export function drawMemo(ctx, memo, x, y, width, size, lineHeight, color, align = 'center') {
  const lines = memoLines(memo, width, size);
  ctx.font = `500 ${size}px ${MEMO_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}
