import { EXTRA_STICKERS } from './sticker-designs.js';
import { DAYS, TYPES, dateKey, weekLabel, duration } from '../domain/workouts.js';
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
export const DEFAULT_STICKER_BACKGROUNDS = {
  summary: 'lime',
  calendar: 'transparent',
  square: 'white',
  squareSummary: 'lime',
};

export function stickerDimensions(id, showTime = true) {
  const extra = EXTRA_STICKERS.find((sticker) => sticker.id === id);
  if (extra) return extra.dimensions(showTime);
  if (id === 'calendar') return { width: 948, height: showTime ? 300 : 240 };
  if (id === 'square') {
    const size = showTime ? 1080 : 1020;
    return { width: size, height: size };
  }
  return { width: SUMMARY_WIDTH, height: SUMMARY_HEIGHT };
}

// A registry keeps each sticker independently renderable and makes new widgets additive.
export const STICKERS = [
  {
    id: 'summary',
    category: 'summary',
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
    category: 'calendar',
    title: '주간 캘린더',
    width: 948,
    height: 300,
    draw(
      ctx,
      dates,
      records,
      theme = STICKER_BACKGROUNDS.transparent,
      showHeading = true,
      showTime = true,
    ) {
      if (theme.background) {
        ctx.fillStyle = theme.background;
        ctx.beginPath();
        ctx.roundRect(0, 0, 948, stickerDimensions('calendar', showTime).height, 30);
        ctx.fill();
      }
      const icon = createIconRenderer(ctx);
      ctx.fillStyle = theme.ink;
      ctx.textAlign = 'left';
      ctx.font = '600 24px "Manrope", "Noto Sans KR", sans-serif';
      if (showHeading) ctx.fillText(weekLabel(dates[0]), 24, 40);
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
        if (record) {
          icon(TYPES[record.type].icon, center, 199, 51, theme.ink);
          if (showTime && record.minutes !== null) {
            ctx.fillStyle = theme.secondary;
            ctx.font = '500 23px "Manrope", sans-serif';
            ctx.fillText(duration(record.minutes), center, 270);
          }
        } else {
          ctx.fillStyle = theme.secondary;
          ctx.fillText('—', center, 211);
        }
      });
    },
  },
  {
    id: 'square',
    category: 'combined',
    summaryBackgroundKey: 'squareSummary',
    title: '주간 기록 · 정방형',
    width: 1080,
    height: 1080,
    draw(
      ctx,
      dates,
      records,
      theme = STICKER_BACKGROUNDS.white,
      summaryTheme = { ...theme, background: null },
      showTime = true,
    ) {
      const { width: size } = stickerDimensions('square', showTime);
      const inset = (size - SUMMARY_WIDTH) / 2;
      if (theme.background) {
        ctx.fillStyle = theme.background;
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, 48);
        ctx.fill();
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = theme.ink;
      ctx.font = '700 52px "Manrope", "Noto Sans KR", sans-serif';
      ctx.fillText(weekLabel(dates[0]), inset, 124);
      ctx.fillStyle = theme.secondary;
      ctx.font = '500 24px "Manrope", sans-serif';
      ctx.fillText(
        `${dateKey(dates[0]).replaceAll('-', '.')} — ${dateKey(dates[6]).replaceAll('-', '.')}`,
        inset,
        176,
      );
      drawSummary(ctx, summaryModel(dates, records), inset, 244, {
        ...summaryTheme,
        transparent: summaryTheme.background === null,
      });
      ctx.save();
      ctx.translate(inset, 674);
      STICKERS.find((sticker) => sticker.id === 'calendar').draw(
        ctx,
        dates,
        records,
        { ...theme, background: null },
        false,
        showTime,
      );
      ctx.restore();
    },
  },
];
STICKERS.push(...EXTRA_STICKERS);
for (const sticker of EXTRA_STICKERS) {
  DEFAULT_STICKER_BACKGROUNDS[sticker.id] = sticker.defaultBackground;
  if (sticker.summaryBackgroundKey)
    DEFAULT_STICKER_BACKGROUNDS[sticker.summaryBackgroundKey] = 'lime';
}
export const STICKER_CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'summary', label: '요약' },
  { id: 'calendar', label: '캘린더' },
  { id: 'combined', label: '주간 기록' },
];
export function matchesStickerCategory(sticker, category) {
  return category === 'all' || sticker.category === category;
}
let fonts;
export async function createStickers(
  dates,
  records,
  backgrounds = DEFAULT_STICKER_BACKGROUNDS,
  timeVisibility = {},
) {
  fonts ??= loadSummaryFonts();
  await fonts;
  return Promise.all(
    STICKERS.map(async (sticker) => {
      const canvas = document.createElement('canvas');
      const dimensions = stickerDimensions(sticker.id, timeVisibility[sticker.id] !== false);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const theme =
        STICKER_BACKGROUNDS[backgrounds[sticker.id]] ??
        STICKER_BACKGROUNDS[DEFAULT_STICKER_BACKGROUNDS[sticker.id]];
      if (sticker.category === 'combined') {
        const summaryTheme =
          STICKER_BACKGROUNDS[backgrounds[sticker.summaryBackgroundKey]] ??
          STICKER_BACKGROUNDS[DEFAULT_STICKER_BACKGROUNDS[sticker.summaryBackgroundKey]];
        sticker.draw(
          canvas.getContext('2d'),
          dates,
          records,
          theme,
          summaryTheme,
          timeVisibility[sticker.id] !== false,
        );
      } else if (sticker.category === 'calendar') {
        sticker.draw(
          canvas.getContext('2d'),
          dates,
          records,
          theme,
          sticker.id === 'calendar' ? true : undefined,
          timeVisibility[sticker.id] !== false,
        );
      } else sticker.draw(canvas.getContext('2d'), dates, records, theme);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('스티커를 만들지 못했어요. 다시 시도해 주세요.');
      return { ...sticker, ...dimensions, blob };
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
