import { DAYS, TYPES, dateKey, weekLabel } from '../domain/workouts.js';
import {
  drawSummary,
  summaryModel,
  SUMMARY_WIDTH,
  SUMMARY_HEIGHT,
  loadSummaryFonts,
} from './summary.js';
import { createIconRenderer } from './icon.js';

// A registry keeps each sticker independently renderable and makes new widgets additive.
export const STICKERS = [
  {
    id: 'summary',
    title: '주간 요약',
    width: SUMMARY_WIDTH,
    height: SUMMARY_HEIGHT,
    draw(ctx, dates, records) {
      drawSummary(ctx, summaryModel(dates, records));
    },
  },
  {
    id: 'calendar',
    title: '주간 캘린더',
    width: 948,
    height: 256,
    draw(ctx, dates, records) {
      const icon = createIconRenderer(ctx);
      ctx.fillStyle = '#20221d';
      ctx.textAlign = 'left';
      ctx.font = '600 24px "Manrope", "Noto Sans KR", sans-serif';
      ctx.fillText(weekLabel(dates[0]), 24, 40);
      dates.forEach((date, index) => {
        const center = (948 / 7) * (index + 0.5);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#747968';
        ctx.font = '500 22px "Manrope", sans-serif';
        ctx.fillText(DAYS[index], center, 91);
        ctx.fillStyle = '#20221d';
        ctx.font = '600 38px "Manrope", sans-serif';
        ctx.fillText(String(date.getDate()), center, 143);
        const record = records[dateKey(date)];
        if (record) icon(TYPES[record.type].icon, center, 199, 51);
        else {
          ctx.fillStyle = '#a9ac9e';
          ctx.fillText('—', center, 211);
        }
      });
    },
  },
];
let fonts;
export async function createStickers(dates, records) {
  fonts ??= loadSummaryFonts();
  await fonts;
  return Promise.all(
    STICKERS.map(async (sticker) => {
      const canvas = document.createElement('canvas');
      canvas.width = sticker.width;
      canvas.height = sticker.height;
      sticker.draw(canvas.getContext('2d'), dates, records);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('스티커를 만들지 못했어요. 다시 시도해 주세요.');
      return { ...sticker, blob };
    }),
  );
}

export function copySticker(
  blob,
  clipboard = navigator.clipboard,
  Item = globalThis.ClipboardItem,
) {
  if (!clipboard?.write || !Item)
    return Promise.reject(new Error('이미지를 꾹 눌러 복사하거나 PNG 저장을 이용해 주세요.'));
  // Called immediately inside the click gesture, with an already generated PNG (Safari).
  return clipboard.write([new Item({ 'image/png': blob })]);
}
