import {
  createStickers,
  STICKERS,
  STICKER_CATEGORIES,
  matchesStickerCategory,
  copySticker,
  STICKER_BACKGROUNDS,
  DEFAULT_STICKER_BACKGROUNDS,
} from '../media/stickers.js';
import { dateKey } from '../domain/workouts.js';
import { $, el } from './dom.js';

function actionIcon(pathData) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  for (const [name, value] of Object.entries({
    viewBox: '0 0 24 24',
    width: '20',
    height: '20',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.7',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    focusable: 'false',
  }))
    svg.setAttribute(name, value);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', pathData);
  svg.append(path);
  return svg;
}

export function createStickerGallery({ notify }) {
  const backgrounds = { ...DEFAULT_STICKER_BACKGROUNDS };
  const timeVisibility = Object.fromEntries(STICKERS.map((sticker) => [sticker.id, true]));
  let activeCategory = 'all';
  let latestDates, latestRecords;
  const themeSelect = $('#sticker-theme');
  for (const [value, label] of [
    ['default', '기본 테마'],
    ...Object.entries(STICKER_BACKGROUNDS).map(([key, theme]) => [key, theme.label]),
    ['custom', '개별 설정'],
  ]) {
    const option = el('option', '', label);
    option.value = value;
    option.disabled = value === 'custom';
    themeSelect.append(option);
  }
  themeSelect.onchange = async () => {
    for (const key of Object.keys(backgrounds)) {
      backgrounds[key] =
        themeSelect.value === 'default' ? DEFAULT_STICKER_BACKGROUNDS[key] : themeSelect.value;
    }
    if (latestDates) await gallery.update(latestDates, latestRecords);
  };
  function filterCards() {
    document.querySelectorAll('[data-sticker-category]').forEach((card) => {
      card.hidden = !matchesStickerCategory(
        { category: card.dataset.stickerCategory },
        activeCategory,
      );
    });
  }
  const filters = $('#sticker-filters');
  for (const category of STICKER_CATEGORIES) {
    const chip = el('button', 'sticker-filter', category.label);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(category.id === activeCategory));
    chip.onclick = () => {
      activeCategory = category.id;
      for (const button of filters.children)
        button.setAttribute('aria-pressed', String(button === chip));
      filterCards();
    };
    filters.append(chip);
  }
  let revision = 0,
    signature = '',
    urls = [];
  const gallery = {
    async update(dates, records) {
      latestDates = dates;
      latestRecords = records;
      const snapshot = Object.fromEntries(
        dates
          .filter((date) => records[dateKey(date)])
          .map((date) => {
            const key = dateKey(date),
              { type, name, minutes } = records[key];
            return [key, { type, name, minutes }];
          }),
      );
      const nextSignature = JSON.stringify([
        dateKey(dates[0]),
        snapshot,
        backgrounds,
        timeVisibility,
      ]);
      if (signature === nextSignature) return;
      signature = nextSignature;
      const current = ++revision;
      const list = $('#sticker-list'),
        status = $('#sticker-status');
      // Keep the current gallery mounted while PNGs render to avoid collapsing page height.
      if (!list.children.length) status.textContent = '스티커 만드는 중…';
      const nextURLs = [];
      try {
        const stickers = await createStickers(
          dates,
          snapshot,
          { ...backgrounds },
          { ...timeVisibility },
        );
        if (current !== revision) return;
        const nodes = stickers.map((sticker) => {
          const url = URL.createObjectURL(sticker.blob);
          nextURLs.push(url);
          const card = el('article', 'sticker-card');
          card.dataset.stickerCategory = sticker.category;
          card.hidden = !matchesStickerCategory(sticker, activeCategory);
          function backgroundControl(key, label) {
            const backgroundLabel = el('label', 'sticker-background', label + ' ');
            const select = el('select');
            select.dataset.stickerBackground = key;
            select.setAttribute('aria-label', `${sticker.title} ${label}`);
            for (const [value, theme] of Object.entries(STICKER_BACKGROUNDS)) {
              const option = el('option', '', theme.label);
              option.value = value;
              select.append(option);
            }
            select.value = backgrounds[key];
            select.onchange = async () => {
              backgrounds[key] = select.value;
              themeSelect.value = 'custom';
              await gallery.update(dates, snapshot);
              $(`[data-sticker-background="${key}"]`)?.focus({ preventScroll: true });
            };
            backgroundLabel.append(select);
            return backgroundLabel;
          }
          const controls = [];
          if (sticker.summaryBackgroundKey)
            controls.push(backgroundControl(sticker.summaryBackgroundKey, '요약 배경'));
          if (sticker.category !== 'summary' && sticker.supportsDailyTime !== false) {
            const label = el('div', 'sticker-time-toggle');
            const toggle = el('button', 'sticker-time-switch');
            toggle.type = 'button';
            toggle.setAttribute('role', 'switch');
            toggle.setAttribute('aria-checked', String(timeVisibility[sticker.id]));
            toggle.dataset.stickerTime = sticker.id;
            toggle.setAttribute('aria-label', `${sticker.title} 시간 표시`);
            toggle.onclick = async () => {
              timeVisibility[sticker.id] = !timeVisibility[sticker.id];
              await gallery.update(dates, snapshot);
              $(`[data-sticker-time="${sticker.id}"]`)?.focus({ preventScroll: true });
            };
            toggle.append(el('span', 'switch-thumb'));
            label.append(el('span', '', '시간 표시'), toggle);
            controls.push(label);
          }
          const preview = el('div', 'sticker-preview');
          if (backgrounds[sticker.id] === 'transparentWhite')
            preview.classList.add('sticker-preview-dark');
          const image = el('img');
          image.src = url;
          image.alt = `${sticker.title} 스티커 · 길게 눌러 이미지 복사`;
          image.width = sticker.width;
          image.height = sticker.height;
          preview.append(image);
          const actions = el('div', 'sticker-actions');
          const copy = el('button', 'sticker-copy');
          copy.title = '스티커 복사';
          copy.append(actionIcon('M9 9h11v11H9z M5 15H3V3h12v2'));
          copy.type = 'button';
          copy.setAttribute('aria-label', `${sticker.title} 스티커 복사`);
          copy.onclick = async () => {
            try {
              await copySticker(sticker.blob);
              notify('스티커를 복사했어요. 스토리에 붙여넣어 보세요.');
            } catch {
              notify('이미지를 꾹 눌러 복사하거나 PNG 저장을 이용해 주세요.');
            }
          };
          const download = el('a', 'sticker-download');
          download.title = 'PNG 저장';
          download.setAttribute('aria-label', `${sticker.title} 스티커 PNG 저장`);
          download.append(actionIcon('M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5'));
          download.href = url;
          download.download = `move-diary-${sticker.id}-${dateKey(dates[0])}.png`;
          actions.append(copy, download);
          const heading = el('div', 'sticker-card-heading');
          heading.append(el('h3', '', sticker.title), actions);
          card.append(heading, ...controls, preview);
          return card;
        });
        list.replaceChildren(...nodes);
        urls.forEach((url) => URL.revokeObjectURL(url));
        urls = nextURLs;
        status.textContent = '상단에서 전체 테마를 고르면 모든 스티커에 적용돼요.';
      } catch (error) {
        nextURLs.forEach((url) => URL.revokeObjectURL(url));
        if (current !== revision) return;
        signature = '';
        status.textContent = error.message;
      }
    },
  };
  return gallery;
}
