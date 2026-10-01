import { dateKey } from '../domain/workouts.js';
import { updateRecord } from '../domain/record-actions.js';
import { resizePhoto } from '../media/photo.js';

export function createPhotoPicker({ records, onChange, notify, preparePhoto = resizePhoto }) {
  const versions = new Map();
  function invalidate(key) {
    versions.set(key, (versions.get(key) ?? 0) + 1);
  }
  async function attach(key, file) {
    if (!file || !records[key]) return;
    invalidate(key);
    const version = versions.get(key);
    notify('사진을 준비하고 있어요…');
    try {
      const photo = await preparePhoto(file);
      if (versions.get(key) !== version || !records[key]) return;
      records[key] = updateRecord(records[key], 'photo', { photo });
      onChange();
      notify('사진을 추가했어요.');
    } catch (error) {
      if (versions.get(key) === version) notify(error.message || '사진을 불러올 수 없어요.');
    }
  }
  return {
    attach,
    invalidate,
    open(date) {
      const key = dateKey(date);
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
      input.hidden = true;
      document.body.append(input);
      input.addEventListener('cancel', () => input.remove(), { once: true });
      input.addEventListener(
        'change',
        () => {
          const file = input.files[0];
          input.remove();
          void attach(key, file);
        },
        { once: true },
      );
      input.click();
    },
    remove(date) {
      const key = dateKey(date);
      invalidate(key);
      records[key] = updateRecord(records[key], 'photo', { photo: null });
      onChange();
      notify('사진을 삭제했어요.');
    },
  };
}
