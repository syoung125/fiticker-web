import { createStickers, copySticker } from '../media/stickers.js';
import { dateKey } from '../domain/workouts.js';
import { $, el } from './dom.js';

export function createStickerGallery({ notify }) {
  let revision = 0,
    signature = '',
    urls = [];
  function clearURLs() {
    urls.forEach((url) => URL.revokeObjectURL(url));
    urls = [];
  }
  return {
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
      const nextSignature = JSON.stringify([dateKey(dates[0]), snapshot]);
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
        const stickers = await createStickers(dates, snapshot);
        if (current !== revision) return;
        const nodes = stickers.map((sticker) => {
          const url = URL.createObjectURL(sticker.blob);
          urls.push(url);
          const card = el('article', 'sticker-card');
          const preview = el('div', 'sticker-preview');
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
          card.append(el('h3', '', sticker.title), preview, actions);
          return card;
        });
        list.replaceChildren(...nodes);
        status.textContent =
          '기록을 바꾸면 자동으로 바뀌어요. 요약은 연두색 카드, 캘린더는 투명 배경이에요.';
      } catch (error) {
        if (current !== revision) return;
        signature = '';
        status.textContent = error.message;
      }
    },
  };
}
