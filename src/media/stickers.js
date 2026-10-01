import { DAYS, TYPES, dateKey, weekLabel } from '../domain/workouts.js';
import {
  drawSummary,
  summaryModel,
  SUMMARY_WIDTH,
  SUMMARY_HEIGHT,
  loadSummaryFonts,
} from './summary.js';
import { createIconRenderer } from './icon.js';

export const STICKER_BACKGROUNDS = {
  transparent: {
    label: '투명 · 검은 글씨',
    background: null,
    ink: '#20221d',
    secondary: '#525b36',
    divider: '#a9ac9e',
  },
  transparentWhite: {
    label: '투명 · 흰 글씨',
    background: null,
    ink: '#ffffff',
    secondary: '#f0f2eb',
    divider: '#cdd2c3',
  },
  lime: {
    label: '연두',
    background: '#dfff7a',
    ink: '#20221d',
    secondary: '#525b36',
    divider: '#b7cd70',
  },
  white: {
    label: '화이트',
    background: '#ffffff',
    ink: '#20221d',
    secondary: '#62665a',
    divider: '#d5d8c9',
  },
  lavender: {
    label: '라벤더',
    background: '#e7e1f6',
    ink: '#292333',
    secondary: '#645773',
    divider: '#c6badb',
  },
  dark: {
    label: '다크',
    background: '#20221d',
    ink: '#ffffff',
    secondary: '#e0e4d6',
    divider: '#626857',
  },
};
export const DEFAULT_STICKER_BACKGROUNDS = { summary: 'lime', calendar: 'transparent' };

// A registry keeps each sticker independently renderable and makes new widgets additive.
export const STICKERS = [
  {
    id: 'summary',
    title: '주간 요약',
    width: SUMMARY_WIDTH,
    height: SUMMARY_HEIGHT,
    draw(ctx, dates, records, theme = STICKER_BACKGROUNDS.lime) {
      drawSummary(ctx, summaryModel(dates, records), 0, 0, {
        ...theme,
        transparent: theme.background === null,
      });
    },
  },
  {
    id: 'calendar',
    title: '주간 캘린더',
    width: 948,
    height: 256,
    draw(ctx, dates, records, theme = STICKER_BACKGROUNDS.transparent) {
      if (theme.background) {
        ctx.fillStyle = theme.background;
        ctx.beginPath();
        ctx.roundRect(0, 0, 948, 256, 30);
        ctx.fill();
      }
      const icon = createIconRenderer(ctx);
      ctx.fillStyle = theme.ink;
      ctx.textAlign = 'left';
      ctx.font = '600 24px "Manrope", "Noto Sans KR", sans-serif';
      ctx.fillText(weekLabel(dates[0]), 24, 40);
      dates.forEach((date, index) => {
        const center = (948 / 7) * (index + 0.5);
        ctx.textAlign = 'center';
        ctx.fillStyle = theme.secondary;
        ctx.font = '500 22px "Manrope", sans-serif';
        ctx.fillText(DAYS[index], center, 91);
        ctx.fillStyle = theme.ink;
        ctx.font = '600 38px "Manrope", sans-serif';
        ctx.fillText(String(date.getDate()), center, 143);
        const record = records[dateKey(date)];
        if (record) icon(TYPES[record.type].icon, center, 199, 51, theme.ink);
        else {
          ctx.fillStyle = theme.secondary;
          ctx.fillText('—', center, 211);
        }
      });
    },
  },
];
let fonts;
export async function createStickers(dates, records, backgrounds = DEFAULT_STICKER_BACKGROUNDS) {
  fonts ??= loadSummaryFonts();
  await fonts;
  return Promise.all(
    STICKERS.map(async (sticker) => {
      const canvas = document.createElement('canvas');
      canvas.width = sticker.width;
      canvas.height = sticker.height;
      const theme =
        STICKER_BACKGROUNDS[backgrounds[sticker.id]] ??
        STICKER_BACKGROUNDS[DEFAULT_STICKER_BACKGROUNDS[sticker.id]];
      sticker.draw(canvas.getContext('2d'), dates, records, theme);
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
