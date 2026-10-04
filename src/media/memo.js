import { dateKey } from '../domain/workouts.js';

export const MEMO_FONT = '"Manrope", "Noto Sans KR", sans-serif';
export function memoLines(memo, width, size, weight = 500) {
  if (!memo?.trim()) return [];
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${weight} ${size}px ${MEMO_FONT}`;
  const lines = [];
  let line = '';
  for (const char of Array.from(memo.trim().replaceAll('\r\n', '\n'))) {
    if (char === '\n') {
      lines.push(line.trim());
      line = '';
      continue;
    }
    if (line && ctx.measureText(line + char).width > width) {
      lines.push(line.trim());
      line = '';
    }
    line += char;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
export function calendarMemoHeight(dates, records, width, size, lineHeight, weight = 500) {
  return (
    Math.max(
      0,
      ...dates.map((date) => memoLines(records[dateKey(date)]?.memo, width, size, weight).length),
    ) * lineHeight
  );
}
export function drawMemo(
  ctx,
  memo,
  x,
  y,
  width,
  size,
  lineHeight,
  color,
  align = 'center',
  weight = 500,
) {
  const lines = memoLines(memo, width, size, weight);
  ctx.font = `${weight} ${size}px ${MEMO_FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
}
