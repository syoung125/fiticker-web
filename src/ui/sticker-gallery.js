import {
  createStickers,
  copySticker,
  STICKER_BACKGROUNDS,
  DEFAULT_STICKER_BACKGROUNDS,
} from '../media/stickers.js';
import { dateKey } from '../domain/workouts.js';
import { $, el } from './dom.js';

export function createStickerGallery({ notify }) {
  const backgrounds = { ...DEFAULT_STICKER_BACKGROUNDS };
  let revision = 0,
    signature = '',
    urls = [];
  function clearURLs() {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls = [];
  }
  const gallery = {
    async update(dates, records) {
      const snapshot = Object.fromEntries(
        dates
          .filter((date) => records[dateKey(date)])
          .map((date) => {
            const key = dateKey(date),
              { type, name, minutes } = records[key];
            return [key, { type, name, minutes }];
          }),
      );
      const nextSignature = JSON.stringify([dateKey(dates[0]), snapshot, backgrounds]);
      if (signature === nextSignature) return;
      signature = nextSignature;
      const current = ++revision;
      const list = $('#sticker-list'),
        status = $('#sticker-status');
      list.replaceChildren();
      clearURLs();
      if (!Object.keys(snapshot).length) {
        status.textContent = '운동을 기록하면 스티커가 만들어져요.';
        return;
      }
      status.textContent = '스티커 만드는 중…';
      try {
        const stickers = await createStickers(dates, snapshot, backgrounds);
        if (current !== revision) return;
        const nodes = stickers.map((sticker) => {
          const url = URL.createObjectURL(sticker.blob);
          urls.push(url);
          const card = el('article', 'sticker-card');
          const backgroundLabel = el('label', 'sticker-background', '배경 ');
          const select = el('select');
          select.dataset.stickerBackground = sticker.id;
          select.setAttribute('aria-label', `${sticker.title} 배경`);
          for (const [value, theme] of Object.entries(STICKER_BACKGROUNDS)) {
            const option = el('option', '', theme.label);
            option.value = value;
            select.append(option);
          }
          select.value = backgrounds[sticker.id];
          select.onchange = async () => {
            backgrounds[sticker.id] = select.value;
            await gallery.update(dates, snapshot);
            $(`[data-sticker-background="${sticker.id}"]`)?.focus({ preventScroll: true });
          };
          backgroundLabel.append(select);
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
          const copy = el('button', 'sticker-copy', '복사');
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
          const download = el('a', 'sticker-download', 'PNG 저장');
          download.href = url;
          download.download = `move-diary-${sticker.id}-${dateKey(dates[0])}.png`;
          actions.append(copy, download);
          card.append(el('h3', '', sticker.title), backgroundLabel, preview, actions);
          return card;
        });
        list.replaceChildren(...nodes);
        status.textContent = '스티커마다 배경을 고를 수 있어요. 선택한 배경 그대로 복사·저장돼요.';
      } catch (error) {
        if (current !== revision) return;
        signature = '';
        status.textContent = error.message;
      }
    },
  };
  return gallery;
}
