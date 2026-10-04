import { calendarMemoHeight, drawMemo } from './memo.js';
import { EXTRA_STICKERS } from './sticker-designs.js';
import { DAYS, recordIcon, dateKey, weekLabel, duration } from '../domain/workouts.js';
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

export function stickerDimensions(id, showTime = true, records = {}, dates = []) {
  const extra = EXTRA_STICKERS.find((sticker) => sticker.id === id);
  if (extra) return extra.dimensions(showTime, records, dates);
  if (id === 'calendar')
    return {
      width: 996,
      height: (showTime ? 348 : 288) + calendarMemoHeight(dates, records, 116, 23, 30),
    };
  if (id === 'square') return { width: 1080, height: 1080 };
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
    width: 996,
    height: 348,
    draw(
      ctx,
      dates,
      records,
      theme = STICKER_BACKGROUNDS.transparent,
      showHeading = true,
      showTime = true,
      inSquare = false,
    ) {
      if (theme.background) {
        ctx.fillStyle = theme.background;
        ctx.beginPath();
        const { width, height } = stickerDimensions('calendar', showTime, records, dates);
        ctx.roundRect(0, 0, width, height, 30);
        ctx.fill();
      }
      ctx.save();
      if (!inSquare) ctx.translate(24, 24);
      const rows = inSquare
        ? { weekday: 88, date: 168, icon: 256, time: 336 }
        : { weekday: 91, date: 143, icon: 199, time: 270 };
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
        ctx.fillText(DAYS[index], center, rows.weekday);
        ctx.fillStyle = theme.ink;
        ctx.font = '600 38px "Manrope", sans-serif';
        ctx.fillText(String(date.getDate()), center, rows.date);
        const record = records[dateKey(date)];
        if (record) {
          icon(recordIcon(record), center, rows.icon, 51, theme.ink);
          if (showTime && record.minutes !== null) {
            ctx.fillStyle = theme.secondary;
            ctx.font = '500 23px "Manrope", "Noto Sans KR", sans-serif';
            ctx.fillText(duration(record.minutes), center, rows.time);
          }
          drawMemo(
            ctx,
            record.memo,
            center,
            rows.time + (showTime ? 38 : -10),
            116,
            23,
            30,
            theme.secondary,
          );
        } else {
          ctx.fillStyle = theme.secondary;
          ctx.fillText('—', center, rows.icon + 12);
        }
      });
      ctx.restore();
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
      drawSummary(ctx, summaryModel(dates, records), inset, 268, {
        ...summaryTheme,
        transparent: summaryTheme.background === null,
      });
      ctx.save();
      const memoHeight = calendarMemoHeight(dates, records, 116, 23, 30);
      const calendarScale = memoHeight ? Math.min(1, 390 / (352 + memoHeight)) : 1;
      ctx.translate(inset + (SUMMARY_WIDTH * (1 - calendarScale)) / 2, 650);
      ctx.scale(calendarScale, calendarScale);
      STICKERS.find((sticker) => sticker.id === 'calendar').draw(
        ctx,
        dates,
        records,
        { ...theme, background: null },
        false,
        showTime,
        true,
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
      const dimensions = stickerDimensions(
        sticker.id,
        timeVisibility[sticker.id] !== false,
        records,
        dates,
      );
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
